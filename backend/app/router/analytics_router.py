from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.database import SessionLocal
from app.models.order import Order
from app.models.material import Material
from app.models.inventory import InventoryBatch
from app.models.credit_ledger import CreditLedger
from typing import List, Dict, Any

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ... (imports)

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Returns high-level metrics for the dashboard.
    """
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    # Valid revenue states: Customer Confirmed or Completed
    REVENUE_STATES = ['PENDING_APPROVAL', 'COMPLETED']

    # 1. Today's Revenue (Booked + Realized)
    today_revenue = db.query(func.sum(Order.total_amount))\
        .filter(Order.created_at >= start_of_day)\
        .filter(Order.status.in_(REVENUE_STATES))\
        .scalar() or 0.0

    # 2. Total Pending Payments (Outstanding Balance of all customers)
    from app.models.customer import Customer
    total_outstanding = db.query(func.sum(Customer.outstanding_balance)).scalar() or 0.0

    # 3. Actionable Revenue (Orders waiting for approval)
    actionable_revenue = db.query(func.sum(Order.total_amount))\
        .filter(Order.status == 'PENDING_APPROVAL')\
        .scalar() or 0.0

    # 4. Low Stock Count (Materials + Color variant with < 10 rolls total)
    # Matching logic with Business Memory page
    low_stock_count_subquery = db.query(
            Material.material_id,
            InventoryBatch.color,
            func.coalesce(func.sum(InventoryBatch.rolls_available), 0).label("total_rolls")
        )\
        .outerjoin(InventoryBatch, Material.material_id == InventoryBatch.material_id)\
        .group_by(Material.material_id, InventoryBatch.color)\
        .subquery()

    low_stock_count = db.query(func.count())\
        .select_from(low_stock_count_subquery)\
        .filter(low_stock_count_subquery.c.total_rolls < 10)\
        .scalar() or 0

    return {
        "todayRevenue": float(today_revenue),
        "totalPending": float(total_outstanding),
        "actionableRevenue": float(actionable_revenue),
        "lowStockCount": low_stock_count,
        "weeklyOrders": 0 
    }

@router.get("/revenue")
def get_revenue_trend(days: int = 7, db: Session = Depends(get_db)):
    """
    Returns daily revenue for the last N days.
    Revenue = Confirmed Orders (Pending Approval + Completed).
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    REVENUE_STATES = ['PENDING_APPROVAL', 'COMPLETED']

    # Ensure start_date is timezone-aware UTC datetime
    # Order.created_at is UTC. date.today() is local.
    # If we use datetime.combine(start_date, min.time()), we get naive datetime.
    # When comparing naive (if so) vs aware (DB), SQLAlchemy might assume local.
    # Safe fix: Convert input date range to CUTOFF in UTC.
    
    cutoff_dt_naive = datetime.combine(start_date, datetime.min.time())
    
    # Ideally we should use timezone aware, but for simplicity let's compare Date(Order.created_at)
    # Actually, grouping by date function is safer if we trust DB timezone configuration.
    # But usually DB stores UTC. So Group By Date might group by UTC day.
    # Which is fine.
    
    # Let's trust the date comparison but ensure we don't accidentally filter out today's records due to timezone drift.
    # Using start_date directly might be enough?
    # db.query( ... ).filter(func.date(Order.created_at) >= start_date)
    
    results = db.query(
        func.date(Order.created_at).label('date'),
        func.sum(Order.total_amount).label('revenue')
    ).filter(func.date(Order.created_at) >= start_date)\
     .filter(Order.status.in_(REVENUE_STATES))\
     .group_by(func.date(Order.created_at))\
     .all()

    # Fill missing dates with 0
    data = {}
    for r in results:
        data[str(r.date)] = float(r.revenue or 0.0)

    trend = []
    current = start_date
    while current <= end_date:
        d_str = str(current)
        trend.append({
            "date": d_str,
            "revenue": data.get(d_str, 0.0)
        })
        current += timedelta(days=1)
        
    return trend

@router.get("/activity")
def get_recent_activity(db: Session = Depends(get_db)):
    """
    Returns recent orders and payments for the activity feed.
    """
    # Orders (Show only confirmed ones)
    REVENUE_STATES = ['PENDING_APPROVAL', 'COMPLETED']
    recent_orders = db.query(Order)\
        .filter(Order.status.in_(REVENUE_STATES))\
        .order_by(Order.created_at.desc())\
        .limit(10).all()
    
    # Payments
    recent_payments = db.query(CreditLedger)\
        .filter(CreditLedger.type == 'payment')\
        .order_by(CreditLedger.created_at.desc())\
        .limit(10).all()

    activity = []
    
    for o in recent_orders:
        activity.append({
            "type": "ORDER",
            "date": o.created_at,
            "amount": float(o.total_amount or 0),
            "customer": o.customer_phone 
        })
        
    for p in recent_payments:
        activity.append({
            "type": "PAYMENT",
            "date": p.created_at,
            "amount": float(p.amount),
            "customer": p.customer_phone
        })
    
    # Sort combined list by date desc
    activity.sort(key=lambda x: x['date'], reverse=True)
    
    return activity[:10] # Return top 10 combined

@router.get("/business-memory")
# ... (rest of the file)
def get_business_memory(view_type: str = 'month', selected_date: str = None, db: Session = Depends(get_db)):
    """
    Returns aggregated business stats for 'Business Memory' page.
    view_type: 'month' (current month) or 'date' (specific date)
    """
    today = date.today()
    
    # --- 1. Date Range Logic ---
    if view_type == 'date' and selected_date:
        target_date = datetime.strptime(selected_date, "%Y-%m-%d").date()
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        period_label = target_date.strftime("%B %d, %Y")
    else:
        # Default to current month
        start_dt = datetime(today.year, today.month, 1)
        # End of current month (trick: start of next month)
        if today.month == 12:
            end_dt = datetime(today.year + 1, 1, 1)
        else:
            end_dt = datetime(today.year, today.month + 1, 1)
        period_label = start_dt.strftime("%B %Y")

    # --- 2. Revenue & Orders Stats ---
    # Valid revenue states: Customer Confirmed (Booked) or Completed (Realized)
    REVENUE_STATES = ['PENDING_APPROVAL', 'COMPLETED']

    # Total Revenue
    revenue = db.query(func.sum(Order.total_amount))\
        .filter(Order.created_at >= start_dt, Order.created_at < end_dt)\
        .filter(Order.status.in_(REVENUE_STATES))\
        .scalar() or 0.0

    # Counts
    success_count = db.query(func.count(Order.order_id))\
        .filter(Order.created_at >= start_dt, Order.created_at < end_dt)\
        .filter(Order.status.in_(REVENUE_STATES))\
        .scalar() or 0

    cancelled_count = db.query(func.count(Order.order_id))\
        .filter(Order.created_at >= start_dt, Order.created_at < end_dt)\
        .filter(Order.status.in_(['cancelled', 'rejected', 'REJECTED']))\
        .scalar() or 0

    # Offline vs Online (Logic: If created by 'system' or specific user? 
    # For now, let's assume all are 'Online' via Bot unless we add a 'source' column.
    # We can fake a split for demo or use payment_status 'cash' vs 'upi' if we had it.
    # Let's just return total for now).
    online_rev = revenue # All is online for now
    offline_rev = 0

    # --- 3. Inventory Health (Real Time) ---
    # Low stock items (< 10 rolls)
    # Note: sum rolls if multiple batches exist for same material? 
    # For simplicity, let's just check batches. ideally we should aggregate by material.
    
    # Low stock items (< 10 rolls) per Color
    # Use LEFT JOIN to catch materials with NO batches (0 stock)
    low_stock_items = db.query(
            Material.material_name,
            InventoryBatch.color,
            func.coalesce(func.sum(InventoryBatch.rolls_available), 0).label("total_rolls")
        )\
        .outerjoin(InventoryBatch, Material.material_id == InventoryBatch.material_id)\
        .group_by(Material.material_name, InventoryBatch.color)\
        .having(func.coalesce(func.sum(InventoryBatch.rolls_available), 0) < 10)\
        .limit(10).all()

    inventory_alerts = []
    for name, color, rolls in low_stock_items:
        # Format item name as "Material (Color)" or just "Material" if color is None
        display_name = f"{name} ({color})" if color else name
        
        inventory_alerts.append({
            "item": display_name,
            "stock": rolls,
            "threshold": 10, 
            "status": "Low Stock" if rolls > 0 else "Out of Stock",
            "demand": "High" 
        })

    # --- 4. Recent/Specific Transactions ---
    # Fetch orders in the period
    transactions_db = db.query(Order).filter(Order.created_at >= start_dt, Order.created_at < end_dt)\
        .order_by(Order.created_at.desc())\
        .limit(50).all() # Limit to avoid overload

    transactions = []
    for t in transactions_db:
        transactions.append({
            "id": str(t.order_id),
            "customer": t.customer_phone, # Show phone if name not available (would need join)
            "amount": float(t.total_amount),
            "type": "Online", # Placeholder
            "time": t.created_at.strftime("%I:%M %p"),
            "date": t.created_at.strftime("%Y-%m-%d"),
            "status": t.status.capitalize()
        })

    return {
        "period": period_label,
        "stats": {
            "totalRevenue": float(revenue),
            "online": float(online_rev),
            "offline": float(offline_rev),
            "success": success_count,
            "cancelled": cancelled_count
        },
        "inventory": inventory_alerts,
        "transactions": transactions
    }
