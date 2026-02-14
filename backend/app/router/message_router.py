"""
Central message router.
Receives incoming WhatsApp messages and dispatches to the correct handler
based on the current DB-backed workflow state.

This module is a *dispatcher only* — no business logic lives here.
"""

from app.database import SessionLocal

from app.services.order_processing_service import process_customer_order
from app.services.negotiation_handler_service import handle_negotiation_message
from app.services.final_confirmation_handler_service import (
    handle_final_confirmation_message
)
from app.services.order_session_manager import get_active_session_by_phone

from app.workflows.order_states import OrderState
from app.schemas.inventory_schema import InventoryBatchSchema


# ---------------------------------------------------------
# MAIN ROUTER ENTRY
# ---------------------------------------------------------

def route_message(phone: str, message: str) -> str:

    # ---------------------------------------------------------
    # 👑 OWNER BOT INTERCEPTION
    # ---------------------------------------------------------
    import os
    from app.services.owner_handler_service import handle_owner_message

    owner_phone = os.getenv("OWNER_PHONE_NUMBER")
    # Normalize phone numbers for comparison (remove +)
    if owner_phone and phone.replace("+", "") == owner_phone.replace("+", ""):
        return handle_owner_message(message)

    db = SessionLocal()

    try:
        session = get_active_session_by_phone(db, phone)

        # -------------------------------------------------
        # 1️⃣ NEGOTIATION FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.CUSTOMER_NEGOTIATION:

            result = handle_negotiation_message(
                db=db,
                customer_phone=phone,
                message=message
            )

            return result.get("message", "Processing...")

        # -------------------------------------------------
        # 2️⃣ FINAL CONFIRMATION FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.FINAL_CUSTOMER_CONFIRMATION:

            result = handle_final_confirmation_message(
                db=db,
                customer_phone=phone,
                message=message
            )

            return result.get("message", "Processing...")

        # -------------------------------------------------
        # 3️⃣ WAITING FOR OWNER FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION.value:
            return "⏳ Your order is waiting for owner approval. We will notify you shortly."

        # -------------------------------------------------
        # 4️⃣ NEW ORDER FLOW
        # -------------------------------------------------

        inventory_batches = get_all_inventory_batches(db)

        result = process_customer_order(
            db=db,
            message=message,
            customer_phone=phone,
            available_batches=inventory_batches
        )

        # Extract first response message safely
        if "responses" in result and result["responses"]:
            first = result["responses"][0]
            return first.get("response", {}).get(
                "message",
                "Processing your request."
            )

        return "Processing your request."

    finally:
        db.close()


# ---------------------------------------------------------
# INVENTORY FETCHER
# ---------------------------------------------------------

def get_all_inventory_batches(db):
    """
    Fetch DB inventory and convert to schema
    expected by Dev-1 logic.
    """

    from app.models.inventory import InventoryBatch as DBBatch

    batches = db.query(DBBatch).all()

    converted = []

    for batch in batches:
        converted.append(
            InventoryBatchSchema(
                material_name=batch.material.material_name,
                material_id=str(batch.material_id),
                color=batch.color,
                batch_id=str(batch.batch_id),
                rolls_available=batch.rolls_available,
                meters_per_roll=batch.meters_per_roll,
                loose_meters_available=batch.loose_meters_available,
                created_at=batch.created_at
            )
        )

    return converted
