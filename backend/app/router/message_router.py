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
from app.services.order_session_manager import (
    get_active_session_by_phone,
    create_order_session,
    update_workflow_state
)
from app.services.media_confirmation_handler import handle_media_confirmation

from app.workflows.order_states import OrderState
from app.schemas.inventory_schema import InventoryBatchSchema


# ---------------------------------------------------------
# MAIN ROUTER ENTRY
# ---------------------------------------------------------

def route_message(phone: str, message: str, media_info: dict | None = None) -> str:

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
        # 0️⃣ MEDIA CONFIRMATION FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.MEDIA_CONFIRMATION:

            # If user sends a NEW image/voice while in confirmation,
            # treat as replacement — cancel old and re-extract
            if media_info:
                update_workflow_state(db, session.order_id, OrderState.ORDER_COMPLETED)
                db.commit()
                session = None  # Fall through to new order flow below
            else:
                result = handle_media_confirmation(
                    db=db,
                    customer_phone=phone,
                    message=message
                )
                return result

        # -------------------------------------------------
        # 1️⃣ NEGOTIATION FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.CUSTOMER_NEGOTIATION:

            result = handle_negotiation_message(
                db=db,
                customer_phone=phone,
                message=message
            )

            return result.get("message", "Abhi check karke batata hoon...")

        # -------------------------------------------------
        # 2️⃣ FINAL CONFIRMATION FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.FINAL_CUSTOMER_CONFIRMATION:

            result = handle_final_confirmation_message(
                db=db,
                customer_phone=phone,
                message=message
            )

            return result.get("message", "Abhi check karke batata hoon...")

        # -------------------------------------------------
        # 3️⃣ WAITING FOR OWNER FLOW
        # -------------------------------------------------
        if session and session.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION:
            return "⏳ Aapka order owner approval ke liye bheja gaya hai. Jaldi update denge."

        # -------------------------------------------------
        # 4️⃣ NEW ORDER FLOW
        # -------------------------------------------------

        # -----------------------------------------------
        # 📸 MEDIA ORDER (Image / Voice Note)
        # -----------------------------------------------
        if media_info:
            return _handle_media_order(db, phone, message, media_info)

        # -----------------------------------------------
        # 💬 TEXT ORDER (with intent classification)
        # -----------------------------------------------
        return _handle_text_order(db, phone, message)

    finally:
        db.close()


# ---------------------------------------------------------
# 📸 MEDIA ORDER HANDLER
# ---------------------------------------------------------

def _handle_media_order(db, phone: str, message: str, media_info: dict) -> str:
    """
    Handles image/voice note messages.
    Extracts items → shows echo-back → waits for confirmation.
    """
    try:
        from app.services.media_service import download_whatsapp_media

        media_bytes, mime_type = download_whatsapp_media(media_info["id"])

        if media_info["type"] == "image":
            from app.services.image_order_extractor import extract_order_from_image
            extracted_items = extract_order_from_image(media_bytes, mime_type, caption=message)

        elif media_info["type"] == "audio":
            from app.services.voice_order_extractor import extract_order_from_voice
            extracted_items = extract_order_from_voice(media_bytes, mime_type)

        else:
            return "🙏 Abhi hum sirf text, image aur voice messages support karte hain."

    except Exception as e:
        print(f"Media extraction failed: {e}")
        return (
            "❌ Media se order samajh nahi aaya.\n\n"
            "Kripya text mein order bhejein:\n"
            "Example: *50m red cotton aur 20m blue polyester*"
        )

    # Empty extraction
    if not extracted_items:
        return (
            "🤔 Is image/voice se koi order items nahi dikhe.\n\n"
            "Kripya order aise bhejein:\n"
            "📝 Text: *50m red cotton aur 20m blue polyester*\n"
            "📷 Clear photo with item list\n"
            "🎤 Voice note mein material, color, quantity batayein"
        )

    # -----------------------------------------------
    # 🔒 MEDIA CONFIRMATION GATE
    # Store items in a session and ask for confirmation
    # -----------------------------------------------
    session = create_order_session(db, phone, extracted_items)
    update_workflow_state(db, session.order_id, OrderState.MEDIA_CONFIRMATION)
    db.commit()

    # Build echo-back message
    item_lines = []
    for item in extracted_items:
        color_str = f" {item.color}" if item.color and item.color.lower() != "unknown" else ""
        item_lines.append(f"• {item.input_quantity} {item.input_unit}{color_str} {item.material_name}")

    item_summary = "\n".join(item_lines)

    prefix = "📷 Image" if media_info["type"] == "image" else "🎤 Voice note"

    return (
        f"{prefix} se samjha gaya order:\n\n"
        f"{item_summary}\n\n"
        "Kya yeh sahi hai?\n"
        "✅ *Haan* — Aage badhao\n"
        "❌ *Nahi* — Cancel karo\n"
        "✏️ Ya kya change karna hai woh batayein"
    )


# ---------------------------------------------------------
# 💬 TEXT ORDER HANDLER
# ---------------------------------------------------------

def _handle_text_order(db, phone: str, message: str) -> str:
    """
    Handles text messages with intent classification.
    Distinguishes orders from greetings, help, and general queries.
    """
    # -----------------------------------------------
    # STEP 1: Intent Classification
    # -----------------------------------------------
    from app.services.intent_classifier import classify_message_intent

    intent_result = classify_message_intent(message)
    intent = intent_result.get("intent", "unclear")

    # Non-order intents — reply directly
    if intent in ["greeting", "help", "general_query", "unclear"]:
        reply = intent_result.get("reply", "")
        if reply:
            return reply

        # Fallback replies if LLM didn't generate one
        fallback_replies = {
            "greeting": "🙏 Namaste! Aapka order lene ke liye tayaar hoon. Kya chahiye aapko?",
            "help": (
                "🤖 Main aapka textile order le sakta hoon!\n\n"
                "📝 Text mein order bhejein: *50m red cotton*\n"
                "📷 Order ki photo bhejein\n"
                "🎤 Voice note mein bata dein\n\n"
                "Kya order dena hai?"
            ),
            "general_query": "📋 Iske liye owner se baat karni hogi. Main abhi sirf orders le sakta hoon.\n\nOrder dena hai toh batayein!",
            "unclear": (
                "🤔 Samajh nahi aaya. Kya aap order dena chahte hain?\n\n"
                "Example: *50m red cotton aur 20m blue polyester*"
            ),
        }
        return fallback_replies.get(intent, fallback_replies["unclear"])

    # -----------------------------------------------
    # STEP 2: Process as order
    # -----------------------------------------------
    inventory_batches = get_all_inventory_batches(db)

    try:
        result = process_customer_order(
            db=db,
            message=message,
            customer_phone=phone,
            available_batches=inventory_batches
        )
    except (ValueError, Exception) as e:
        print(f"Order extraction failed: {e}")
        return (
            "🤔 Order samajh nahi aaya.\n\n"
            "Kripya aise bhejein:\n"
            "📝 *50m red cotton aur 20m blue polyester*\n"
            "📷 Ya order ki photo bhejein\n"
            "🎤 Ya voice note mein batayein"
        )

    # Build combined response for ALL items
    return _build_combined_order_response(result)


# ---------------------------------------------------------
# 📋 COMBINED MULTI-ITEM RESPONSE BUILDER
# ---------------------------------------------------------

def _build_combined_order_response(result: dict) -> str:
    """
    Combines ALL item responses into one WhatsApp message.
    Handles: fully available, partial, out of stock, missing fields.
    """
    responses = result.get("responses", [])

    if not responses:
        return "Order processing mein hai."

    # Single item — just return its message directly
    if len(responses) == 1:
        return responses[0].get("response", {}).get(
            "message", "Order processing mein hai."
        )

    # Multi-item — combine all with header
    lines = ["📋 *Order Status:*\n"]

    for resp in responses:
        material = resp.get("material", "Unknown")
        color = resp.get("color", "")
        item_msg = resp.get("response", {}).get("message", "")

        # Build item header
        item_label = f"{color} {material}".strip()
        lines.append(f"*{item_label}:*")
        lines.append(item_msg)
        lines.append("")  # blank line separator

    lines.append("Aap kya karna chahenge?")

    return "\n".join(lines)


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
