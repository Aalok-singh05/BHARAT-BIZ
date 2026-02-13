"""
Service to handle messages from the Business Owner.
Commands:
- APPROVE <ORDER_ID>
- REJECT <ORDER_ID>
- HELP or MENU
"""

from app.database import SessionLocal
from app.main import approve_order, reject_order
from app.models.order_session import OrderSessionDB

def handle_owner_message(message: str) -> str:
    """
    Parse and execute commands from the owner.
    """
    text = message.strip().upper()
    parts = text.split()
    command = parts[0]

    if command == "APPROVE":
        if len(parts) < 2:
            return "❌ Usage: APPROVE <ORDER_ID>"
        
        order_id = parts[1]
        try:
            result = approve_order(order_id)
            return f"✅ Order {order_id} APPROVED.\nInvoice generated and customer notified."
        except Exception as e:
            return f"❌ Approval Failed: {str(e)}"

    elif command == "REJECT":
        if len(parts) < 2:
            return "❌ Usage: REJECT <ORDER_ID>"
        
        order_id = parts[1]
        try:
            result = reject_order(order_id)
            return f"🚫 Order {order_id} REJECTED.\nCustomer notified."
        except Exception as e:
            return f"❌ Rejection Failed: {str(e)}"

    elif command in ["HELP", "MENU"]:
        return (
            "🤖 *Owner Bot Commands*\n\n"
            "✅ `APPROVE <ID>` - Approve an order\n"
            "🚫 `REJECT <ID>` - Reject an order\n"
            "📊 `PENDING` - View pending orders\n"
        )
    
    elif command == "PENDING":
         return fetch_pending_orders_summary()

    else:
        return "❓ Unknown command. Reply HELP for options."


def fetch_pending_orders_summary() -> str:
    from app.workflows.order_states import OrderState
    db = SessionLocal()
    try:
        sessions = (
            db.query(OrderSessionDB)
            .filter(OrderSessionDB.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION.value)
            .all()
        )
        
        if not sessions:
            return "✅ No pending orders."
            
        msg = "📋 *Pending Orders:*\n"
        for s in sessions:
            msg += f"- {s.customer_phone}: ID `{s.order_id}`\n"
        
        return msg
    finally:
        db.close()
