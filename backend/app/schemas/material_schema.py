from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class MaterialSchema(BaseModel):
    material_id: str
    material_name: str
    category: Optional[str] = None
    price_per_meter: float
    total_stock_meters: float = 0.0

    class Config:
        orm_mode = True

class MaterialPriceUpdate(BaseModel):
    material_name: str
    price_per_meter: float
