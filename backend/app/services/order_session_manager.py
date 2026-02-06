import uuid
from typing import Dict, Optional
from datetime import datetime

from app.schemas.order_session_schema import OrderSession
from app.schemas.measurement_schema import TextileMeasurement
from app.workflows.order_states import OrderState

# Temporary in-memory store (DB will replace this later)
ORDER_SESSION_STORE: Dict[str, OrderSession] = {}

def create_order_session(customer_phone: str,
                         items: list[TextileMeasurement]) -> OrderSession:
    """
    Creates new order session after extraction succeeds.
    """

    order_id = f'ORD_{uuid.uuid4().hex[:8]}'

    session= OrderSession(order_id= order_id,
                          customer_phone=customer_phone,
                          items=items,
                          workflow_state=OrderState.ORDER_INITIATED)
    
    ORDER_SESSION_STORE[order_id] = session

    return session

def get_order_session(order_id: str) -> Optional[OrderSession]:
    """
    Fetch order session.
    """
    return ORDER_SESSION_STORE.get(order_id)


def update_workflow_state(order_id: str,
                          new_state: OrderState) -> Optional[OrderSession]:
    """
    Updates workflow stage of order.
    """
    session= ORDER_SESSION_STORE.get(order_id)

    if not session:
        return None
    
    session.workflow_state = new_state
    session.updated_at=datetime.utcnow()

    ORDER_SESSION_STORE[order_id] = session

    return session

def set_negotiation_pending(order_id: str,status: bool):
    session = ORDER_SESSION_STORE.get(order_id)

    if session:
        session.negotiation_pending = status
        session.updated_at= datetime.utcnow()

def set_owner_approval(order_id: str, status:bool):

    session= ORDER_SESSION_STORE.get(order_id)

    if session:
        session.owner_approval_required= status
        session.updated_at= datetime.utcnow()
        
    
