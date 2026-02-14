from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.order_item_schema import OrderItem

class OrderListItem(BaseModel):
    order_id: str
    customer_phone: str
    customer_name: Optional[str] = None
    created_at: datetime
    status: str
    payment_status: str
    total_amount: float
    item_count: int

    class Config:
        from_attributes = True

class OrderDetail(BaseModel):
    order_id: str
    customer_phone: str
    customer_name: Optional[str] = None
    created_at: datetime
    status: str
    payment_status: str
    total_amount: float
    
    # Invoice details
    invoice_number: Optional[str] = None
    gst_amount: Optional[float] = None
    subtotal: Optional[float] = None

    items: List[dict] # Simplified item dict or OrderItemSchema

    class Config:
        from_attributes = True
