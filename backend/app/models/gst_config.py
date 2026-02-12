import uuid
from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class GSTConfig(Base):
    __tablename__ = "gst_config"

    config_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Category-based GST (e.g. "silk" -> 12%, "cotton" -> 5%)
    # Use "default" as the fallback category
    category = Column(String, nullable=False, unique=True, default="default")

    gst_rate = Column(Numeric, nullable=False)  # e.g. 0.05 for 5%

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
