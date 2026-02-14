from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CustomerBase(BaseModel):
    business_name: Optional[str] = None
    credit_limit: Optional[float] = None

class CustomerUpdate(CustomerBase):
    pass

class CustomerOrderSummary(BaseModel):
    order_id: str
    date: datetime
    status: str
    total_amount: float
    items_summary: str

    class Config:
        from_attributes = True

class CustomerDetail(CustomerBase):
    phone_number: str
    outstanding_balance: float
    last_reminder_date: Optional[datetime] = None
    created_at: datetime
    recent_orders: List[CustomerOrderSummary] = []

    class Config:
        from_attributes = True

class CustomerListItem(BaseModel):
    phone_number: str
    business_name: Optional[str] = None
    outstanding_balance: float
    credit_limit: float
    order_count: int
    last_order_date: Optional[datetime] = None

    class Config:
        from_attributes = True
