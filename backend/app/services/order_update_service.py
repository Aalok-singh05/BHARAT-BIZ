from app.workflows.customer_decisions import CustomerDecision
from app.workflows.order_item_status import OrderItemStatus
from app.services.inventory_service import check_inventory


def apply_customer_decisions(session, decision_output):

    decisions = decision_output["item_decisions"]

    for decision in decisions:

        material = decision["material"]
        action = decision["decision"]

        # ⭐ Iterate over COPY to avoid mutation bugs
        for item in list(session.items):

            if item.measurement.material_name.lower() != material.lower():
                continue

            # ⭐ Skip already replaced items
            if item.status == OrderItemStatus.REPLACED:
                continue

            # -------------------------------------------------
            # ACCEPT AVAILABLE
            # -------------------------------------------------
            if action == CustomerDecision.ACCEPT_AVAILABLE:

                # If item was partial → adjust quantity
                if (
                    item.inventory_status == "PARTIAL_AVAILABLE"
                    and item.available_meters
                ):
                    item.measurement.normalized_meters = item.available_meters

                item.status = OrderItemStatus.ACCEPTED
                break

            # -------------------------------------------------
            # CANCEL ITEM
            # -------------------------------------------------
            elif action == CustomerDecision.CANCEL_ITEM:

                item.status = OrderItemStatus.CANCELLED
                break

            # -------------------------------------------------
            # REQUEST ALTERNATIVE
            # -------------------------------------------------
            elif action == CustomerDecision.REQUEST_ALTERNATIVE:

                item.status = OrderItemStatus.NEGOTIATING
                break

            # -------------------------------------------------
            # EDIT / REPLACEMENT LOGIC
            # -------------------------------------------------
            elif action == CustomerDecision.EDIT_ITEM:

                new_color = decision.get("new_color")
                new_material = decision.get("new_material")
                new_quantity = decision.get("new_quantity")

                old_measurement = item.measurement

                # ⭐ Deep copy to avoid mutation issues
                updated_measurement = old_measurement.copy(deep=True)

                if new_color:
                    updated_measurement.color = new_color

                if new_material:
                    updated_measurement.material_name = new_material

                if new_quantity:
                    updated_measurement.normalized_meters = new_quantity

                # ⭐ Create replacement item
                from app.schemas.order_item_schema import OrderItem

                new_item = OrderItem(
                    measurement=updated_measurement,
                    status=OrderItemStatus.NEGOTIATING
                )

                # ⭐ Re-check inventory for new item
                inventory_result = check_inventory(
                    new_item.measurement,
                    session.available_batches,
                    new_item.measurement.color
                )

                new_item.inventory_status = inventory_result["status"]
                new_item.available_meters = inventory_result["available_meters"]
                new_item.fulfilled_batches = inventory_result["fulfilled_batches"]

                # ⭐ Mark old item as replaced
                item.status = OrderItemStatus.REPLACED
                item.replaced_by = new_item.item_id

                # ⭐ Add new item to session
                session.items.append(new_item)

                break


# -------------------------------------------------
# ALL ITEMS RESOLVED CHECK
# -------------------------------------------------
def all_items_resolved(session):

    for item in session.items:
        if item.status == OrderItemStatus.NEGOTIATING:
            return False

    return True


# -------------------------------------------------
# ALL ITEMS CANCELLED CHECK
# -------------------------------------------------
def all_items_cancelled(session):

    for item in session.items:
        if item.status not in [
            OrderItemStatus.CANCELLED,
            OrderItemStatus.REPLACED
        ]:
            return False

    return True
