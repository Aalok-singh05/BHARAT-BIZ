from app.database import SessionLocal
from app.models.order import Order
from app.models.conversation_state import ConversationState


def route_message(phone: str, message: str):
    """
    Central routing entry point.
    WhatsApp layer must ONLY call this function.
    """

    db = SessionLocal()

    try:
        # 🔎 Step 1: Find latest order for this phone
        order = (
            db.query(Order)
            .filter(Order.customer_phone == phone)
            .order_by(Order.created_at.desc())
            .first()
        )

        # 🆕 No order exists → new customer flow
        if not order:
            return handle_new_customer(phone, message)

        # 🔎 Step 2: Fetch conversation state linked to order
        state = (
            db.query(ConversationState)
            .filter(ConversationState.order_id == order.order_id)
            .first()
        )

        # If somehow no state exists yet → treat as new flow
        if not state:
            return handle_new_customer(phone, message)

        # 🤝 Negotiation ongoing
        if state.negotiation_pending:
            return handle_negotiation(phone, message)

        # 🧾 Awaiting owner approval
        if state.awaiting_owner_confirmation:
            return handle_owner_pending(phone, message)

        # 📦 Default standard flow
        return handle_standard_message(phone, message)

    finally:
        db.close()


# -----------------------------------------------------
# Temporary Placeholder Handlers
# These will later connect to Dev-1 AI logic
# -----------------------------------------------------

from app.crud.customer import get_or_create_customer
from app.crud.order import create_order
from app.models.conversation_state import ConversationState


def handle_new_customer(phone, message):
    print("Flow: NEW CUSTOMER")

    db = SessionLocal()

    try:
        # 1️⃣ Create or get customer
        customer = get_or_create_customer(
            db,
            phone_number=phone,
            business_name=None
        )

        # 2️⃣ Create new order
        order = create_order(db, customer.phone_number)

        # 3️⃣ Create conversation state
        state = ConversationState(
            order_id=order.order_id,
            workflow_state="collecting_items",
            negotiation_pending=False,
            awaiting_owner_confirmation=False,
            last_customer_language="unknown"
        )

        db.add(state)
        db.commit()

        return "Welcome! Please tell me what material, color, and quantity you need."

    finally:
        db.close()


def handle_negotiation(phone, message):
    print("Flow: NEGOTIATION")
    return f"Noted. Let me check that for you."


def handle_owner_pending(phone, message):
    print("Flow: OWNER APPROVAL PENDING")
    return f"Your order is awaiting confirmation. I will update you soon."


def handle_standard_message(phone, message):
    print("Flow: STANDARD")
    return f"Processing your request."
