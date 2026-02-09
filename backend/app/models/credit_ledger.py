import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class CreditLedger(Base):
    __tablename__ = "credit_ledger"

    transaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_phone = Column(
        String,
        ForeignKey("customers.phone_number"),
        nullable=False
    )

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.order_id"),
        nullable=True
    )

    amount = Column(Numeric, nullable=False)
    type = Column(String, nullable=False)  # "credit" or "payment"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
