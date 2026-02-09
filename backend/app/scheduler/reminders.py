from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.credit_ledger import CreditLedger
from app.models.conversation_state import ConversationState


OVERDUE_DAYS = 7


def check_overdue_customers():
    db: Session = SessionLocal()

    cutoff_date = datetime.utcnow() - timedelta(days=OVERDUE_DAYS)

    customers = (
        db.query(Customer)
        .filter(Customer.outstanding_balance > 0)
        .all()
    )

    for customer in customers:
        last_payment = (
            db.query(CreditLedger)
            .filter(
                CreditLedger.customer_phone == customer.phone_number,
                CreditLedger.type == "payment"
            )
            .order_by(CreditLedger.created_at.desc())
            .first()
        )

        last_activity_date = (
            last_payment.created_at if last_payment else customer.created_at
        )

        if last_activity_date < cutoff_date:
            # Mark conversations awaiting owner approval
            states = (
                db.query(ConversationState)
                .filter(
                    ConversationState.awaiting_owner_confirmation == False
                )
                .all()
            )

            for state in states:
                state.awaiting_owner_confirmation = True

    db.commit()
    db.close()
