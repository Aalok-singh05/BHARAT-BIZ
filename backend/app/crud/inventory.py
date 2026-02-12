from sqlalchemy.orm import Session
from app.models.inventory import InventoryBatch
from app.models.material import Material


def get_inventory_batches(
    db: Session,
    material_name: str,
    color: str
):
    """
    Returns all inventory batches for a given material and color.
    AI layer decides how to use them.
    """

    return (
        db.query(InventoryBatch)
        .join(Material)
        .filter(Material.material_name == material_name)
        .filter(InventoryBatch.color == color)
        .filter(
            (InventoryBatch.rolls_available > 0) |
            (InventoryBatch.loose_meters_available > 0)
        )
        .all()
    )

from sqlalchemy.orm import Session
from app.models.inventory import InventoryBatch


def deduct_inventory_from_batch(
    db: Session,
    batch_id,
    rolls_to_deduct: int = 0,
    loose_meters_to_deduct: float = 0
):
    """
    Deducts inventory from a specific batch.
    Assumes AI layer has already validated availability.
    """

    batch = (
        db.query(InventoryBatch)
        .filter(InventoryBatch.batch_id == batch_id)
        .with_for_update()  # 🔒 LOCK ROW
        .first()
    )

    if not batch:
        raise ValueError("Inventory batch not found")

    # Safety checks (DB-level guard)
    if batch.rolls_available < rolls_to_deduct:
        raise ValueError(f"Batch {batch_id}: Only {batch.rolls_available} rolls left (Requested: {rolls_to_deduct})")

    if batch.loose_meters_available < loose_meters_to_deduct:
        raise ValueError(f"Batch {batch_id}: Only {batch.loose_meters_available}m left (Requested: {loose_meters_to_deduct}m)")

    batch.rolls_available -= rolls_to_deduct
    batch.loose_meters_available -= loose_meters_to_deduct

    # db.commit() REMOVED for atomicity
    db.flush()
    db.refresh(batch)

    return batch
