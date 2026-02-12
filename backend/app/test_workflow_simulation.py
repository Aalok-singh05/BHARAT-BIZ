"""
Script to simulate a full order workflow without using WhatsApp.
Run this script to verify the system end-to-end.
"""

import time
import uuid
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app.models.inventory import InventoryBatch
from app.models.material import Material
from app.models.order_session import OrderSessionDB
from app.router.message_router import route_message
from app.main import approve_order, reject_order

# Setup fake logging to avoid clutter
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TEST_PHONE = "9998887776"

def setup_test_inventory(db: Session):
    """Ensure we have some inventory to buy."""
    print("📦 Setting up test inventory...")

    # Check/Create material
    mat = db.query(Material).filter_by(material_name="cotton").first()
    if not mat:
        mat = Material(material_name="cotton", category="fabric")
        db.add(mat)
        db.commit()
    
    # Check/Create batch
    batch_id = "TEST_BATCH_001"
    batch = db.query(InventoryBatch).filter_by(batch_id=batch_id).first()
    if not batch:
        batch = InventoryBatch(
            material_id=mat.material_id,
            color="blue",
            batch_id=batch_id,
            rolls_available=10,
            meters_per_roll=100,
            loose_meters_available=50
        )
        db.add(batch)
        db.commit()
    
    print(f"✅ Inventory ready: {batch.material.material_name} {batch.color} ({batch.rolls_available} rolls)")


def simulate_conversation(db: Session):
    print("\n💬 SIMULATING CONVERSATION FLOW")
    print("=" * 40)

    # 1. NEW ORDER
    msg1 = "I need 20 meters of blue cotton"
    print(f"Customer: {msg1}")
    resp1 = route_message(TEST_PHONE, msg1)
    print(f"Bot: {resp1}\n")

    # 2. CONFIRM (assuming bot asked for confirmation)
    msg2 = "Yes, please confirm"
    print(f"Customer: {msg2}")
    resp2 = route_message(TEST_PHONE, msg2)
    print(f"Bot: {resp2}\n")

    # 3. FINAL CONFIRMATION
    msg3 = "Confirm order"
    print(f"Customer: {msg3}")
    resp3 = route_message(TEST_PHONE, msg3)
    print(f"Bot: {resp3}\n")

    return resp3


def verify_order_state(db: Session):
    print("\n🔍 VERIFYING ORDER STATE")
    print("=" * 40)

    session = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.customer_phone == TEST_PHONE)
        .order_by(OrderSessionDB.created_at.desc())
        .first()
    )

    if not session:
        print("❌ No session found!")
        return None

    print(f"Order ID: {session.order_id}")
    print(f"State: {session.workflow_state}")

    return str(session.order_id)


def attempt_approval(order_id: str):
    print(f"\n👮 OWNER APPROVING ORDER: {order_id}")
    print("=" * 40)

    try:
        result = approve_order(order_id)
        print(f"✅ Approval Result: {result}")
    except Exception as e:
        print(f"❌ Approval Failed: {e}")


def main():
    db = SessionLocal()
    try:
        # Base.metadata.create_all(bind=engine) # Ensure tables exist
        setup_test_inventory(db)
        
        simulate_conversation(db)
        
        order_id = verify_order_state(db)
        
        if order_id:
            attempt_approval(order_id)

    finally:
        db.close()


if __name__ == "__main__":
    main()
