from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.workflows.order_states import OrderState
from app.schemas.measurement_schema import TextileMeasurement


class OrderSession(BaseModel):
    """
    Represents a full customer order lifecycle.
    Stored in DB and used by dashboard + workflow engine.
    """

    order_id: str
    customer_phone: str
    items: List[TextileMeasurement] = []
    workflow_state: OrderState = OrderState.ORDER_INITIATED
    negotiation_pending: bool = False
    owner_approval_required: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: Optional[datetime] = None
