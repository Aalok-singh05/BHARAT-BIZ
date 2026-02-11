import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(String, unique=True, nullable=False)
    phone_number = Column(String, nullable=False)
    direction = Column(String, nullable=False)  # incoming / outgoing
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
