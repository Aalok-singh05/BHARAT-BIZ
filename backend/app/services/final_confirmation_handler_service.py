from sqlalchemy.orm import Session
from typing import List

from app.services.customer_reply_llm_service import (
    classify_customer_reply,
    classify_final_confirmation_intent
)

from app.services.order_update_service import apply_customer_decisions
from app.services.order_session_manager import (
    get_active_session_by_phone,
    update_workflow_state,
    sync_session_items_to_db
)

from app.services.order_extractor import extract_textile_order
from app.services.inventory_service import check_inventory
from app.services.negotiation_handler_service import (
    build_final_summary,
    build_pending_negotiation_message,
    get_pending_items
)

from app.schemas.order_item_schema import OrderItem
from app.workflows.order_states import OrderState
from app.workflows.order_item_status import OrderItemStatus


# -------------------------------------------------
# ADD NEW ITEMS DURING FINAL CONFIRMATION
# -------------------------------------------------

def add_new_items_to_session(session, extracted_items):

    new_items = []

    for measurement in extracted_items:

        new_item = OrderItem(
            measurement=measurement,
            status=OrderItemStatus.NEGOTIATING
        )

        inventory_result = check_inventory(
            measurement,
            session.available_batches or [],
            measurement.color
        )

        new_item.inventory_status = inventory_result["status"]
        new_item.available_meters = inventory_result["available_meters"]
        new_item.fulfilled_batches = inventory_result["fulfilled_batches"]

        session.items.append(new_item)
        new_items.append(new_item)

    return new_items


# -------------------------------------------------
# CHECK IF NEGOTIATION REQUIRED
# -------------------------------------------------

def negotiation_required(session):

    for item in session.items:

        if item.status == OrderItemStatus.REPLACED:
            continue

        if (
            item.status == OrderItemStatus.NEGOTIATING
            and item.inventory_status in ["PARTIAL_AVAILABLE", "OUT_OF_STOCK"]
        ):
            return True

    return False


# -------------------------------------------------
# CANCEL ENTIRE ORDER
# -------------------------------------------------

def cancel_entire_order(session):

    for item in session.items:
        item.status = OrderItemStatus.CANCELLED


# -------------------------------------------------
# GET ACTIVE ITEMS
# -------------------------------------------------

def get_active_items(session):

    return [
        item for item in session.items
        if item.status not in [
            OrderItemStatus.CANCELLED,
            OrderItemStatus.REPLACED
        ]
    ]


# -------------------------------------------------
# MAIN FINAL CONFIRMATION HANDLER
# -------------------------------------------------

def handle_final_confirmation_message(db: Session, customer_phone: str, message: str):

    session = get_active_session_by_phone(db, customer_phone)

    if not session:
        return {"message": "No active order found."}

    if session.workflow_state != OrderState.FINAL_CUSTOMER_CONFIRMATION:
        return {"message": "Order is not in final confirmation stage."}

    # -------------------------------------------------
    # STEP 1 — GLOBAL INTENT CLASSIFICATION (LLM)
    # -------------------------------------------------

    global_intent = classify_final_confirmation_intent(message)

    # -------------------------------------------------
    # STEP 2 — FULL ORDER CANCEL
    # -------------------------------------------------

    if global_intent == "cancel_order":

        cancel_entire_order(session)

        sync_session_items_to_db(db, session)
        update_workflow_state(
            db,
            session.order_id,
            OrderState.ORDER_COMPLETED
        )

        db.commit() # Atomic commit

        return {
            "message": "Order cancel kar diya gaya hai.",
            "awaiting_customer_confirmation": False
        }

    # -------------------------------------------------
    # STEP 3 — CONFIRM ORDER
    # -------------------------------------------------

    if global_intent == "confirm_order":

        update_workflow_state(
            db,
            session.order_id,
            OrderState.WAITING_OWNER_CONFIRMATION
        )

        db.commit() # Atomic commit

        # -------------------------------------------------
        # 🔔 OWNER ALERT
        # -------------------------------------------------
        import os
        from app.integrations.whatsapp import send_whatsapp_message
        
        owner_phone = os.getenv("OWNER_PHONE_NUMBER")
        if owner_phone:
            # Short ID for easier typing
            short_id = str(session.order_id)[:5]
            
            alert_msg = (
                f"🚨 *New Order Alert*\n"
                f"Customer: {customer_phone}\n"
                f"Order ID: `{session.order_id}`\n\n"
                f"👉 Reply *YES* to approve instantly.\n"
                f"👉 Or `APPROVE {short_id}` / `REJECT {short_id}`"
            )
            try:
                send_whatsapp_message(owner_phone, alert_msg)
            except Exception as e:
                print(f"Failed to send owner alert: {e}")

        return {
            "message": "Order confirm ho gaya hai. Owner approval ke liye bhej diya gaya hai.",
            "awaiting_customer_confirmation": False
        }

    # -------------------------------------------------
    # STEP 4 — MODIFY ORDER (EDIT / REMOVE / ADD)
    # -------------------------------------------------

    if global_intent == "modify_order":

        # Apply item-level edits
        decision_output = classify_customer_reply(
            message,
            [item.measurement for item in session.items]
        )

        apply_customer_decisions(session, decision_output)

        # Detect new item addition
        extracted_items = extract_textile_order(message)

        if extracted_items:
            add_new_items_to_session(session, extracted_items)

        # If new negotiation needed → go back to negotiation stage
        if negotiation_required(session):

            sync_session_items_to_db(db, session)
            update_workflow_state(
                db,
                session.order_id,
                OrderState.CUSTOMER_NEGOTIATION
            )

            pending_items = get_pending_items(session)

            pending_message = build_pending_negotiation_message(
                session,
                pending_items
            )

            db.commit() # Atomic commit

            return {
                "message": pending_message,
                "awaiting_customer_confirmation": False
            }

        # If everything still valid → rebuild summary
        sync_session_items_to_db(db, session)
        summary_message = build_final_summary(session)

        db.commit() # Atomic commit

        return {
            "message": summary_message,
            "awaiting_customer_confirmation": True
        }

    # -------------------------------------------------
    # STEP 5 — UNCLEAR MESSAGE
    # -------------------------------------------------

    return {
        "message": "Kripya confirm karein — kya aap order proceed karna chahte hain ya koi change karna hai?",
        "awaiting_customer_confirmation": True
    }
