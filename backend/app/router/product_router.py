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
    """
    materials = db.query(Material).all()
    # Pydantic will handle serialization
    return materials


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
