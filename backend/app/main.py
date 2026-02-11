from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os

# Database & models
from app.database import Base, engine
import app.models  # IMPORTANT: loads all models

# Scheduler
from apscheduler.schedulers.background import BackgroundScheduler
from app.scheduler.reminders import check_overdue_customers

# Services & business logic
from app.services.order_extractor import extract_textile_order
from app.services.order_processing_service import process_customer_order
from app.services.negotiation_handler_service import handle_negotiation_message
from app.services.order_session_manager import get_active_session_by_phone
from app.integrations.whatsapp import send_whatsapp_message

from app.schemas.inventory_schema import InventoryBatch
from app.workflows.order_states import OrderState
from app.services.final_confirmation_handler_service import (
    handle_final_confirmation_message
)
from app.router.message_router import route_message
from dotenv import load_dotenv

load_dotenv()


# ---------------- APP INIT ---------------- #

app = FastAPI(title="Textile AI Backend")


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


# ---------------- Test Inventory Builder ---------------- #

def build_test_inventory():
    """
    Temporary inventory until DB inventory is connected.
    """

    return [
        InventoryBatch(
            material_name="cotton",
            color="blue",
            batch_id="COTTON_B1",
            rolls_available=2,
            meters_per_roll=10,
            loose_meters_available=5
        ),
        InventoryBatch(
            material_name="polyester",
            color="red",
            batch_id="POLY_B1",
            rolls_available=1,
            meters_per_roll=8,
            loose_meters_available=2
        )
    ]


# ---------------- Routes ---------------- #

@app.get("/")
def root():
    return {"status": "AI Textile Agent Running"}


@app.post("/extract-order")
def extract_order(request: OrderRequest):
    try:
        items = extract_textile_order(request.message)

        return {
            "extracted_items": [dict(item) for item in items]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/process-order")
def process_order(request: OrderRequest):

    # ⭐ Step 1 — Check active session
    session = get_active_session_by_phone(request.phone)

    # -------------------------------------------------
    # ⭐ NEGOTIATION ROUTE
    # -------------------------------------------------

    if session and session.workflow_state == OrderState.CUSTOMER_NEGOTIATION:

        return handle_negotiation_message(
            customer_phone=request.phone,
            message=request.message
        )

    # -------------------------------------------------
    # ⭐ FINAL CONFIRMATION ROUTE (NEW)
    # -------------------------------------------------

    if session and session.workflow_state == OrderState.FINAL_CUSTOMER_CONFIRMATION:

        return handle_final_confirmation_message(
            customer_phone=request.phone,
            message=request.message
        )

    # -------------------------------------------------
    # ⭐ NEW ORDER ROUTE
    # -------------------------------------------------

    inventory = build_test_inventory()

    result = process_customer_order(
        message=request.message,
        customer_phone=request.phone,
        available_batches=inventory
    )

    return result

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


from app.database import SessionLocal
from app.models.message import Message

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
            timestamp = msg["timestamp"]

            db = SessionLocal()

            # 🔐 Prevent duplicate processing
            existing = db.query(Message).filter_by(message_id=message_id).first()
            if existing:
                db.close()
                return {"status": "duplicate"}

            new_message = Message(
                message_id=message_id,
                phone_number=phone,
                direction="incoming",
                content=text
            )

            db.add(new_message)
            db.commit()
            db.close()

            print("Message stored:", phone, text)

            response_text = route_message(phone, text)
            send_whatsapp_message(phone, response_text)

    except Exception as e:
        print("Webhook error:", e)

    return {"status": "received"}
