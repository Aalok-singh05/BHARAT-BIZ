"""
Handles customer replies when in MEDIA_CONFIRMATION state.
After image/voice extraction, the bot shows what it understood and waits
for the customer to confirm, reject, or correct the extracted items.
"""

import json
from sqlalchemy.orm import Session

from app.services.llm_service import get_llm
from app.services.order_session_manager import (
    get_active_session_by_phone,
    update_workflow_state,
    sync_session_items_to_db,
    hydrate_session_from_db
)
from app.workflows.order_states import OrderState
from app.workflows.order_item_status import OrderItemStatus


def classify_media_confirmation_intent(message: str) -> str:
    """
    Classifies the customer's reply to a media order echo-back.
    Returns: "confirm" | "reject" | "edit" | "unclear"
    """
    llm = get_llm()

    prompt = f"""You are a textile order bot assistant.

The customer was shown an order extracted from their image/voice note.
They are now replying to confirm, reject, or edit it.

Classify their reply:

1. confirm → Customer agrees the order is correct.
   Examples: "haan", "yes", "sahi hai", "ok", "theek hai", "bilkul", "correct"

2. reject → Customer says the order is wrong and wants to cancel/restart.
   Examples: "nahi", "galat", "wrong", "cancel", "phir se bhejo", "ye nahi hai"

3. edit → Customer wants to modify specific items (change material, color, quantity).
   Examples: "cotton nahi silk hai", "color red nahi blue hai", "50 nahi 100 meter", "ek aur add karo"

4. unclear → Can't determine intent.

Return ONLY valid JSON:
{{"intent": "confirm | reject | edit | unclear"}}

Customer Message:
{message}"""

    try:
        response = llm.invoke(prompt)
        raw = response.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:].strip()

        parsed = json.loads(raw)
        return parsed.get("intent", "unclear")

    except Exception:
        return "unclear"


def handle_media_confirmation(db: Session, customer_phone: str, message: str) -> str:
    """
    Processes customer reply in MEDIA_CONFIRMATION state.
    """
    session = get_active_session_by_phone(db, customer_phone)

    if not session:
        return "No active order found."

    intent = classify_media_confirmation_intent(message)

    # -------------------------------------------------
    # ✅ CONFIRM — Proceed with inventory check
    # -------------------------------------------------
    if intent == "confirm":
        from app.services.order_processing_service import process_confirmed_media_order
        from app.router.message_router import get_all_inventory_batches, _build_combined_order_response

        inventory_batches = get_all_inventory_batches(db)

        result = process_confirmed_media_order(
            db=db,
            session=session,
            available_batches=inventory_batches
        )

        return _build_combined_order_response(result)

    # -------------------------------------------------
    # ❌ REJECT — Cancel and ask to retry
    # -------------------------------------------------
    elif intent == "reject":
        update_workflow_state(db, session.order_id, OrderState.ORDER_REJECTED)
        db.commit()

        return (
            "❌ Order cancel kar diya gaya hai.\n\n"
            "Dubara try karein:\n"
            "📝 Text mein bhejein: *50m red cotton*\n"
            "📷 Nayi photo bhejein\n"
            "🎤 Voice note mein batayein"
        )

    # -------------------------------------------------
    # ✏️ EDIT — Apply corrections via LLM
    # -------------------------------------------------
    elif intent == "edit":
        from app.services.customer_reply_llm_service import classify_customer_reply
        from app.services.order_update_service import apply_customer_decisions

        decision_output = classify_customer_reply(
            message,
            [item.measurement for item in session.items
             if item.status not in [OrderItemStatus.CANCELLED, OrderItemStatus.REPLACED]]
        )

        apply_customer_decisions(session, decision_output)
        sync_session_items_to_db(db, session)

        # Show updated order for re-confirmation
        active_items = [
            item for item in session.items
            if item.status not in [OrderItemStatus.CANCELLED, OrderItemStatus.REPLACED]
        ]

        if not active_items:
            update_workflow_state(db, session.order_id, OrderState.ORDER_REJECTED)
            db.commit()
            return "Sab items cancel ho gaye. Naya order bhejein."

        item_summary = "\n".join([
            f"• {i.measurement.input_quantity} {i.measurement.input_unit} {i.measurement.color or ''} {i.measurement.material_name}"
            for i in active_items
        ])

        db.commit()

        return (
            f"✏️ Updated order:\n{item_summary}\n\n"
            "Kya ab yeh sahi hai? *Haan* / *Nahi* bolein."
        )

    # -------------------------------------------------
    # ❓ UNCLEAR — Ask again
    # -------------------------------------------------
    else:
        return (
            "🤔 Samajh nahi aaya. Kripya batayein:\n"
            "• *Haan* — Order sahi hai, aage badhao\n"
            "• *Nahi* — Galat hai, cancel karo\n"
            "• Ya kya change karna hai woh batayein"
        )
