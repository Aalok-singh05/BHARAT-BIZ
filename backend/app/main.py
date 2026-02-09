from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


# Database & models

from app.database import Base, engine
import app.models  # IMPORTANT: loads all models


# Scheduler

from apscheduler.schedulers.background import BackgroundScheduler
from app.scheduler.reminders import check_overdue_customers


# Services & business logic

from app.services.order_extractor import extract_textile_order
from app.services.order_processing_service import process_customer_order
from app.schemas.inventory_schema import InventoryBatch


# App initialization

app = FastAPI(title="Textile AI Backend")


# Scheduler setup

scheduler = BackgroundScheduler()
scheduler.add_job(
    check_overdue_customers,
    "interval",
    days=1
)
scheduler.start()


# Startup events

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# Schemas

class OrderRequest(BaseModel):
    message: str


# Routes
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

    # MOCK inventory (temporary until DB ready)
    inventory = [
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

    # Temporary color mapping
    color_map = {
        "cotton": "blue",
        "polyester": "red"
    }

    result = process_customer_order(
        request.message,
        inventory,
        color_map
    )

    return result
