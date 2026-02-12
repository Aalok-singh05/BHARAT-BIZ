import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    batch_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    material_id = Column(
        UUID(as_uuid=True),
        ForeignKey("materials.material_id"),
        nullable=False
    )

    # ✅ ADD THIS RELATIONSHIP
    material = relationship("Material")

    color = Column(String, nullable=False)
    dye_lot = Column(String, nullable=True)

    rolls_available = Column(Integer, nullable=False, default=0)
    meters_per_roll = Column(Numeric, nullable=False)
    loose_meters_available = Column(Numeric, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
