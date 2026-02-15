import sys
import os
from unittest.mock import MagicMock

# Add project root to path
sys.path.append(os.getcwd())

from app.schemas.inventory_schema import InventoryBatchSchema
from app.services.inventory_service import get_available_colors
from app.services.order_processing_service import process_customer_order

print("Verifying imports...")
# If we reached here, imports are fine.

print("Testing get_available_colors...")

batches = [
    InventoryBatchSchema(
        batch_id="1", material_id="m1", material_name="Cotton", color="Red",
        rolls_available=1, meters_per_roll=100, loose_meters_available=0, created_at=None
    ),
    InventoryBatchSchema(
        batch_id="2", material_id="m1", material_name="Cotton", color="Blue",
        rolls_available=0, meters_per_roll=100, loose_meters_available=50, created_at=None
    ),
    InventoryBatchSchema(
        batch_id="3", material_id="m1", material_name="Cotton", color="Green",
        rolls_available=0, meters_per_roll=100, loose_meters_available=0, created_at=None
    ),
    InventoryBatchSchema(
        batch_id="4", material_id="m2", material_name="Silk", color="Yellow",
        rolls_available=1, meters_per_roll=100, loose_meters_available=0, created_at=None
    )
]

colors = get_available_colors(batches, "Cotton")
print(f"Available colors for Cotton: {colors}")

assert "Red" in colors
assert "Blue" in colors
assert "Green" not in colors # No stock
assert "Yellow" not in colors # Wrong material

print("SUCCESS: get_available_colors logic is correct.")

print("Verification complete.")
