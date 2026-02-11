from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from uuid import uuid4

from app.schemas.measurement_schema import TextileMeasurement
from app.workflows.order_item_status import OrderItemStatus

class OrderItem(BaseModel):

    item_id: str = Field(default_factory=lambda: str(uuid4()))
    measurement: TextileMeasurement
    status: OrderItemStatus = OrderItemStatus.NEGOTIATING
    replaced_by: Optional[str] = None

    # Negotiation tracking
    inventory_status: Optional[str] = None
    available_meters: Optional[float] = None
    fulfilled_batches: Optional[List[Dict]] = None

    # Original customer demand tracking
    requested_meters: Optional[float] = None
