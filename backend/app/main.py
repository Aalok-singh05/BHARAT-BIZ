from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.order_extractor import extract_textile_order
from app.services.order_processing_service import process_customer_order
from app.services.negotiation_handler_service import handle_negotiation_message
from app.services.order_session_manager import get_active_session_by_phone

from app.schemas.inventory_schema import InventoryBatch
from app.workflows.order_states import OrderState

app = FastAPI()


class OrderRequest(BaseModel):
    message: str
    phone: str


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

    # ⭐ Step 2 — If negotiation ongoing → route to negotiation handler
    if session and session.workflow_state == OrderState.CUSTOMER_NEGOTIATION:
        return handle_negotiation_message(
            customer_phone=request.phone,
            message=request.message
        )

    # ⭐ Step 3 — Otherwise process as new order
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

    color_map = {
        "cotton": "blue",
        "polyester": "red"
    }

    result = process_customer_order(
        message=request.message,
        customer_phone=request.phone,
        available_batches=inventory,
        color_map=color_map
    )

    return result
