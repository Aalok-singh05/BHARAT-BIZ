from typing import Dict

from app.schemas.measurement_schema import TextileMeasurement


def generate_inventory_response(order_item: TextileMeasurement,
                                inventory_result: Dict,
                                color: str) -> Dict:
    """
    Converts inventory check result into customer-facing negotiation response.
    """

    status = inventory_result["status"]
    available_meters = inventory_result["available_meters"]
    requested_meters = order_item.normalized_meters

    material = order_item.material_name
    color_display = color or "(no color)"

    if status == "FULL_AVAILABLE":
        message = (
            f"✅ {color_display} {material} {requested_meters}m fully available."
        )

        next_step = "CONFIRM_ORDER"

    elif status == "PARTIAL_AVAILABLE":
        message = (
            f"⚠️ {color_display} {material} {requested_meters}m requested.\n"
            f"Currently {available_meters}m available.\n\n"
            "Aap kya karna chahenge?\n"
            "• Available quantity bhej dein\n"
            "• Item cancel kar dein"
        )

        next_step = "CUSTOMER_NEGOTIATION"

    else:
        message = (
            f"❌ {color_display} {material} abhi stock mein available nahi hai."
        )

        next_step = "CUSTOMER_NEGOTIATION"

    return {
        "message": message,
        "next_step": next_step
    }

