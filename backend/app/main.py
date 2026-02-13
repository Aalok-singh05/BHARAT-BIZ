import os
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Database & models
from app.database import Base, engine, SessionLocal
import app.models  # IMPORTANT: loads all models

# Scheduler
from apscheduler.schedulers.background import BackgroundScheduler
from app.scheduler.reminders import check_overdue_customers
from app.scheduler.alerts import check_low_stock_daily
from app.scheduler.alerts import check_low_stock_daily

# Core routing
from app.router.message_router import route_message
from app.integrations.whatsapp import send_whatsapp_message, upload_media, send_document_message
from app.utils.pdf import generate_invoice_pdf
from app.models.message import Message

from app.router import product_router
from app.router import customer_router
from app.router import order_history_router
from app.router import analytics_router
from app.router import inventory_router

load_dotenv()

logger = logging.getLogger(__name__)


app = FastAPI(title="Textile AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Scheduler ---------------- #

scheduler = BackgroundScheduler()
scheduler.add_job(check_overdue_customers, "interval", days=7)
scheduler.add_job(check_overdue_customers, "interval", days=7)
scheduler.start()


# ---------------- Routers ---------------- #
app.include_router(product_router.router)
app.include_router(customer_router.router)
app.include_router(order_history_router.router)
app.include_router(analytics_router.router)
app.include_router(inventory_router.router)


# ---------------- Startup ---------------- #

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ---------------- Schemas ---------------- #

class OrderRequest(BaseModel):
    message: str
    phone: str


# ---------------- Routes ---------------- #

@app.get("/")
def root():
    return {"status": "AI Textile Agent Running"}



VERIFY_TOKEN = os.getenv("WEBHOOK_VERIFY_TOKEN")


@app.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        return PlainTextResponse(content=challenge)

    return PlainTextResponse(content="Verification failed", status_code=403)


@app.post("/webhook")
async def receive_message(request: Request):
    body = await request.json()

    try:
        entry = body["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]

        if "messages" in value:
            msg = value["messages"][0]
            phone = msg["from"]
            text = msg["text"]["body"]
            message_id = msg["id"]

            db = SessionLocal()

            try:
                # Idempotency: skip duplicate messages
                existing = db.query(Message).filter_by(message_id=message_id).first()
                if existing:
                    return {"status": "duplicate"}

                # Store incoming message
                new_message = Message(
                    message_id=message_id,
                    phone_number=phone,
                    direction="incoming",
                    content=text
                )
                db.add(new_message)
                db.commit()
            finally:
                db.close()

            logger.info(f"Message received: {phone} → {text[:50]}...")

            response_text = route_message(phone, text)
            send_whatsapp_message(phone, response_text)

    except Exception as e:
        logger.error(f"Webhook error: {e}", exc_info=True)

    return {"status": "received"}

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.order_session import OrderSessionDB
from app.services.order_session_manager import (
    get_session_by_order_id,
    update_workflow_state
)
from app.crud.inventory import deduct_inventory_from_batch
from app.crud.invoice import create_invoice
from app.integrations.whatsapp import send_whatsapp_message
from app.workflows.order_states import OrderState


# ================================================================
# 📋 PENDING ORDERS (For Approval Queue Dashboard)
# ================================================================

@app.get("/orders/pending")
def get_pending_orders():
    """
    Fetch all orders awaiting owner confirmation.
    Powers the Approval Queue in the Web Dashboard.
    """
    from app.models.order_session_item import OrderSessionItemDB
    from app.models.customer import Customer
    from app.models.material import Material

    db = SessionLocal()

    try:
        sessions = (
            db.query(OrderSessionDB)
            .filter(OrderSessionDB.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION.value)
            .order_by(OrderSessionDB.created_at.desc())
            .all()
        )

        result = []
        for session in sessions:
            # Fetch customer name
            customer = (
                db.query(Customer)
                .filter(Customer.phone_number == session.customer_phone)
                .first()
            )

            # Build item list
            items = []
            total_estimate = 0
            for item in session.items:
                material_name = item.material_name or "Unknown"
                qty = float(item.normalized_meters or item.input_quantity or 0)

                items.append({
                    "material": material_name,
                    "quantity": qty,
                    "price_per_meter": 0,  # Price resolved at invoice time
                    "status": item.status or "PENDING"
                })

            result.append({
                "order_id": str(session.order_id),
                "customer_phone": session.customer_phone,
                "customer_name": customer.business_name if customer else None,
                "items": items,
                "total_estimate": float(total_estimate),
                "created_at": session.created_at.isoformat() if session.created_at else None
            })

        return {"orders": result, "count": len(result)}

    finally:
        db.close()


@app.post("/orders/{order_id}/approve")
def approve_order(order_id: str):

    db: Session = SessionLocal()

    try:
        # -------------------------------------------------
        # 1️⃣ Fetch session from DB (restart-safe)
        # -------------------------------------------------

        session = get_session_by_order_id(db, order_id)

        if not session:
            raise HTTPException(status_code=404, detail="Order session not found")

        # -------------------------------------------------
        # 2️⃣ Validate workflow state (idempotency guard)
        # -------------------------------------------------

        db_session = (
            db.query(OrderSessionDB)
            .filter(OrderSessionDB.order_id == order_id)
            .first()
        )

        if not db_session:
            raise HTTPException(status_code=404, detail="Session record not found")

        if db_session.workflow_state != OrderState.WAITING_OWNER_CONFIRMATION.value:
            raise HTTPException(
                status_code=400,
                detail=f"Order not awaiting owner confirmation (current: {db_session.workflow_state})"
            )

        # -------------------------------------------------
        # 3️⃣ Inventory Deduction & Item Migration
        # -------------------------------------------------

        from app.models.order_item import OrderItem
        from app.models.material import Material

        for item in session.items:

            # 3.1 Deduct Inventory using fulfilled_batches
            if item.fulfilled_batches:
                for batch in item.fulfilled_batches:
                    deduct_inventory_from_batch(
                        db=db,
                        batch_id=batch["batch_id"],
                        rolls_to_deduct=batch.get("rolls", 0),
                        loose_meters_to_deduct=batch.get("loose_meters", 0)
                    )

            # 3.2 Create Permanent OrderItem Record (Needed for Invoice)
            # Fetch material ID (assuming material_name is unique/correct)
            material_id = None
            mat_name = item.measurement.material_name
            logger.info(f"Looking up material: {mat_name}")
            
            mat_obj = db.query(Material).filter(Material.material_name == mat_name).first()
            if mat_obj:
                material_id = mat_obj.material_id
            else:
                logger.error(f"Material '{mat_name}' NOT found in DB. Cannot create OrderItem.")

            # If material not found, we skip or error? For now, if missing, we can't create valid OrderItem.
            if material_id:
                # Use DB price if available, fallback to 150 if somehow missing (shouldn't happen with default)
                price = 150.0
                if mat_obj and hasattr(mat_obj, 'price_per_meter'):
                     price = float(mat_obj.price_per_meter)

                new_permanent_item = OrderItem(
                    order_id=order_id,
                    material_id=material_id,
                    quantity_meters=item.measurement.normalized_meters,
                    price_per_meter=price
                )
                db.add(new_permanent_item)
                logger.info(f"Created permanent item for material {mat_name} at price {price}")
        
        db.flush() # Persist OrderItems so create_invoice can find them
        
        # Verify items exist before invoicing
        count_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).count()
        if count_items == 0:
            raise HTTPException(status_code=500, detail=f"Failed to migrate order items. Check server logs for material lookup failures.")

        # -------------------------------------------------
        # 4️⃣ Create Invoice
        # -------------------------------------------------

        invoice = create_invoice(db, order_id)

        # -------------------------------------------------
        # 5️⃣ Update Workflow State
        # -------------------------------------------------

        update_workflow_state(db, order_id, OrderState.ORDER_COMPLETED)

        # -------------------------------------------------
        # 6️⃣ Notify Customer
        # -------------------------------------------------
        
        db.commit() # Atomic commit (Inventory + Invoice + State)

        # -------------------------------------------------
        # 6️⃣ Notify Customer with Invoice PDF
        # -------------------------------------------------
        try:
            # 1. Fetch Data for PDF
            customer = db.query(Customer).filter(Customer.phone_number == session.customer_phone).first()
            customer_name = customer.business_name if customer else "Valued Customer"
            
            # Re-query items to get price details
            pdf_items = []
            db_items = db.query(OrderItem, Material.material_name).join(Material, OrderItem.material_id == Material.material_id).filter(OrderItem.order_id == order_id).all()
            
            for item, mat_name in db_items:
                pdf_items.append({
                    "material": mat_name,
                    "qty": float(item.quantity_meters or 0),
                    "rate": float(item.price_per_meter or 150),
                    "amount": float((item.quantity_meters or 0) * (item.price_per_meter or 150))
                })

            pdf_context = {
                "invoice_number": invoice.invoice_number,
                "date": invoice.issued_at.strftime("%Y-%m-%d"),
                "customer_name": customer_name,
                "customer_phone": session.customer_phone,
                "items": pdf_items,
                "subtotal": float(invoice.total_amount - invoice.gst_amount),
                "gst": float(invoice.gst_amount),
                "total": float(invoice.total_amount)
            }
            
            # 2. Generate PDF
            pdf_filename = f"Invoice_{invoice.invoice_number}.pdf"
            pdf_path = os.path.join(os.getcwd(), pdf_filename)
            generate_invoice_pdf(pdf_context, pdf_path)
            
            # 3. Upload & Send
            media_id = upload_media(pdf_path)
            if media_id:
                send_document_message(
                    session.customer_phone,
                    media_id,
                    pdf_filename,
                    caption=f"Billed: ₹{invoice.total_amount}"
                )
            else:
                # Fallback to text if upload fails
                send_whatsapp_message(
                    session.customer_phone,
                    f"Order Approved! Invoice: {invoice.invoice_number}. Total: ₹{invoice.total_amount}"
                )

            # Cleanup
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

        except Exception as notify_ex:
            logging.error(f"Failed to send invoice PDF: {notify_ex}")
            send_whatsapp_message(
                session.customer_phone, 
                f"Order Approved! Total: ₹{invoice.total_amount}. (Invoice PDF generation failed)"
            )

        return {
            "status": "approved",
            "invoice_number": invoice.invoice_number
        }

    except Exception as e:
        db.rollback()
        raise e

    finally:
        db.close()


@app.post("/orders/{order_id}/reject")
def reject_order(order_id: str):

    db: Session = SessionLocal()

    try:
        # -------------------------------------------------
        # 1️⃣ Fetch session from DB
        # -------------------------------------------------

        session = get_session_by_order_id(db, order_id)

        if not session:
            raise HTTPException(status_code=404, detail="Order session not found")

        # -------------------------------------------------
        # 2️⃣ Validate workflow state
        # -------------------------------------------------

        db_session = (
            db.query(OrderSessionDB)
            .filter(OrderSessionDB.order_id == order_id)
            .first()
        )

        if not db_session:
            raise HTTPException(status_code=404, detail="Session record not found")

        if db_session.workflow_state != OrderState.WAITING_OWNER_CONFIRMATION.value:
            raise HTTPException(
                status_code=400,
                detail=f"Order not awaiting owner confirmation (current: {db_session.workflow_state})"
            )

        # -------------------------------------------------
        # 3️⃣ Update Workflow State (no deduction, no invoice)
        # -------------------------------------------------

        update_workflow_state(db, order_id, OrderState.ORDER_REJECTED)

        # -------------------------------------------------
        # 4️⃣ Notify Customer
        # -------------------------------------------------
        
        db.commit() # Atomic commit

        send_whatsapp_message(
            session.customer_phone,
            "Your order has been rejected by the owner. "
            "Please contact them for more details."
        )

        return {"status": "rejected", "order_id": order_id}

    except Exception as e:
        db.rollback()
        raise e

    finally:
        db.close()


# ================================================================
# 💰 PAYMENT ENDPOINTS
# ================================================================

class PaymentRequest(BaseModel):
    customer_phone: str
    amount: float
    mode: str = "cash"  # cash, upi, bank_transfer, cheque


@app.post("/payments/add")
def record_payment(req: PaymentRequest):
    """
    Record a payment from a customer.
    Reduces their outstanding balance.
    """
    from decimal import Decimal
    from app.crud.credit import add_payment

    db = SessionLocal()

    try:
        entry = add_payment(
            db=db,
            customer_phone=req.customer_phone,
            amount=Decimal(str(req.amount))
        )

        db.commit()

        # Fetch updated balance
        from app.models.customer import Customer
        customer = (
            db.query(Customer)
            .filter(Customer.phone_number == req.customer_phone)
            .first()
        )

        return {
            "status": "success",
            "transaction_id": str(entry.transaction_id),
            "amount_paid": float(req.amount),
            "mode": req.mode,
            "new_outstanding_balance": float(customer.outstanding_balance)
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        db.rollback()
        logger.error(f"Payment recording failed: {e}")
        raise HTTPException(status_code=500, detail="Payment recording failed")

    finally:
        db.close()


@app.get("/customers/{phone}/balance")
def get_customer_balance(phone: str):
    """
    Quick balance check for a customer.
    """
    from app.models.customer import Customer

    db = SessionLocal()

    try:
        customer = (
            db.query(Customer)
            .filter(Customer.phone_number == phone)
            .first()
        )

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        return {
            "customer_phone": customer.phone_number,
            "business_name": customer.business_name,
            "outstanding_balance": float(customer.outstanding_balance),
            "credit_limit": float(customer.credit_limit)
        }

    finally:
        db.close()


# ================================================================
# ⚙️ GST CONFIGURATION ENDPOINTS
# ================================================================

class GSTConfigRequest(BaseModel):
    category: str = "default"
    gst_rate: float  # e.g. 0.05 for 5%, 0.12 for 12%


@app.get("/config/gst")
def list_gst_rates():
    """
    List all configured GST rates.
    """
    from app.crud.gst_config import get_all_gst_rates

    db = SessionLocal()

    try:
        rates = get_all_gst_rates(db)
        return {
            "rates": [
                {
                    "category": r.category,
                    "gst_rate": float(r.gst_rate),
                    "gst_percent": f"{float(r.gst_rate) * 100:.1f}%"
                }
                for r in rates
            ]
        }

    finally:
        db.close()


@app.post("/config/gst")
def set_gst_rate(req: GSTConfigRequest):
    """
    Set or update GST rate for a category.
    """
    from decimal import Decimal
    from app.crud.gst_config import set_gst_rate as _set_gst_rate

    if req.gst_rate < 0 or req.gst_rate > 1:
        raise HTTPException(
            status_code=400,
            detail="GST rate must be between 0 and 1 (e.g. 0.05 for 5%)"
        )

    db = SessionLocal()

    try:
        config = _set_gst_rate(
            db=db,
            category=req.category,
            rate=Decimal(str(req.gst_rate))
        )

        return {
            "status": "success",
            "category": config.category,
            "gst_rate": float(config.gst_rate),
            "gst_percent": f"{float(config.gst_rate) * 100:.1f}%"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"GST config update failed: {e}")
        raise HTTPException(status_code=500, detail="GST config update failed")

    finally:
        db.close()

# ----------------------------------------------------------------
# ⏰ SCHEDULER INITIALIZATION
# ----------------------------------------------------------------
@app.on_event("startup")
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_overdue_customers, 'interval', hours=24)
    scheduler.add_job(check_low_stock_daily, 'cron', hour=9, minute=0) # Daily alert at 9 am
    scheduler.start()
