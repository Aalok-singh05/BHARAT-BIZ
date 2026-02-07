from pydantic import BaseModel
from typing import Optional, Dict
from app.workflows.order_states import OrderState


class ConversationContext(BaseModel):
    """
    Stores the state of conversation with a specific customer.
    Helps AI resume workflows and maintain multi-step interaction.
    """

    phone_number: str
    active_order_id: Optional[str] = None
    workflow_stage: OrderState = OrderState.ORDER_INITIATED
    temp_data: Dict = {}
