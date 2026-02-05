from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.order_extractor import extract_textile_order

app = FastAPI()


class OrderRequest(BaseModel):
    message: str


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
