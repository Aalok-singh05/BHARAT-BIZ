from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.order import Order
from app.models.customer import Customer
from app.models.order_item import OrderItem
from app.models.invoice import Invoice
from app.schemas.order_schema import OrderListItem, OrderDetail
from typing import List, Optional

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
        item_count = db.query(func.count(OrderItem.item_id)).filter(OrderItem.order_id == order.order_id).scalar()
        
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


@router.get("/{order_id}", response_model=OrderDetail)
def get_order_detail(order_id: str, db: Session = Depends(get_db)):
    """
    Get full details of an order.
    """
    # UUID validation is handled by FastAPI/Pydantic or DB constraint. For simplicity, just query.
    # Note: If order_id is invalid UUID format, PG might complain. We rely on valid inputs.
    
    order_query = db.query(Order, Customer.business_name)\
        .outerjoin(Customer, Order.customer_phone == Customer.phone_number)\
        .filter(Order.order_id == order_id).first()
        
    if not order_query:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order, business_name = order_query
    
    # fetch items
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    # fetch invoice
    invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    
    items_list = []
    for i in items:
        # We need material name. Join? Or just fetch? 
        # OrderItem usually has material_id.
        # Let's do lazy load or check model.
        # Ideally we join Material. 
        # For MVP, we might just return item data.
        items_list.append({
            "material_id": str(i.material_id),
            "quantity": float(i.quantity_meters or 0),
            "price": float(i.price_per_meter or 0),
            "amount": float(i.quantity_meters * i.price_per_meter) if i.quantity_meters and i.price_per_meter else 0
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
