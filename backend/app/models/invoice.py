import uuid
from sqlalchemy import Column, Numeric, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.order_id"),
        nullable=False
    )

    invoice_number = Column(String, nullable=False, unique=True)

    subtotal = Column(Numeric, nullable=False)
    gst_amount = Column(Numeric, nullable=False)
    total_amount = Column(Numeric, nullable=False)

    pdf_path = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
