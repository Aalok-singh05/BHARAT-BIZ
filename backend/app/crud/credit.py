from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.credit_ledger import CreditLedger
from app.models.customer import Customer


def add_credit_for_invoice(
    db: Session,
    customer_phone: str,
    order_id,
    amount: Decimal
):
    """
    Adds a CREDIT entry when an invoice is generated.
    Caller manages db.commit().
    """

    entry = CreditLedger(
        customer_phone=customer_phone,
        order_id=order_id,
        amount=amount,
        type="credit"
    )

    db.add(entry)
    db.flush()
    db.refresh(entry)

    recalculate_outstanding_balance(db, customer_phone)

    return entry


def add_payment(
    db: Session,
    customer_phone: str,
    amount: Decimal
):
    """
    Records a payment made by customer.
    Includes overpayment prevention.
    Caller manages db.commit().
    """

    # Prevent overpayment
    customer = (
        db.query(Customer)
        .filter(Customer.phone_number == customer_phone)
        .first()
    )

    if not customer:
        raise ValueError("Customer not found")

    if customer.outstanding_balance <= 0:
        raise ValueError("No outstanding balance to settle")

    if amount > customer.outstanding_balance:
        raise ValueError(
            f"Payment ₹{amount} exceeds outstanding ₹{customer.outstanding_balance}"
        )

    entry = CreditLedger(
        customer_phone=customer_phone,
        order_id=None,
        amount=amount,
        type="payment"
    )

    db.add(entry)
    db.flush()
    db.refresh(entry)

    recalculate_outstanding_balance(db, customer_phone)

    return entry


def recalculate_outstanding_balance(
    db: Session,
    customer_phone: str
):
    credits = (
        db.query(CreditLedger)
        .filter(
            CreditLedger.customer_phone == customer_phone,
            CreditLedger.type == "credit"
        )
        .all()
    )

    payments = (
        db.query(CreditLedger)
        .filter(
            CreditLedger.customer_phone == customer_phone,
            CreditLedger.type == "payment"
        )
        .all()
    )

    total_credit = sum(c.amount for c in credits)
    total_payment = sum(p.amount for p in payments)

    outstanding = total_credit - total_payment

    customer = (
        db.query(Customer)
        .filter(Customer.phone_number == customer_phone)
        .first()
    )

    if not customer:
        raise ValueError("Customer not found")

    customer.outstanding_balance = outstanding

    db.flush()
    db.refresh(customer)

    return outstanding
