from app.database import SessionLocal, engine
from sqlalchemy import text

def fix_schema():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='color'"))
        if result.fetchone():
            print("Column 'color' already exists in 'order_items'.")
        else:
            print("Adding column 'color' to 'order_items'...")
            db.execute(text("ALTER TABLE order_items ADD COLUMN color VARCHAR"))
            db.commit()
            print("Column 'color' added successfully.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_schema()
