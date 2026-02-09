import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    material_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=True)
