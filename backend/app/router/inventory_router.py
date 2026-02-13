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
            "batch_id": b.batch_id,
            "material_id": b.material_id,
            "material_name": mat.material_name if mat else "Unknown",
            "rolls_available": b.rolls_available,
            "meters_available": float(b.meters_available),
            "original_meters": float(b.original_meters),
            "received_at": b.received_at
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
            total_stock_meters=0.0
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
        rolls_available=batch.rolls,
        meters_available=batch.total_meters,
        original_meters=batch.total_meters,
        received_at=datetime.utcnow()
    )
    
    # 3. Update Material Total Stock
    # Assuming material.total_stock_meters tracks aggregate
    material.total_stock_meters = float(material.total_stock_meters or 0) + batch.total_meters
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    return {"status": "added", "batch_id": new_batch.batch_id}
