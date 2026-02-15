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

    # -------------------------------------------------
    # 🚨 PROACTIVE OVERDUE CHECK
    # -------------------------------------------------
    from app.models.customer import Customer
    from app.models.credit_ledger import CreditLedger
    from datetime import datetime, timedelta
    from app.integrations.whatsapp import send_whatsapp_message
    import os

    customer = db.query(Customer).filter(Customer.phone_number == customer_phone).first()
    
    if customer and customer.outstanding_balance > 0:
        # Check last payment date
        last_payment = (
            db.query(CreditLedger)
            .filter(CreditLedger.customer_phone == customer_phone, CreditLedger.type == "payment")
            .order_by(CreditLedger.created_at.desc())
            .first()
        )
        
        if last_payment:
            last_activity = last_payment.created_at
        else:
            last_activity = customer.created_at

        # Ensure last_activity is timezone-aware
        if last_activity and last_activity.tzinfo is None:
             # Assume UTC if naive, or just use as is? 
             # Safer: Make current time naive if db time is naive, or both aware.
             # DB returns aware usually. 
             pass

        # Use timezone-aware current time
        from datetime import timezone
        current_time = datetime.now(timezone.utc)
        
        # If last_activity is naive (unlikely with Postgres/SQLAlchemy DateTime(timezone=True)), make it aware?
        # Actually, let's just make both aware or both naive.
        # Simplest: make current time aware.
        
        if last_activity.tzinfo is None:
             last_activity = last_activity.replace(tzinfo=timezone.utc)
             
        overdue_days = (current_time - last_activity).days
        
        if overdue_days > 7:
            # FREEZE ORDER
            session.owner_approval_required = True
            update_workflow_state(db, session.order_id, OrderState.WAITING_OWNER_CONFIRMATION)
            
            # Notify Owner
            owner_phone = os.getenv("OWNER_PHONE_NUMBER")
            if owner_phone:
                item_summary = ", ".join([f"{i.measurement.material_name} ({i.measurement.input_quantity})" for i in session.items])
                msg = (
                    f"⚠️ *Approval Needed* (Overdue)\n\n"
                    f"Customer: {customer.business_name or customer_phone}\n"
                    f"Overdue: ₹{float(customer.outstanding_balance)} ({overdue_days} days)\n"
                    f"Order: {item_summary}\n\n"
                    f"Reply 'YES' to approve."
                )
                send_whatsapp_message(owner_phone, msg)
            
            return {
                "order_id": session.order_id,
                "workflow_state": OrderState.WAITING_OWNER_CONFIRMATION,
                "responses": [{
                    "response": {
                        "message": f"⚠️ Your account is overdue by ₹{customer.outstanding_balance}. \nYour order is waiting for owner approval.",
                        "next_step": "WAITING_OWNER"
                    }
                }]
            }

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

        return {
            "order_id": session.order_id,
            "workflow_state": OrderState.CUSTOMER_NEGOTIATION,
            "responses": responses
        }
    
    
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
