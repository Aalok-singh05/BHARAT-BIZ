import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class OrderSessionItemDB(Base):
    """
    Individual item within a DB-backed order session.
    Stores material, inventory status, and batch allocation.
    """

    __tablename__ = "order_session_items"

    session_item_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("order_sessions.order_id"),
        nullable=False
    )

    # --- Measurement fields ---
    material_name = Column(String, nullable=False)
    color = Column(String, nullable=True)
    input_quantity = Column(Float, nullable=False)
    input_unit = Column(String, nullable=False, default="meter")
    normalized_meters = Column(Float, nullable=False)

    # --- Item state ---
    status = Column(String, nullable=False, default="negotiating")
    replaced_by = Column(String, nullable=True)

    # --- Inventory resolution ---
    inventory_status = Column(String, nullable=True)
    available_meters = Column(Float, nullable=True)
    fulfilled_batches = Column(JSONB, nullable=True)

    # --- Original demand ---
    requested_meters = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationship back to session
    session = relationship("OrderSessionDB", back_populates="items")
