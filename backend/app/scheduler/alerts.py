import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.inventory import InventoryBatch
from app.integrations.whatsapp import send_whatsapp_message

OWNER_PHONE = os.getenv("OWNER_PHONE_NUMBER")

def check_low_stock_daily():
    """
    Checks for batches with low stock (< 5 rolls) and notifies the owner.
    """
    if not OWNER_PHONE:
        print("OWNER_PHONE_NUMBER not set. Skipping alerts.")
        return

    db: Session = SessionLocal()
    try:
        low_stock_items = db.query(InventoryBatch).filter(InventoryBatch.rolls_available < 5).all()
        
        if not low_stock_items:
            return

        # Format Message
        msg_lines = ["⚠️ *Low Stock Alert*"]
        for batch in low_stock_items:
            # We ideally want Material Name, but Batch only has batch_id? 
            # Batch has relationships usually or we join.
            # InventoryBatch table: batch_id, material_id, etc.
            # Let's assume we can get name via relationship or lazy load if model has it.
            # Checking model... InventoryBatch usually has material_id.
            # For now, listing Batch ID and Rolls.
            msg_lines.append(f"- {batch.batch_id}: {batch.rolls_available} rolls left")
        
        msg_lines.append("\nPlease restock soon.")
        
        full_message = "\n".join(msg_lines)
        
        # Send
        send_whatsapp_message(OWNER_PHONE, full_message)
        
    except Exception as e:
        print(f"Error in low stock check: {e}")
    finally:
        db.close()
