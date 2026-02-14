from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.material import Material
from app.schemas.material_schema import MaterialSchema, MaterialPriceUpdate
from decimal import Decimal

router = APIRouter(prefix="/config", tags=["Configuration"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/prices", response_model=list[MaterialSchema])
def get_all_prices(db: Session = Depends(get_db)):
    """
    List all materials and their current prices.
    Total stock is calculated dynamically from batches.
    """
    from sqlalchemy import func
    from app.models.inventory import InventoryBatch

    # 1. Fetch stock aggregates (avoid N+1)
    stock_query = db.query(
        InventoryBatch.material_id,
        func.sum(
            (InventoryBatch.rolls_available * InventoryBatch.meters_per_roll) + 
            InventoryBatch.loose_meters_available
        ).label("total_meters")
    ).group_by(InventoryBatch.material_id).all()

    stock_map = {str(s.material_id): float(s.total_meters or 0) for s in stock_query}

    # 2. Fetch materials
    materials = db.query(Material).all()
    
    results = []
    for m in materials:
        m_id = str(m.material_id)
        results.append(MaterialSchema(
            material_id=m_id,
            material_name=m.material_name,
            category=m.category,
            price_per_meter=float(m.price_per_meter),
            total_stock_meters=stock_map.get(m_id, 0.0)
        ))
    return results


@router.post("/prices")
def update_price(update: MaterialPriceUpdate, db: Session = Depends(get_db)):
    """
    Update the price for a specific material.
    """
    # Find material by name
    material = (
        db.query(Material)
        .filter(Material.material_name == update.material_name)
        .first()
    )

    if not material:
        # If not found, maybe create it? For now, error.
        raise HTTPException(status_code=404, detail=f"Material '{update.material_name}' not found")

    # Update price
    material.price_per_meter = Decimal(str(update.price_per_meter))
    db.commit()
    db.refresh(material)

    return {
        "status": "updated",
        "material": material.material_name,
        "new_price": float(material.price_per_meter)
    }
