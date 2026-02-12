import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class OrderSessionDB(Base):
    """
    DB-backed order session.
    Replaces the in-memory ORDER_SESSION_STORE.
    One session per order. Tracks workflow state.
    """

    __tablename__ = "order_sessions"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.order_id"),
        primary_key=True,
        default=uuid.uuid4
    )

    customer_phone = Column(String, nullable=False, index=True)
    workflow_state = Column(String, nullable=False, default="order_initiated")

    negotiation_pending = Column(Boolean, default=False)
    owner_approval_required = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationship to items
    items = relationship(
        "OrderSessionItemDB",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="joined"
    )
