from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.order_extractor import extract_textile_order
from app.services.order_processing_service import process_customer_order
from app.schemas.inventory_schema import InventoryBatch

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

