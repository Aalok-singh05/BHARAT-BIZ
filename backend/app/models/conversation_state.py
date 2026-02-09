from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class ConversationState(Base):
    __tablename__ = "conversation_state"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.order_id"),
        primary_key=True
    )

    workflow_state = Column(String, nullable=False)

    negotiation_pending = Column(Boolean, default=False)
    awaiting_owner_confirmation = Column(Boolean, default=False)

    last_customer_language = Column(String, nullable=True)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
