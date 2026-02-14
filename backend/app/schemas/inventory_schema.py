from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryBatchCreate(BaseModel):
    material_name: str
    color: Optional[str] = None
    rolls: int
    meters_per_roll: float
    total_meters: float

class InventoryBatchAdjust(BaseModel):
    batch_id: str
    adjustment_type: str # 'add', 'subtract', 'set'
    rolls: Optional[int] = None
    meters: Optional[float] = None
    reason: Optional[str] = None

class InventoryBatchSchema(BaseModel):
    batch_id: str
    material_id: str
    material_name: Optional[str]
    color: Optional[str]
    rolls_available: int
    meters_per_roll: float
    loose_meters_available: float
    created_at: datetime

    class Config:
        from_attributes = True
