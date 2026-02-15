from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.customer import Customer
from app.models.credit_ledger import CreditLedger
from app.models.order_item import OrderItem
from app.models.material import Material
from app.models.order import Order
from app.schemas.customer_schema import CustomerUpdate, CustomerDetail, CustomerListItem, CustomerOrderSummary, PaymentHistory
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
    Get detailed customer info including recent orders, LTV, and ledger.
    """
    customer = db.query(Customer).filter(Customer.phone_number == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 1. Recent Orders with Item Summary
    recent_orders_db = db.query(Order).filter(Order.customer_phone == phone).order_by(Order.created_at.desc()).limit(10).all()
    
    orders = []
    for o in recent_orders_db:
        # Fetch items
        items = db.query(OrderItem, Material.material_name)\
            .join(Material, OrderItem.material_id == Material.material_id)\
            .filter(OrderItem.order_id == o.order_id).all()
        
        # Build summary string: "Cotton 60s (Red) x 10m, Silk x 5m"
        item_strings = []
        for item, mat_name in items:
            color_str = f" ({item.color})" if item.color and item.color != 'Unknown' else ""
            item_strings.append(f"{mat_name}{color_str} x {float(item.quantity_meters):g}m")
        
        summary = ", ".join(item_strings)
        if not summary:
            summary = "No items"

        orders.append(CustomerOrderSummary(
            order_id=str(o.order_id),
            date=o.created_at,
            status=o.status,
            total_amount=float(o.total_amount or 0),
            items_summary=summary
        ))

    # 2. Lifetime Value (Sum of completed orders)
    ltv = db.query(func.sum(Order.total_amount))\
        .filter(Order.customer_phone == phone, Order.status == 'completed')\
        .scalar() or 0.0

    # 3. Payment/Credit History from Ledger
    ledger_entries = db.query(CreditLedger)\
        .filter(CreditLedger.customer_phone == phone)\
        .order_by(CreditLedger.created_at.desc())\
        .limit(20).all()

    history = [
        PaymentHistory(
            transaction_id=str(l.transaction_id),
            amount=float(l.amount),
            type=l.type,
            date=l.created_at
        ) for l in ledger_entries
    ]

    return CustomerDetail(
        phone_number=customer.phone_number,
        business_name=customer.business_name,
        credit_limit=float(customer.credit_limit or 0),
        outstanding_balance=float(customer.outstanding_balance or 0),
        lifetime_value=float(ltv),
        last_reminder_date=customer.last_reminder_date,
        created_at=customer.created_at,
        recent_orders=orders,
        payment_history=history
    )


@router.get("/{phone}/balance")
def get_customer_balance(phone: str, db: Session = Depends(get_db)):
    """
    Lightweight endpoint to check balance.
    Includes smart phone number lookup (fuzzy match).
    """
    # 1. Normalize Lookup
    input_phone = phone.strip()
    customer = db.query(Customer).filter(Customer.phone_number == input_phone).first()
    
    if not customer:
        # Try adding +
        if not input_phone.startswith("+"):
             customer = db.query(Customer).filter(Customer.phone_number == "+" + input_phone).first()
    
    if not customer:
        # Try removing +
        if input_phone.startswith("+"):
             customer = db.query(Customer).filter(Customer.phone_number == input_phone[1:]).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return {
        "customer_phone": customer.phone_number,
        "business_name": customer.business_name,
        "outstanding_balance": float(customer.outstanding_balance or 0),
        "credit_limit": float(customer.credit_limit or 0)
    }

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
