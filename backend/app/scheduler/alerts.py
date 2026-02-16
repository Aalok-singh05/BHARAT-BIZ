import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.inventory import InventoryBatch
from app.integrations.whatsapp import send_whatsapp_message


def check_low_stock_daily():
    """
    Checks for batches with low stock (< 5 rolls) and notifies the owner.
    """
    OWNER_PHONE = os.getenv("OWNER_PHONE_NUMBER")
    if not OWNER_PHONE:
        print("OWNER_PHONE_NUMBER not set. Skipping alerts.")
        return

    db: Session = SessionLocal()
    try:
        from app.models.material import Material
        
        # Explicit JOIN to ensure we get the data
        results = (
            db.query(
                InventoryBatch.batch_id,
                InventoryBatch.rolls_available, 
                InventoryBatch.color,
                Material.material_name
            )
            .join(Material, InventoryBatch.material_id == Material.material_id)
            .filter(InventoryBatch.rolls_available < 5)
            .all()
        )
        
        if not results:
            print("No low stock items found.")
            return

        # Format Message
        msg_lines = ["⚠️ *Low Stock Alert*"]
        msg_lines.append("") # Empty line
        
        for batch_id, rolls, color, mat_name in results:
            msg_lines.append(f"• *{mat_name}* ({color}): {rolls} rolls left")
        
        msg_lines.append("\nPlease restock soon.")
        
        full_message = "\n".join(msg_lines)
        
        # Send
        send_whatsapp_message(OWNER_PHONE, full_message)
        
    except Exception as e:
        print(f"Error in low stock check: {e}")
    finally:
        db.close()
