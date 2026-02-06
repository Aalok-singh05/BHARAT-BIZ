from pydantic import BaseModel, Field
from typing import Optional


class InventoryBatch(BaseModel):
    material_name: str
    color: str
    batch_id: str
    rolls_available: int = Field(ge=0)
    meters_per_roll: float = Field(ge=0)
    loose_meters_available: float = Field(default=0, ge=0)
    dye_lot: Optional[str] = None
