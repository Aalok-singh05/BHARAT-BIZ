import os
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()  # Load BEFORE importing other app modules

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
from app.router import auth_router
from app.router import invoice_router
from app.router import debug_router


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


# ---------------- Routers ---------------- #
app.include_router(product_router.router)
app.include_router(customer_router.router)
app.include_router(order_history_router.router)
app.include_router(analytics_router.router)
app.include_router(inventory_router.router)
app.include_router(auth_router.router)
app.include_router(invoice_router.router)
app.include_router(debug_router.router)


# ---------------- Startup ---------------- #

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    from app.router.auth_router import setup_default_user
    setup_default_user()


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
    from app.models.customer import Customer # Import needed for lookup

    db = SessionLocal()

    try:
        # --- NORMALIZATION LOGIC ---
        input_phone = req.customer_phone.strip()
        customer = db.query(Customer).filter(Customer.phone_number == input_phone).first()
        
        if not customer:
            if not input_phone.startswith("+"):
                customer = db.query(Customer).filter(Customer.phone_number == "+" + input_phone).first()
        
        if not customer:
            if input_phone.startswith("+"):
                customer = db.query(Customer).filter(Customer.phone_number == input_phone[1:]).first()

        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer with phone {req.customer_phone} not found.")

        # Use the ACTUALLY STORED phone number
        actual_phone = customer.phone_number

        entry = add_payment(
            db=db,
            customer_phone=actual_phone,
            amount=Decimal(str(req.amount))
        )

        db.commit()

        # Fetch updated balance
        # We already have customer object attached to session, just refresh it?
        # Or re-query to be safe with session management.
        db.refresh(customer)

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
