from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.workflows.order_states import OrderState
from app.schemas.order_item_schema import OrderItem
from app.schemas.inventory_schema import InventoryBatch

class OrderSession(BaseModel):
    """
    Represents a full customer order lifecycle.
    Stored in DB and used by dashboard + workflow engine.
    """

    order_id: str
    customer_phone: str
    items: List[OrderItem] = []
    workflow_state: OrderState = OrderState.ORDER_INITIATED
    negotiation_pending: bool = False
    owner_approval_required: bool = False
    available_batches: Optional[List[InventoryBatch]] = None 
    created_at: datetime = datetime.utcnow()
    updated_at: Optional[datetime] = None
