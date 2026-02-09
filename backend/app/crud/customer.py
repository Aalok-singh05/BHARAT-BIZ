from sqlalchemy.orm import Session
from app.models.customer import Customer


def get_customer(db: Session, phone_number: str):
    return (
        db.query(Customer)
        .filter(Customer.phone_number == phone_number)
        .first()
    )


def create_customer(
    db: Session,
    phone_number: str,
    business_name: str | None = None,
    credit_limit: float = 0
):
    customer = Customer(
        phone_number=phone_number,
        business_name=business_name,
        credit_limit=credit_limit,
        outstanding_balance=0
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_or_create_customer(
    db: Session,
    phone_number: str,
    business_name: str | None = None
):
    customer = get_customer(db, phone_number)

    if customer:
        return customer

    return create_customer(
        db=db,
        phone_number=phone_number,
        business_name=business_name
    )
