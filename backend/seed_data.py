import sys
import os
from datetime import datetime, timedelta

# Ensure 'app' module is found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import *  # Import all models to ensure they are registered
from app.models.material import Material
from app.models.inventory import InventoryBatch
from app.models.customer import Customer
from app.models.gst_config import GSTConfig
from sqlalchemy.orm import Session
from sqlalchemy import text

def seed_data():
    print("⚠️  WARNING: This will DELETE ALL DATA and reset the database.")
    confirm = input("Type 'yes' to continue: ")
    if confirm != 'yes':
        print("Aborted.")
        return

    print("🗑️  Dropping all tables...")
    # Explicitly drop legacy tables that might not be in metadata anymore
    with engine.connect() as connection:
        connection.execute(text("DROP TABLE IF EXISTS conversation_state CASCADE;"))
        connection.commit()

    Base.metadata.drop_all(bind=engine)
    
    print("🏗️  Creating tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        print("🌱 Seeding Materials...")
        materials_data = [
            {"name": "Cotton 60x60", "price": 120.0, "category": "Cotton"},
            {"name": "Rayon 14kg", "price": 140.0, "category": "Rayon"},
            {"name": "Satin Silk", "price": 250.0, "category": "Silk"},
            {"name": "Crepe", "price": 180.0, "category": "Synthetic"},
            {"name": "Muslin", "price": 200.0, "category": "Cotton"},
        ]
        
        materials = []
        for m in materials_data:
            mat = Material(
                material_name=m["name"],
                price_per_meter=m["price"],
                category=m["category"], 
                total_stock_meters=0 # Updated later
            )
            db.add(mat)
            materials.append(mat)
        
        db.flush() # Get IDs

        print("🌱 Seeding Inventory Batches...")
        batches = []
        for mat in materials:
            # Create 2 batches for each
            for i in range(1, 3):
                rolls = 10
                meters_per_roll = 100.0
                total_m = rolls * meters_per_roll
                
                batch = InventoryBatch(
                    material_id=mat.material_id,
                    color=f"Color-{i}",
                    rolls_available=rolls,
                    meters_per_roll=meters_per_roll,
                    loose_meters_available=0,
                    # meters_available removed, original_meters removed as they don't exist in model
                    # total stock calculation is done on material
                    received_at=datetime.utcnow() - timedelta(days=i*2)
                )
                db.add(batch)
                
                # Update material total
                mat.total_stock_meters = float(mat.total_stock_meters) + total_m

        print("🌱 Seeding Customers...")
        customers = [
            Customer(phone_number="919876543210", business_name="Alpha Textiles", credit_limit=50000.0),
            Customer(phone_number="918765432109", business_name="Beta Garments", credit_limit=100000.0),
            Customer(phone_number="917654321098", business_name="Gamma Exports", credit_limit=75000.0),
        ]
        db.add_all(customers)

        print("🌱 Seeding GST Config...")
        gst_configs = [
            GSTConfig(category="default", gst_rate=0.05),
            GSTConfig(category="Cotton", gst_rate=0.05),
            GSTConfig(category="Silk", gst_rate=0.12),
        ]
        db.add_all(gst_configs)

        db.commit()
        print("✅ Database reset and seeded successfully!")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
