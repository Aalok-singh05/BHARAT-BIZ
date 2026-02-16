from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.credit_ledger import CreditLedger
from app.models.order_session import OrderSessionDB
from app.workflows.order_states import OrderState


OVERDUE_DAYS = 7

# Terminal states — sessions in these states are 'closed'
TERMINAL_STATES = [
    OrderState.ORDER_COMPLETED.value,
    OrderState.ORDER_REJECTED.value,
    OrderState.LEDGER_UPDATED.value,
]


def check_overdue_customers():
    db: Session = SessionLocal()

    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=OVERDUE_DAYS)

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

            if not last_activity_date:
                continue  # Skip if no date available

            # Ensure aware datetime for comparison
            if last_activity_date.tzinfo is None:
                last_activity_date = last_activity_date.replace(tzinfo=timezone.utc)

            if last_activity_date < cutoff_date:
                # Flag active sessions for owner review
                active_sessions = (
                    db.query(OrderSessionDB)
                    .filter(
                        OrderSessionDB.customer_phone == customer.phone_number,
                        OrderSessionDB.workflow_state.notin_(TERMINAL_STATES)
                    )
                    .all()
                )

                for session in active_sessions:
                    session.owner_approval_required = True

        db.commit()

    finally:
        db.close()
