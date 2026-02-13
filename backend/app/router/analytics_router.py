from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.order import Order
from app.models.customer import Customer
from app.models.inventory import InventoryBatch
from datetime import datetime, timedelta, date

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Get summary metrics for the dashboard.
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    
    # 1. Today's Revenue
    # Sum of completed orders today
    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= today_start,
        Order.status == 'completed' # or whatever "approved" status is final
    ).scalar() or 0.0
    
    # 2. Total Pending Payments
    # Sum of customer outstanding balances
    pending_payments = db.query(func.sum(Customer.outstanding_balance)).scalar() or 0.0
    
    # 3. Low Stock Items
    # Count of batches with < 5 rolls (arbitrary threshold)
    low_stock_count = db.query(func.count(InventoryBatch.batch_id)).filter(
        InventoryBatch.rolls_available < 5
    ).scalar() or 0
    
    # 4. Orders This Week
    week_start = now - timedelta(days=7)
    orders_week = db.query(func.count(Order.order_id)).filter(
        Order.created_at >= week_start
    ).scalar() or 0
    
    return {
        "todayRevenue": float(today_revenue),
        "totalPending": float(pending_payments),
        "lowStockCount": low_stock_count,
        "weeklyOrders": orders_week
    }


@router.get("/revenue")
def get_revenue_trend(days: int = 7, db: Session = Depends(get_db)):
    """
    Get revenue trend for the last N days.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # SQLAlchemy grouping by date
    # Valid for PostgreSQL: func.date_trunc('day', Order.created_at)
    # Simple approach: fetch all and aggregate in python if volume is low, 
    # but let's try SQL grouping.
    
    results = db.query(
        func.date_trunc('day', Order.created_at).label('date'),
        func.sum(Order.total_amount).label('total')
    ).filter(
        Order.created_at >= start_date,
        Order.status == 'completed' # Only count confirmed revenue
    ).group_by(
        func.date_trunc('day', Order.created_at)
    ).order_by(
        func.date_trunc('day', Order.created_at)
    ).all()
    
    # Convert to list of dicts {date: 'YYYY-MM-DD', revenue: 100}
    # And fill missing days with 0
    
    data_map = {r.date.strftime('%Y-%m-%d'): float(r.total) for r in results}
    
    final_data = []
    for i in range(days):
        d = (start_date + timedelta(days=i+1)).strftime('%Y-%m-%d') # shift to align with result
        # Actually logic: iterate from (now - days) to now.
        date_obj = (end_date - timedelta(days=days - 1 - i)).date() # standard approach: today, yesterday...
        # Let's just go forward from start_date
        current_d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        final_data.append({
            "date": current_d,
            "revenue": data_map.get(current_d, 0.0)
        })
        
    return final_data
