import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_phone = Column(
        String,
        ForeignKey("customers.phone_number"),
        nullable=False
    )

    status = Column(String, nullable=False, default="pending")
    payment_status = Column(String, nullable=False, default="unpaid")
    total_amount = Column(Numeric, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
