from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.scheduler.alerts import check_low_stock_daily
from app.scheduler.reminders import check_overdue_customers

router = APIRouter(
    prefix="/debug",
    tags=["Debug"]
)

@router.post("/trigger-low-stock")
def trigger_low_stock():
    """
    Manually trigger the low stock alert check.
    """
    check_low_stock_daily()
    return {"status": "Low stock check triggered. Check server logs/WhatsApp."}

@router.post("/trigger-overdue")
def trigger_overdue():
    """
    Manually trigger the overdue customer check.
    """
    check_overdue_customers()
    return {"status": "Overdue check triggered. Check server logs/Database."}

@router.post("/simulate-overdue")
def simulate_overdue_customer(phone: str, db: Session = Depends(get_db)):
    """
    Sets a customer's balance to 5000 and last payment to 10 days ago.
    """
    from app.models.customer import Customer
    from app.models.credit_ledger import CreditLedger
    from datetime import datetime, timedelta
    
    customer = db.query(Customer).filter(Customer.phone_number == phone).first()
    if not customer:
        customer = Customer(phone_number=phone, business_name="Debug Customer")
        db.add(customer)
    
    customer.outstanding_balance = 5000.0
    
    # Fake a payment 10 days ago
    old_date = datetime.utcnow() - timedelta(days=10)
    ledger = CreditLedger(
        customer_phone=phone,
        amount=100.0,
        type="payment",
        created_at=old_date
    )
    db.add(ledger)
    db.commit()
    
    return {"status": f"Customer {phone} is now OVERDUE (Bal: 5000, Last Pay: 10 days ago). Send a message to test."}
