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

    # ⭐ Create Order Session after successful extraction
    session = create_order_session(customer_phone, extracted_items)

    responses = []
    negotiation_required = False

    for item in extracted_items:

        # ⭐ NEW — Color comes from extracted item
        color = item.color

        inventory_result = check_inventory(
            item,
            available_batches,
            color
        )

        negotiation_response = generate_inventory_response(
            item,
            inventory_result,
            color
        )

        if negotiation_response["next_step"] == "CUSTOMER_NEGOTIATION":
            negotiation_required = True

        responses.append({
            "material": item.material_name,
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
