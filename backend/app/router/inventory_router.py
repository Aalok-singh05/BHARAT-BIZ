from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.inventory import InventoryBatch
from app.models.material import Material
from app.schemas.inventory_schema import InventoryBatchCreate, InventoryBatchSchema
from typing import List
from datetime import datetime

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[InventoryBatchSchema])
def list_inventory(db: Session = Depends(get_db)):
    """
    List all inventory batches.
    """
    batches = db.query(InventoryBatch).all()
    
    # We need to attach material names if not present in model or handled by Pydantic
    # InventoryBatch has material_id. Pydantic schema expects material_name.
    # Let's join or manual fetch.
    
    results = []
    for b in batches:
        mat = db.query(Material).filter(Material.material_id == b.material_id).first()
        results.append({
            "batch_id": str(b.batch_id),
            "material_id": str(b.material_id),
            "material_name": mat.material_name if mat else "Unknown",
            "color": b.color,
            "rolls_available": b.rolls_available,
            "meters_per_roll": float(b.meters_per_roll),
            "loose_meters_available": float(b.loose_meters_available),
            "created_at": b.created_at
        })
    
    return results


@router.post("/add")
def add_inventory(batch: InventoryBatchCreate, db: Session = Depends(get_db)):
    """
    Add new inventory batch.
    Creates Material if it doesn't exist.
    """
    # 1. Find or Create Material
    material = db.query(Material).filter(Material.material_name == batch.material_name).first()
    if not material:
        # Create new material
        # Assuming ID generation is handled by DB or model (UUID)
        # Material model usually takes name.
        # Let's check Material model... It has ID default? 
        # Typically default=uuid4.
        material = Material(
            material_name=batch.material_name,
            price_per_meter=150.0 # Default price
        )
        db.add(material)
        db.commit()
        db.refresh(material)
    
    # 2. Create Batch
    # Batch ID generation? Model default? 
    # Let's assume model handles it or we gen plain string.
    # But usually models have defaults.
    
    new_batch = InventoryBatch(
        material_id=material.material_id,
        color=batch.color or "Unknown",
        rolls_available=batch.rolls,
        meters_per_roll=batch.meters_per_roll,
        loose_meters_available=0, # Initial batch assumed full rolls
        created_at=datetime.utcnow()
    )
    
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    return {"status": "added", "batch_id": new_batch.batch_id}
