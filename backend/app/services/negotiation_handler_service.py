from app.services.customer_reply_llm_service import classify_customer_reply
from app.services.order_update_service import (
    apply_customer_decisions,
    all_items_resolved,
    all_items_cancelled
)
from app.services.order_session_manager import (
    get_active_session_by_phone,
    update_workflow_state
)
from app.workflows.order_states import OrderState
from app.workflows.order_item_status import OrderItemStatus

from app.services.inventory_service import check_inventory
from app.services.negotiation_service import generate_inventory_response


# -------------------------------------------------
# FINAL ORDER SUMMARY BUILDER
# -------------------------------------------------

def build_final_summary(session):

    summary_lines = []

    for item in session.items:
        if item.status == OrderItemStatus.ACCEPTED:
            m = item.measurement
            summary_lines.append(
                f"• {m.normalized_meters}m {m.color} {m.material_name}"
            )

    summary = "\n".join(summary_lines)

    return (
        "Final Order Summary:\n\n"
        f"{summary}\n\n"
        "Please confirm if we should proceed with this order."
    )


# -------------------------------------------------
# GET PENDING (NEGOTIATING) ITEMS
# -------------------------------------------------

def get_pending_items(session):

    return [
        item for item in session.items
        if item.status == OrderItemStatus.NEGOTIATING
    ]


# -------------------------------------------------
# BUILD PENDING NEGOTIATION MESSAGE (CTA ONCE)
# -------------------------------------------------

def build_pending_negotiation_message(session, pending_items):

    pending_messages = []

    for item in pending_items:

        measurement = item.measurement

        inventory_result = check_inventory(
            measurement,
            getattr(session, "available_batches", []),
            measurement.color
        )

        negotiation_response = generate_inventory_response(
            measurement,
            inventory_result,
            measurement.color
        )

        # Remove repeated CTA if exists
        base_message = negotiation_response["message"].split(
            "Aap kya karna chahenge?"
        )[0].strip()

        pending_messages.append(base_message)

    combined = "\n\n".join(pending_messages)

    return combined + "\n\nAap kya karna chahenge?"


# -------------------------------------------------
# MAIN NEGOTIATION HANDLER
# -------------------------------------------------

def handle_negotiation_message(customer_phone: str, message: str):

    session = get_active_session_by_phone(customer_phone)

    if not session:
        return {"message": "No active order found."}

    if session.workflow_state != OrderState.CUSTOMER_NEGOTIATION:
        return {"message": "Order is not in negotiation stage."}

    # ⭐ Step 1 — Classify customer reply
    decision_output = classify_customer_reply(
        message,
        [item.measurement for item in session.items]
    )

    # ⭐ Step 2 — Apply decisions
    apply_customer_decisions(session, decision_output)

    # ⭐ Step 3 — Evaluate outcomes

    if all_items_cancelled(session):
        update_workflow_state(session.order_id, OrderState.ORDER_COMPLETED)

        return {
            "message": "Order cancelled successfully.",
            "awaiting_customer_confirmation": False
        }

    if all_items_resolved(session):

        summary_message = build_final_summary(session)

        return {
            "message": summary_message,
            "awaiting_customer_confirmation": True
        }

    # ⭐ Step 4 — Negotiation still active

    pending_items = get_pending_items(session)

    pending_message = build_pending_negotiation_message(
        session,
        pending_items
    )

    return {
        "message": pending_message,
        "awaiting_customer_confirmation": False
    }
