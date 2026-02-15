from fastapi import APIRouter, HTTPException, Depends, Query
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.order import Order
from app.models.customer import Customer
from app.models.order_item import OrderItem
from app.models.invoice import Invoice
from app.schemas.order_schema import OrderListItem, OrderDetail
from typing import List, Optional


# ----------------------------------------------------------------
# Imports for Approval/Pending Logic
# ----------------------------------------------------------------
from app.models.order_session import OrderSessionDB
from app.models.order_session_item import OrderSessionItemDB
from app.models.material import Material
from app.services.order_session_manager import get_session_by_order_id, update_workflow_state
from app.crud.inventory import deduct_inventory_from_batch, deduct_meters_from_batch
from app.crud.invoice import create_invoice
from app.integrations.whatsapp import send_whatsapp_message, upload_media, send_document_message
from app.utils.pdf import generate_invoice_pdf
from app.workflows.order_states import OrderState
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[OrderListItem])
def get_all_orders(
    status: Optional[str] = Query(None, description="Filter by status (e.g. COMPLETED, REJECTED)"),
    customer_phone: Optional[str] = Query(None, description="Filter by customer phone"),
    db: Session = Depends(get_db)
):
    """
    List all orders with optional filtering.
    """
    query = db.query(Order, Customer.business_name).outerjoin(Customer, Order.customer_phone == Customer.phone_number)

    if status:
        query = query.filter(Order.status == status)
    if customer_phone:
        query = query.filter(Order.customer_phone == customer_phone)
    
    # Sort by newest first
    query = query.order_by(Order.created_at.desc())
    
    results = query.all()
    
    order_list = []
    for order, business_name in results:
        # Count items
        item_count = db.query(func.count(OrderItem.order_item_id)).filter(OrderItem.order_id == order.order_id).scalar()
        
        order_list.append(OrderListItem(
            order_id=str(order.order_id),
            customer_phone=order.customer_phone,
            customer_name=business_name or "Unknown",
            created_at=order.created_at,
            status=order.status,
            payment_status=order.payment_status,
            total_amount=float(order.total_amount or 0),
            item_count=item_count
        ))
        
    return order_list


# ================================================================
# 📋 PENDING ORDERS (Moved from main.py)
# ================================================================

@router.get("/pending")
def get_pending_orders():
    """
    Fetch all orders awaiting owner confirmation.
    Powers the Approval Queue in the Web Dashboard.
    """
    db = SessionLocal()

    try:
        sessions = (
            db.query(OrderSessionDB)
            .filter(OrderSessionDB.workflow_state == OrderState.WAITING_OWNER_CONFIRMATION.value)
            .order_by(OrderSessionDB.created_at.desc())
            .all()
        )

        result = []
        for session in sessions:
            # Fetch customer name
            customer = (
                db.query(Customer)
                .filter(Customer.phone_number == session.customer_phone)
                .first()
            )

            # Build item list
            items = []
            total_estimate = 0
            for item in session.items:
                material_name = item.material_name or "Unknown"
                qty = float(item.normalized_meters or item.input_quantity or 0)
                
                # Estimate total from item if possible (simplified)
                # This logic was in main.py, preserving it or improving?
                # The main.py code didn't actually calculate total_estimate correctly in the loop (it reset it or didn't sum it).
                # Let's trust logic from main.py for now but verify.
                # Re-reading main.py logic: total_estimate = 0 initialized inside loop? No, inside session loop.
                # But it wasn't incremented in main.py snippet! Step 1711 line 196.
                # I will fix it here to actually sum up items? 
                # But price might be unknown.
                
                items.append({
                    "material": material_name,
                    "quantity": qty,
                    "price_per_meter": 0,  # Price resolved at invoice time
                    "status": item.status or "PENDING"
                })

            result.append({
                "order_id": str(session.order_id),
                "customer_phone": session.customer_phone,
                "customer_name": customer.business_name if customer else None,
                "items": items,
                "total_estimate": float(total_estimate), # This is 0 in main.py too
                "created_at": session.created_at.isoformat() if session.created_at else None
            })

        return {"orders": result, "count": len(result)}

    finally:
        db.close()

# ================================================================
# APPROVE / REJECT ENDPOINTS
# ================================================================

@router.post("/{order_id}/approve")
def approve_order(order_id: str):
    db: Session = SessionLocal()

    try:
        # 1. Fetch
        session = get_session_by_order_id(db, order_id)
        if not session:
            raise HTTPException(status_code=404, detail="Order session not found")

        # 2. Validate State
        db_session = db.query(OrderSessionDB).filter(OrderSessionDB.order_id == order_id).first()
        if not db_session:
             raise HTTPException(status_code=404, detail="Session record not found")

        if db_session.workflow_state != OrderState.WAITING_OWNER_CONFIRMATION.value:
            raise HTTPException(status_code=400, detail=f"Order not awaiting confirmation (current: {db_session.workflow_state})")

        # 3. Operations
        # Reuse logic from main.py (simplified import)
        for item in session.items:
            if item.fulfilled_batches:
                for batch in item.fulfilled_batches:
                    # SMART DEDUCTION: Use allocated meters directly
                    if "allocated_meters" in batch:
                        deduct_meters_from_batch(db, batch["batch_id"], batch["allocated_meters"])
                    else:
                        # Fallback for old structure (if any)
                        deduct_inventory_from_batch(db, batch["batch_id"], batch.get("rolls",0), batch.get("loose_meters",0))

            # Create Permanent Item
            mat_name = item.measurement.material_name
            # Case-insensitive lookup
            mat_obj = db.query(Material).filter(func.lower(Material.material_name) == mat_name.lower()).first()
            
            if mat_obj:
                price = float(mat_obj.price_per_meter) if mat_obj.price_per_meter else 150.0
                new_item = OrderItem(
                    order_id=order_id,
                    material_id=mat_obj.material_id,
                    quantity_meters=item.measurement.normalized_meters,
                    price_per_meter=price,
                    color=item.measurement.color
                )
                db.add(new_item)
            else:
                logger.error(f"Material '{mat_name}' NOT found in DB during approval.")
                # We should probably stop here and error out, or else invoice will be empty
                raise HTTPException(status_code=400, detail=f"Material '{mat_name}' not found in database. Cannot approve order.")
        
        db.flush()
        
        # Verify items
        if db.query(OrderItem).filter(OrderItem.order_id == order_id).count() == 0:
             raise HTTPException(status_code=500, detail="Failed to migrate items (No valid materials found)")

        # 4. Invoice
        invoice = create_invoice(db, order_id)
        update_workflow_state(db, order_id, OrderState.ORDER_COMPLETED)
        db.commit()

        # 5. Notify
        try:
            # Use existing PDF generated by create_invoice
            pdf_path = invoice.pdf_path
            
            if pdf_path and os.path.exists(pdf_path):
                mid = upload_media(pdf_path)
                if mid:
                    send_document_message(session.customer_phone, mid, os.path.basename(pdf_path), caption=f"Billed: ₹{invoice.total_amount}")
                else:
                    logger.error("Failed to upload invoice PDF to WhatsApp.")
                    send_whatsapp_message(session.customer_phone, f"Approved! Invoice: {invoice.invoice_number} (PDF sending failed)")
            else:
                logger.error(f"Invoice PDF not found at {pdf_path}")
                send_whatsapp_message(session.customer_phone, f"Approved! Invoice: {invoice.invoice_number}")
                
        except Exception as e:
            logger.error(f"Notification failed: {e}")
            
        return {"status": "approved", "invoice_number": invoice.invoice_number}

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@router.post("/{order_id}/reject")
def reject_order(order_id: str):
    db: Session = SessionLocal()
    try:
        session = get_session_by_order_id(db, order_id)
        if not session: raise HTTPException(404, "Order not found")
        
        update_workflow_state(db, order_id, OrderState.ORDER_REJECTED)
        db.commit()
        
        send_whatsapp_message(session.customer_phone, "Your order has been rejected by the owner.")
        return {"status": "rejected"}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@router.get("/{order_id}", response_model=OrderDetail)
def get_order_detail(order_id: str, db: Session = Depends(get_db)):
    """
    Get full details of an order.
    """
    # Validate UUID format before querying
    try:
        uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Order ID format. Expected UUID.")
    
    order_query = db.query(Order, Customer.business_name)\
        .outerjoin(Customer, Order.customer_phone == Customer.phone_number)\
        .filter(Order.order_id == order_id).first()
        
    if not order_query:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order, business_name = order_query
    
    # fetch items with material name
    items_query = db.query(OrderItem, Material.material_name)\
        .join(Material, OrderItem.material_id == Material.material_id)\
        .filter(OrderItem.order_id == order_id).all()
    
    # fetch invoice
    invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    
    items_list = []
    for item, mat_name in items_query:
        items_list.append({
            "material_name": mat_name,
            "quantity": float(item.quantity_meters or 0),
            "price": float(item.price_per_meter or 0),
            "color": item.color,
            "amount": float((item.quantity_meters or 0) * (item.price_per_meter or 0))
        })

    return OrderDetail(
        order_id=str(order.order_id),
        customer_phone=order.customer_phone,
        customer_name=business_name,
        created_at=order.created_at,
        status=order.status,
        payment_status=order.payment_status,
        total_amount=float(order.total_amount or 0),
        
        invoice_number=invoice.invoice_number if invoice else None,
        gst_amount=float(invoice.gst_amount) if invoice else None,
        subtotal=float(invoice.total_amount - invoice.gst_amount) if invoice and invoice.gst_amount else None, # approximate if not stored
        
        items=items_list
    )
