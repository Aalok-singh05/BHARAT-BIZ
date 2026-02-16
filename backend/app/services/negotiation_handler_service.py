from sqlalchemy.orm import Session

from app.services.customer_reply_llm_service import classify_customer_reply
from app.services.order_update_service import (
    apply_customer_decisions,
    all_items_resolved,
    all_items_cancelled
)
from app.services.order_session_manager import (
    get_active_session_by_phone,
    update_workflow_state,
    sync_session_items_to_db
)

from app.workflows.order_states import OrderState
from app.workflows.order_item_status import OrderItemStatus

from app.services.inventory_service import check_inventory
from app.services.negotiation_service import generate_inventory_response

from app.services.alternative_service import (
    find_alternatives,
    build_alternative_message
)

# -------------------------------------------------
# FINAL ORDER SUMMARY BUILDER
# -------------------------------------------------

def build_final_summary(session):

    summary_lines = []

    for item in session.items:
        if item.status == OrderItemStatus.ACCEPTED:
            m = item.measurement
            qty = m.normalized_meters or m.input_quantity or "?"
            color = m.color or ""
            material = m.material_name or "Unknown"
            summary_lines.append(
                f"• {qty}m {color} {material}".strip()
            )

    if not summary_lines:
        return (
            "Koi item finalize nahi hua hai abhi.\n"
            "Kya kuch aur add karna hai?"
        )

    summary = "\n".join(summary_lines)

    return (
        "📋 *Final Order Summary:*\n\n"
        f"{summary}\n\n"
        "Kya yeh order confirm karein? *Haan* / *Nahi*"
    )

# -------------------------------------------------
# GET PENDING ITEMS
# -------------------------------------------------

def get_pending_items(session):

    return [
        item for item in session.items
        if item.status == OrderItemStatus.NEGOTIATING
    ]

# -------------------------------------------------
# GET ACTIVE ITEMS (excludes REPLACED and CANCELLED)
# -------------------------------------------------

def get_active_items(session):
    return [
        item for item in session.items
        if item.status not in [OrderItemStatus.CANCELLED, OrderItemStatus.REPLACED]
    ]

# -------------------------------------------------
# BUILD NEGOTIATION MESSAGE
# -------------------------------------------------

def build_pending_negotiation_message(session, pending_items):

    pending_messages = []

    for item in pending_items:

        if item.status != OrderItemStatus.NEGOTIATING:
            continue

        measurement = item.measurement

        # -------------------------------------------------
        # ⭐ ONLY OUT OF STOCK → Alternative Suggestions
        # -------------------------------------------------

        if item.inventory_status == "OUT_OF_STOCK":

            # Guard: skip alternatives if color is unknown (can't find alternatives)
            if not measurement.color:
                pending_messages.append(
                    f"{measurement.material_name or 'Item'} ka color batayein taki stock check kar sakein."
                )
                continue

            alternatives = find_alternatives(session, item)

            alt_message = build_alternative_message(
                item,
                alternatives
            )

            pending_messages.append(alt_message)
            continue

        # -------------------------------------------------
        # ⭐ USE STORED INVENTORY MEMORY
        # -------------------------------------------------

        if item.inventory_status:

            inventory_result = {
                "status": item.inventory_status,
                "available_meters": item.available_meters or 0,
                "fulfilled_batches": item.fulfilled_batches or []
            }

        else:
            # No inventory check yet and no color — prompt for missing info
            if not measurement.color:
                pending_messages.append(
                    f"{measurement.material_name or 'Item'} ka color batayein."
                )
                continue

            inventory_result = check_inventory(
                measurement,
                session.available_batches or [],
                measurement.color
            )

        # -------------------------------------------------
        # ⭐ NORMAL NEGOTIATION RESPONSE
        # -------------------------------------------------

        negotiation_response = generate_inventory_response(
            measurement,
            inventory_result,
            measurement.color
        )

        message = negotiation_response["message"]

        # Remove duplicate CTA
        if "Aap kya karna chahenge?" in message:
            message = message.split("Aap kya karna chahenge?")[0].strip()

        pending_messages.append(message)

    combined_message = "\n\n".join(pending_messages)

    return combined_message + "\n\nAap kya karna chahenge?"

# -------------------------------------------------
# MAIN NEGOTIATION HANDLER
# -------------------------------------------------

def handle_negotiation_message(db: Session, customer_phone: str, message: str):

    try:
        session = get_active_session_by_phone(db, customer_phone)

        if not session:
            return {"message": "No active order found."}

        if session.workflow_state != OrderState.CUSTOMER_NEGOTIATION:
            return {"message": "Order is not in negotiation stage."}

        # -------------------------------------------------
        # STEP 1 — LLM CLASSIFICATION (active items only)
        # -------------------------------------------------

        active_items = get_active_items(session)

        decision_output = classify_customer_reply(
            message,
            [item.measurement for item in active_items]
        )

        # -------------------------------------------------
        # STEP 2 — APPLY DECISIONS
        # -------------------------------------------------

        apply_customer_decisions(session, decision_output)

        # -------------------------------------------------
        # STEP 2.5 — DETECT NEW ITEMS IN MESSAGE
        # -------------------------------------------------

        try:
            from app.services.order_extractor import extract_textile_order
            from app.services.final_confirmation_handler_service import add_new_items_to_session

            extracted_items = extract_textile_order(message)

            if extracted_items:
                # Filter out items that match existing session materials+color pair
                existing_pairs = {
                    (
                        (item.measurement.material_name or "").lower(),
                        (item.measurement.color or "").lower()
                    )
                    for item in session.items
                    if item.status not in [OrderItemStatus.CANCELLED, OrderItemStatus.REPLACED]
                }

                new_items = [
                    item for item in extracted_items
                    if (
                        (item.material_name or "").lower(),
                        (item.color or "").lower()
                    ) not in existing_pairs
                ]

                if new_items:
                    add_new_items_to_session(session, new_items)
        except Exception as e:
            print(f"New item extraction during negotiation failed (non-critical): {e}")

        # -------------------------------------------------
        # STEP 3 — FULL ORDER CANCEL
        # -------------------------------------------------

        if all_items_cancelled(session):

            sync_session_items_to_db(db, session)
            update_workflow_state(
                db,
                session.order_id,
                OrderState.ORDER_COMPLETED
            )

            db.commit()  # Atomic commit

            return {
                "message": "Order cancel ho gaya hai.",
                "awaiting_customer_confirmation": False
            }

        # -------------------------------------------------
        # STEP 4 — ALL ITEMS RESOLVED
        # -------------------------------------------------

        if all_items_resolved(session):

            sync_session_items_to_db(db, session)
            update_workflow_state(
                db,
                session.order_id,
                OrderState.FINAL_CUSTOMER_CONFIRMATION
            )

            summary_message = build_final_summary(session)

            db.commit()  # Atomic commit

            return {
                "message": summary_message,
                "awaiting_customer_confirmation": True
            }

        # -------------------------------------------------
        # STEP 5 — NEGOTIATION CONTINUES
        # -------------------------------------------------

        sync_session_items_to_db(db, session)

        pending_items = get_pending_items(session)

        pending_message = build_pending_negotiation_message(
            session,
            pending_items
        )

        db.commit()  # Atomic commit

        return {
            "message": pending_message,
            "awaiting_customer_confirmation": False
        }

    except Exception as e:
        print(f"Negotiation handler error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "message": "⚠️ Kuch technical problem aa gayi. Kripya dobara try karein.",
            "awaiting_customer_confirmation": False
        }
