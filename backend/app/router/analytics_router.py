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
    
    # 5. Actionable Revenue (Pending Approval)
    # Sum of items in WAITING_OWNER_CONFIRMATION state
    # We need to join OrderSessionItemDB -> Material to get price
    from app.models.order_session import OrderSessionDB
    from app.models.order_session_item import OrderSessionItemDB
    from app.models.material import Material
    from app.models.credit_ledger import CreditLedger

    pending_items = db.query(
        OrderSessionItemDB.normalized_meters, 
        Material.price_per_meter
    ).join(
        OrderSessionDB, OrderSessionItemDB.order_id == OrderSessionDB.order_id
    ).join(
        Material, func.lower(OrderSessionItemDB.material_name) == func.lower(Material.material_name)
    ).filter(
        OrderSessionDB.workflow_state == 'WAITING_OWNER_CONFIRMATION'
    ).all()

    actionable_revenue = sum(
        (float(item.normalized_meters or 0) * float(item.price_per_meter or 0)) 
        for item in pending_items
    )
    
    return {
        "todayRevenue": float(today_revenue),
        "totalPending": float(pending_payments),
        "lowStockCount": low_stock_count,
        "weeklyOrders": orders_week,
        "actionableRevenue": actionable_revenue
    }


@router.get("/revenue")
def get_revenue_trend(days: int = 7, db: Session = Depends(get_db)):
    start_date = datetime.now() - timedelta(days=days)

    # Fetch all completed orders in range
    orders = db.query(Order).filter(
        Order.created_at >= start_date,
        Order.status == 'completed'
    ).all()

    # Aggregate in Python (SQLite friendly)
    data_map = {}
    for o in orders:
        if o.created_at:
            d_str = o.created_at.strftime('%Y-%m-%d')
            data_map[d_str] = data_map.get(d_str, 0.0) + float(o.total_amount or 0)
    
    final_data = []
    for i in range(days):
        # Generate date string for each day in range
        # Note: Logic was `start_date + i`. 
        # Range is [start_date, end_date].
        current_date = start_date + timedelta(days=i)
        d_str = current_date.strftime('%Y-%m-%d')
        
        final_data.append({
            "date": d_str,
            "revenue": data_map.get(d_str, 0.0)
        })
        
    return final_data


@router.get("/activity")
def get_recent_activity(db: Session = Depends(get_db)):
    """
    Get recent activity feed (Orders & Payments).
    """
    from app.models.credit_ledger import CreditLedger
    
    # 1. Recent Orders
    recent_orders = db.query(Order, Customer.business_name).outerjoin(Customer, Order.customer_phone == Customer.phone_number).order_by(Order.created_at.desc()).limit(5).all()
    
    # 2. Recent Payments
    recent_payments = db.query(CreditLedger, Customer.business_name).outerjoin(Customer, CreditLedger.customer_phone == Customer.phone_number).filter(CreditLedger.type == 'payment').order_by(CreditLedger.created_at.desc()).limit(5).all()
    
    activity = []
    
    for order, customer_name in recent_orders:
        activity.append({
            "type": "ORDER",
            "id": str(order.order_id),
            "amount": float(order.total_amount or 0),
            "customer": customer_name or "Unknown",
            "date": order.created_at,
            "status": order.status
        })
        
    for payment, customer_name in recent_payments:
        activity.append({
            "type": "PAYMENT",
            "id": str(payment.transaction_id),
            "amount": float(payment.amount or 0),
            "customer": customer_name or "Unknown",
            "date": payment.created_at,
            "status": "received"
        })
        
    # Sort by date DESC
    activity.sort(key=lambda x: x["date"], reverse=True)
    
    return activity[:10]
