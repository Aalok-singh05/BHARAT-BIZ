from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base


class MessageQueue(Base):
    __tablename__ = "message_queue"

    message_id = Column(String, primary_key=True)
    phone_number = Column(String, nullable=False)
    message_text = Column(Text, nullable=False)

    processing_status = Column(String, default="pending")
    retry_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
