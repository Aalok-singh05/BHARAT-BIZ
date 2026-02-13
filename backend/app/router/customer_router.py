from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer_schema import CustomerUpdate, CustomerDetail, CustomerListItem, CustomerOrderSummary
from typing import List

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[CustomerListItem])
def get_all_customers(db: Session = Depends(get_db)):
    """
    List all customers with summary statistics.
    """
    # Join with Order to get counts/dates? 
    # Or just query Customer and do separate count? 
    # For performance, let's do a join query or subquery.
    
    # Simple approach first:
    customers = db.query(Customer).all()
    result = []
    
    for c in customers:
        order_count = db.query(func.count(Order.order_id)).filter(Order.customer_phone == c.phone_number).scalar()
        last_order = db.query(Order).filter(Order.customer_phone == c.phone_number).order_by(Order.created_at.desc()).first()
        
        result.append(CustomerListItem(
            phone_number=c.phone_number,
            business_name=c.business_name,
            outstanding_balance=float(c.outstanding_balance or 0),
            credit_limit=float(c.credit_limit or 0),
            order_count=order_count,
            last_order_date=last_order.created_at if last_order else None
        ))
    
    return result


@router.get("/{phone}", response_model=CustomerDetail)
def get_customer_detail(phone: str, db: Session = Depends(get_db)):
    """
    Get detailed customer info including recent orders.
    """
    customer = db.query(Customer).filter(Customer.phone_number == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    recent_orders_db = db.query(Order).filter(Order.customer_phone == phone).order_by(Order.created_at.desc()).limit(10).all()
    
    orders = []
    for o in recent_orders_db:
        # Items summary (e.g. "Cotton x 20m, Silk x 10m")
        # Currently Order model doesn't store summary string, might need to fetch items or just use ID.
        # Let's use simple string for now.
        orders.append(CustomerOrderSummary(
            order_id=str(o.order_id),
            date=o.created_at,
            status=o.status,
            total_amount=float(o.total_amount or 0),
            items_summary="Click to view details" # Placeholder until we join items
        ))

    return CustomerDetail(
        phone_number=customer.phone_number,
        business_name=customer.business_name,
        credit_limit=float(customer.credit_limit or 0),
        outstanding_balance=float(customer.outstanding_balance or 0),
        last_reminder_date=customer.last_reminder_date,
        created_at=customer.created_at,
        recent_orders=orders
    )


@router.patch("/{phone}")
def update_customer(phone: str, update: CustomerUpdate, db: Session = Depends(get_db)):
    """
    Update customer details (business name, credit limit).
    """
    customer = db.query(Customer).filter(Customer.phone_number == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if update.business_name is not None:
        customer.business_name = update.business_name
    if update.credit_limit is not None:
        customer.credit_limit = update.credit_limit

    db.commit()
    db.refresh(customer)
    return {"status": "updated", "customer": customer.phone_number}
