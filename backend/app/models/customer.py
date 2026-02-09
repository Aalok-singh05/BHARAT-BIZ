from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    phone_number = Column(String, primary_key=True, index=True)
    business_name = Column(String, nullable=True)

    credit_limit = Column(Numeric, default=0)
    outstanding_balance = Column(Numeric, default=0)

    last_reminder_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
