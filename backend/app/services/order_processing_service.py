from typing import List, Dict
from sqlalchemy.orm import Session
from app.workflows.order_item_status import OrderItemStatus

from app.services.negotiation_handler_service import build_final_summary

from app.services.order_extractor import extract_textile_order
from app.services.inventory_service import check_inventory, get_available_colors
from app.services.negotiation_service import generate_inventory_response
from app.services.order_session_manager import (
    create_order_session,
    update_workflow_state,
    set_negotiation_pending,
    sync_session_items_to_db
)

from app.schemas.inventory_schema import InventoryBatchSchema
from app.workflows.order_states import OrderState


def process_customer_order(
    db: Session,
    message: str,
    customer_phone: str,
    available_batches: List[InventoryBatchSchema]) -> Dict:
    """
    Full order processing pipeline with DB-backed OrderSession.
    """

    extracted_items = extract_textile_order(message)

    # Create DB-backed Order Session after successful extraction
    session = create_order_session(db, customer_phone, extracted_items)

    session.available_batches = available_batches
    
    responses = []
    negotiation_required = False

    for session_item in session.items:

        measurement = session_item.measurement
        color = measurement.color

        if not color:
            # -------------------------------------------------
            # ⭐ HANDLE MISSING COLOR
            # -------------------------------------------------
            possible_colors = get_available_colors(available_batches, measurement.material_name)
            
            if possible_colors:
                color_list = ", ".join(possible_colors)
                message = (
                    f"{measurement.material_name} ke liye color nahi bataya aapne.\n"
                    f"Available colors: {color_list}\n"
                    "Kaunsa color chahiye?"
                )
                negotiation_response = {
                    "message": message,
                    "next_step": "CUSTOMER_NEGOTIATION"
                }
                # Mark as negotiating (it already is by default)
                session_item.status = OrderItemStatus.NEGOTIATING
            else:
                # No stock at all for this material
                message = f"{measurement.material_name} abhi stock mein available nahi hai."
                negotiation_response = {
                    "message": message,
                    "next_step": "OUT_OF_STOCK"
                }
                session_item.inventory_status = "OUT_OF_STOCK"

        else:
            # -------------------------------------------------
            # ⭐ NORMAL INVENTORY CHECK
            # -------------------------------------------------
            inventory_result = check_inventory(
                measurement,
                available_batches,
                color
            )

            # STORE INVENTORY MEMORY
            session_item.inventory_status = inventory_result["status"]
            session_item.available_meters = inventory_result["available_meters"]
            session_item.fulfilled_batches = inventory_result["fulfilled_batches"]

            # -------------------------------------------------
            # 🐛 BUG FIX: Auto-Accept if Full
            # -------------------------------------------------
            if inventory_result["status"] == "FULL_AVAILABLE":
                session_item.status = OrderItemStatus.ACCEPTED

            negotiation_response = generate_inventory_response(
                measurement,
                inventory_result,
                color
            )

        if negotiation_response["next_step"] in "CUSTOMER_NEGOTIATION":
            negotiation_required = True

        responses.append({
            "material": measurement.material_name,
            "color": color or "Pending",
            "response": negotiation_response
        })

    if negotiation_required:

        sync_session_items_to_db(db, session)
        update_workflow_state(
            db,
            session.order_id,
            OrderState.CUSTOMER_NEGOTIATION
        )
    
    
    else:

        # ⭐ Move to FINAL CUSTOMER CONFIRMATION instead
        sync_session_items_to_db(db, session)
        update_workflow_state(
            db,
            session.order_id,
            OrderState.FINAL_CUSTOMER_CONFIRMATION
        )

        summary_message = build_final_summary(session)
        
        db.commit() # Atomic commit

        return {
            "order_id": session.order_id,
            "workflow_state": session.workflow_state,
            "responses": responses
        }
