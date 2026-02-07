from pydantic import BaseModel
from typing import Optional
from uuid import uuid4

from app.schemas.measurement_schema import TextileMeasurement
from app.workflows.order_item_status import OrderItemStatus


class OrderItem(BaseModel):

    item_id: str = str(uuid4())
    measurement: TextileMeasurement
    status: OrderItemStatus = OrderItemStatus.NEGOTIATING
    replaced_by: Optional[str] = None
