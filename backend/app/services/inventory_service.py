from typing import List, Dict

from app.schemas.inventory_schema import InventoryBatchSchema
from app.schemas.measurement_schema import TextileMeasurement


def calculate_batch_meters(batch: InventoryBatchSchema) -> float:
    """
    Calculates total available meters in a batch.
    """
    return (batch.rolls_available * batch.meters_per_roll) + batch.loose_meters_available


def filter_matching_batches(batches: List[InventoryBatchSchema],
                            material_name: str,
                            color: str) -> List[InventoryBatchSchema]:
    """
    Filters inventory batches by material and color.
    """
    if not material_name or not color:
        return []

    mat_lower = material_name.lower()
    color_lower = color.lower()

    return [
        batch for batch in batches        
        if (batch.material_name or "").lower() == mat_lower
        and (batch.color or "").lower() == color_lower
    ]


def get_available_colors(batches: List[InventoryBatchSchema],
                         material_name: str) -> List[str]:
    """
    Returns a list of unique colors available for a given material.
    """
    if not material_name:
        return []

    mat_lower = material_name.lower()
    colors = set()
    for batch in batches:
        if (batch.material_name or "").lower() == mat_lower:
            # Only suggest if actual stock exists
            total_meters = calculate_batch_meters(batch)
            if total_meters > 0:
                colors.add(batch.color)
    
    return list(colors)


def check_inventory(order_item: TextileMeasurement,
                    available_batches: List[InventoryBatchSchema],
                    color: str) -> Dict:
    """
    Checks inventory availability and returns fulfillment plan.
    """

    required_meters = order_item.normalized_meters

    matching_batches = filter_matching_batches(available_batches,
                                               order_item.material_name,
                                               color)

    if not matching_batches:
        return {
            "status": "OUT_OF_STOCK",
            "fulfilled_batches": [],
            "available_meters": 0
        }

    fulfilled_batches = []
    total_available = 0
    remaining_required = required_meters

    for batch in matching_batches:
        batch_meters = calculate_batch_meters(batch)

        if remaining_required <= 0:
            break

        allocated = min(batch_meters, remaining_required)

        fulfilled_batches.append({
            "batch_id": batch.batch_id,
            "allocated_meters": allocated
        })

        total_available += batch_meters
        remaining_required -= allocated

    if total_available >= required_meters:
        status = "FULL_AVAILABLE"
    
    elif total_available > 0:
        status = "PARTIAL_AVAILABLE"
    
    else:
        status = "OUT_OF_STOCK"

    return {
        "status": status,
        "fulfilled_batches": fulfilled_batches,
        "available_meters": total_available
    }
