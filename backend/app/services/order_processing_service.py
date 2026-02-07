from typing import List, Dict

from app.services.order_extractor import extract_textile_order
from app.services.inventory_service import check_inventory
from app.services.negotiation_service import generate_inventory_response
from app.schemas.inventory_schema import InventoryBatch


def process_customer_order(message: str,
                           available_batches: List[InventoryBatch],
                           color_map: Dict[str,str]) -> List[Dict]:
    """
    Full order processing pipeline:
    Extraction → Inventory → Negotiation
    """

    extracted_items= extract_textile_order(message)

    responses= []

    for item in extracted_items:

        # Get color for item (temporary mapping until extractor supports color)
        color = color_map.get(item.material_name.lower(), "unknown")

        inventory_result = check_inventory(item,
                                           available_batches,
                                           color)
        
        negotiation_response = generate_inventory_response(item,
                                                           inventory_result,
                                                           color)
        
        responses.append({
            "material": item.material_name,
            "color": color,
            "response": negotiation_response
        })

        return responses