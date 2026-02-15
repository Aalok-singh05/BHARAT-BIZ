"""
Service to handle messages from the Business Owner.
Commands:
- APPROVE <ORDER_ID>
- REJECT <ORDER_ID>
- HELP or MENU
"""

from app.database import SessionLocal
from app.router.order_history_router import approve_order, reject_order
from app.models.order_session import OrderSessionDB
from sqlalchemy import func, String
import os

def handle_owner_message(message: str) -> str:
    """
    Parse and execute commands from the owner.
    """
    import uuid
    from app.workflows.order_states import OrderState

    text = message.strip().upper()
    parts = text.split()
    command = parts[0]

    # Helper to find order by short ID or latest
    def resolve_order(db, identifier=None):
        query = db.query(OrderSessionDB).filter(
            OrderSessionDB.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION.value
        )
        if identifier:
            # Filter by matching START of UUID
            # Cast UUID to string in DB or fetch all and filter in Python (MVP safe for low volume)
            all_pending = query.all()
            matches = [s for s in all_pending if str(s.order_id).startswith(identifier.lower())]
            if len(matches) == 1:
                return matches[0]
            elif len(matches) > 1:
                return None # Ambiguous
            return None
        else:
            # Return LATEST pending order
            return query.order_by(OrderSessionDB.updated_at.desc()).first()

    db = SessionLocal()
    try:
        if command in ["YES", "APPROVE"] and len(parts) == 1:
            # Approve LATEST
            session = resolve_order(db)
            if not session:
                return "⚠️ No pending orders to approve."
            
            try:
                approve_order(str(session.order_id))
                return f"✅ Order {session.order_id} APPROVED (Latest).\nInvoice generated."
            except Exception as e:
                return f"❌ Approval Failed: {str(e)}"

        elif command == "APPROVE":
            # Approve SPECIFIC (Short ID or Full ID)
            identifier = parts[1]
            session = resolve_order(db, identifier)
            if not session:
                return f"❌ Order starting with '{identifier}' not found."
            
            try:
                approve_order(str(session.order_id))
                return f"✅ Order {session.order_id} APPROVED."
            except Exception as e:
                return f"❌ Approval Failed: {str(e)}"

        elif command == "REJECT":
            if len(parts) < 2:
                 # Reject LATEST logic if desired? Or start with specific. 
                 # Let's enforce ID for reject to be safe, OR allowed YES/NO logic? 
                 # User asked for easier APPROVE. Keeping REJECT specific is safer.
                 # But let's allow "NO" for Reject Latest too?
                 return "❌ Usage: REJECT <ID> (First 5 chars ok)"

            identifier = parts[1]
            session = resolve_order(db, identifier)
            if not session:
                return f"❌ Order starting with '{identifier}' not found."
            
            try:
                reject_order(str(session.order_id))
                return f"🚫 Order {session.order_id} REJECTED."
            except Exception as e:
                return f"❌ Rejection Failed: {str(e)}"

        elif command == "NO":
            # Reject LATEST
            session = resolve_order(db)
            if not session:
                return "⚠️ No pending orders to reject."
            
            try:
                reject_order(str(session.order_id))
                return f"🚫 Order {session.order_id} REJECTED (Latest)."
            except Exception as e:
                return f"❌ Rejection Failed: {str(e)}"

        elif command == "SEND":
            # Forward Invoice to Customer
            if len(parts) < 2:
                return "❌ Usage: SEND <ID> (First 5 chars ok)"

            identifier = parts[1]
            from app.models.order import Order
            from app.models.invoice import Invoice
            from app.integrations.whatsapp import upload_media, send_document_message, send_whatsapp_message

            # Find Order
            # Logic similar to resolve_order but searching COMPLETED orders too?
            # Actually, invoices are only for APPROVED/COMPLETED orders.
            # Let's search by ID directly.
            
            # Try to find order by ID starting with identifier
            order = db.query(Order).filter(func.cast(Order.order_id, String).startswith(identifier.lower())).first()
            
            if not order:
                 return f"❌ Order '{identifier}' not found."

            # Find Invoice
            invoice = db.query(Invoice).filter(Invoice.order_id == order.order_id).first()
            if not invoice:
                return f"❌ No invoice found for Order {identifier}."

            if not invoice.pdf_path or not os.path.exists(invoice.pdf_path):
                return "❌ Invoice PDF file missing on server."

            # Send to Customer
            try:
                mid = upload_media(invoice.pdf_path)
                if mid:
                    caption = (
                        f"🧾 Here is your invoice for Order #{invoice.invoice_number}.\n"
                        f"Amount: ₹{invoice.total_amount}"
                    )
                    send_document_message(order.customer_phone, mid, os.path.basename(invoice.pdf_path), caption=caption)
                    return f"✅ Invoice sent to {order.customer_phone}."
                else:
                    return "❌ Failed to upload PDF to WhatsApp."
            except Exception as e:
                return f"❌ Sending failed: {str(e)}"
    
        elif command in ["HELP", "MENU"]:
            return (
                "🤖 *Owner Bot Commands*\n\n"
                "✅ *YES* - Approve latest pending order\n"
                "✅ `APPROVE <ID>` - Approve specific order\n"
                "🚫 *NO* - Reject latest pending order\n"
                "🚫 `REJECT <ID>` - Reject specific order\n"
                "📨 `SEND <ID>` - Send invoice to customer\n"
                "📊 `PENDING` - View pending list\n"
            )
        
        elif command == "PENDING":
             return fetch_pending_orders_summary()
    
        else:
            return "❓ Unknown command. Reply HELP for options."
    
    finally:
        db.close()


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
