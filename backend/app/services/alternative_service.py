from typing import List, Dict
from app.schemas.order_item_schema import OrderItem


def find_alternatives(session, item: OrderItem) -> List[Dict]:

    alternatives = []

    target_material = item.measurement.material_name.lower()
    target_color = item.measurement.color.lower()

    batches = session.available_batches or []

    for batch in batches:

        batch_material = batch.material_name.lower()
        batch_color = batch.color.lower()

        # Skip exact same item
        if batch_material == target_material and batch_color == target_color:
            continue

        available_meters = (
            batch.rolls_available * batch.meters_per_roll
            + batch.loose_meters_available
        )

        if available_meters <= 0:
            continue

        # Priority 1 → Same material different color
        if batch_material == target_material:
            alternatives.append({
                "material": batch.material_name,
                "color": batch.color,
                "available_meters": available_meters,
                "priority": 1
            })

        # Priority 2 → Same color different material
        elif batch_color == target_color:
            alternatives.append({
                "material": batch.material_name,
                "color": batch.color,
                "available_meters": available_meters,
                "priority": 2
            })

    # Sort by priority
    alternatives.sort(key=lambda x: x["priority"])

    return alternatives[:3]  # Limit suggestions


def build_alternative_message(item: OrderItem, alternatives: List[Dict]):

    measurement = item.measurement

    if not alternatives:
        return (
            f"{measurement.color} {measurement.material_name} "
            f"available nahi hai.\n\n"
            "Filhaal koi alternative stock mein nahi hai."
        )

    alt_lines = []

    for alt in alternatives:
        alt_lines.append(
            f"• {alt['color']} {alt['material']} "
            f"({alt['available_meters']}m available)"
        )

    alt_text = "\n".join(alt_lines)

    return (
        f"{measurement.color} {measurement.material_name} "
        f"requested quantity available nahi hai.\n\n"
        "Available alternatives:\n"
        f"{alt_text}\n\n"
        "Kya aap inmein se kuch lena chahenge?"
    )
