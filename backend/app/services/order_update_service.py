from app.workflows.customer_decisions import CustomerDecision
from app.workflows.order_item_status import OrderItemStatus
from app.services.inventory_service import check_inventory

def apply_customer_decisions(session, decision_output):

    decisions = decision_output["item_decisions"]

    for decision in decisions:

        material = decision["material"]
        action = decision["decision"]
        decision_color = decision.get("color")

        for item in list(session.items):

            if item.status == OrderItemStatus.REPLACED:
                continue

            if item.measurement.material_name.lower() != material.lower():
                continue

            if decision_color and item.measurement.color.lower() != decision_color.lower():
                continue

            # ---------------- ACCEPT ----------------
            if action == CustomerDecision.ACCEPT_AVAILABLE:

                if (
                    item.inventory_status == "PARTIAL_AVAILABLE"
                    and item.available_meters
                ):
                    item.measurement.normalized_meters = item.available_meters

                item.fulfilled_batches = item.fulfilled_batches or []
                item.status = OrderItemStatus.ACCEPTED
                break

            # ---------------- CANCEL ----------------
            elif action == CustomerDecision.CANCEL_ITEM:
                item.status = OrderItemStatus.CANCELLED
                break

            # ---------------- REQUEST ALT ----------------
            elif action == CustomerDecision.REQUEST_ALTERNATIVE:
                item.status = OrderItemStatus.NEGOTIATING
                break

            # ---------------- EDIT ----------------
            elif action == CustomerDecision.EDIT_ITEM:

                new_color = decision.get("new_color")
                new_material = decision.get("new_material")
                new_quantity = decision.get("new_quantity")

                updated_measurement = item.measurement.copy(deep=True)

                if new_color:
                    updated_measurement.color = new_color

                if new_material:
                    updated_measurement.material_name = new_material

                if new_quantity:
                    updated_measurement.normalized_meters = new_quantity

                from app.schemas.order_item_schema import OrderItem

                new_item = OrderItem(
                    measurement=updated_measurement,
                    status=OrderItemStatus.NEGOTIATING
                )

                available_batches = session.available_batches or []

                inventory_result = check_inventory(
                    new_item.measurement,
                    available_batches,
                    new_item.measurement.color
                )

                new_item.inventory_status = inventory_result["status"]
                new_item.available_meters = inventory_result["available_meters"]
                new_item.fulfilled_batches = inventory_result["fulfilled_batches"]
                new_item.replaced_by = None

                item.status = OrderItemStatus.REPLACED
                item.replaced_by = new_item.item_id

                session.items.append(new_item)

                break


def all_items_resolved(session):

    for item in session.items:

        # Skip replaced items
        if item.status == OrderItemStatus.REPLACED:
            continue

        # If still negotiating → unresolved
        if item.status == OrderItemStatus.NEGOTIATING:
            return False

        # 🚨 NEW RULE
        # If OUT OF STOCK but not cancelled yet → unresolved
        if (
            item.inventory_status == "OUT_OF_STOCK"
            and item.status != OrderItemStatus.CANCELLED
        ):
            return False

    return True




def all_items_cancelled(session):
    return all(
        item.status in [OrderItemStatus.CANCELLED, OrderItemStatus.REPLACED]
        for item in session.items
    )
