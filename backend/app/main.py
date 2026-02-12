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

# Core routing
from app.router.message_router import route_message
from app.integrations.whatsapp import send_whatsapp_message
from app.models.message import Message

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
scheduler.start()


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
        # 3️⃣ Inventory Deduction (TRANSACTION SAFE)
        # -------------------------------------------------

        for item in session.items:

            if not item.fulfilled_batches:
                continue

            for batch in item.fulfilled_batches:

                deduct_inventory_from_batch(
                    db=db,
                    batch_id=batch["batch_id"],
                    rolls_to_deduct=batch.get("rolls", 0),
                    loose_meters_to_deduct=batch.get("loose_meters", 0)
                )

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

        send_whatsapp_message(
            session.customer_phone,
            f"Your order has been approved.\n"
            f"Invoice No: {invoice.invoice_number}\n"
            f"Total: ₹{invoice.total_amount}"
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
