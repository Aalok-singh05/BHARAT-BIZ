import uuid
from sqlalchemy import Column, Numeric, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.order_id"),
        nullable=False
    )

    material_id = Column(
        UUID(as_uuid=True),
        ForeignKey("materials.material_id"),
        nullable=False
    )

    quantity_meters = Column(Numeric, nullable=False)
    price_per_meter = Column(Numeric, nullable=False)
    color = Column(String, nullable=True)
