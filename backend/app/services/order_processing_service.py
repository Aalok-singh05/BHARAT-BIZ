from typing import List, Dict

from app.services.order_extractor import extract_textile_order
from app.services.inventory_service import check_inventory
from app.services.negotiation_service import generate_inventory_response
from app.services.order_session_manager import (
    create_order_session,
    update_workflow_state,
    set_negotiation_pending
)

from app.schemas.inventory_schema import InventoryBatch
from app.workflows.order_states import OrderState


def process_customer_order(
    message: str,
    customer_phone: str,
    available_batches: List[InventoryBatch]) -> Dict:
    """
    Full order processing pipeline with OrderSession creation.
    """

    extracted_items = extract_textile_order(message)

    # Create Order Session after successful extraction
    session = create_order_session(customer_phone, extracted_items)

    session.available_batches = available_batches
    
    responses = []
    negotiation_required = False

    for session_item in session.items:

        measurement = session_item.measurement
        color = measurement.color

        inventory_result = check_inventory(
            measurement,
            available_batches,
            color
        )

        # STORE INVENTORY MEMORY
        session_item.inventory_status = inventory_result["status"]
        session_item.available_meters = inventory_result["available_meters"]
        session_item.fulfilled_batches = inventory_result["fulfilled_batches"]

        negotiation_response = generate_inventory_response(
            measurement,
            inventory_result,
            color
        )

        if negotiation_response["next_step"] == "CUSTOMER_NEGOTIATION":
            negotiation_required = True

        responses.append({
            "material": measurement.material_name,
            "color": color,
            "response": negotiation_response
        })

    if negotiation_required:
        update_workflow_state(session.order_id, OrderState.CUSTOMER_NEGOTIATION)
        set_negotiation_pending(session.order_id, True)
    
    else:
        update_workflow_state(session.order_id, OrderState.WAITING_OWNER_CONFIRMATION)

    return {
        "order_id": session.order_id,
        "workflow_state": session.workflow_state,
        "responses": responses
    }
