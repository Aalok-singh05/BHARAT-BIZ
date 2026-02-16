from sqlalchemy import func
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
        .filter(func.lower(Material.material_name) == material_name.lower())
        .filter(func.lower(InventoryBatch.color) == color.lower())
        .filter(
            (InventoryBatch.rolls_available > 0) |
            (InventoryBatch.loose_meters_available > 0)
        )
        .all()
    )




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


def deduct_meters_from_batch(
    db: Session,
    batch_id: str,
    meters_to_deduct: float
):
    """
    Smart deduction: Takes loose meters first, then opens rolls if needed.
    """
    batch = (
        db.query(InventoryBatch)
        .filter(InventoryBatch.batch_id == batch_id)
        .with_for_update()
        .first()
    )

    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    meters_remaining = float(meters_to_deduct)
    
    # 1. Take from loose meters
    if batch.loose_meters_available >= meters_remaining:
        batch.loose_meters_available = float(batch.loose_meters_available) - meters_remaining
        meters_remaining = 0
    else:
        meters_remaining -= float(batch.loose_meters_available)
        batch.loose_meters_available = 0.0

    # 2. If still need meters, open rolls
    if meters_remaining > 0:
        roll_length = float(batch.meters_per_roll)
        if roll_length <= 0:
             raise ValueError(f"Batch {batch_id} has invalid meters_per_roll: {roll_length}")

        import math
        rolls_needed = math.ceil(meters_remaining / roll_length)

        if batch.rolls_available < rolls_needed:
             raise ValueError(f"Insufficient stock in Batch {batch_id}. Needed {rolls_needed} rolls, have {batch.rolls_available}")

        batch.rolls_available -= rolls_needed
        
        # Add opened rolls to loose meters (minus what we used)
        # Total meters from opened rolls = rolls_needed * roll_length
        # We used 'meters_remaining'
        # New loose meters = (rolls_needed * roll_length) - meters_remaining
        new_loose = (rolls_needed * roll_length) - meters_remaining
        batch.loose_meters_available = float(batch.loose_meters_available) + new_loose

    db.flush()
    db.refresh(batch)
    return batch
