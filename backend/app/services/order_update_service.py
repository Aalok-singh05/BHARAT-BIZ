from app.workflows.customer_decisions import CustomerDecision
from app.workflows.order_item_status import OrderItemStatus


def apply_customer_decisions(session, decision_output):

    decisions = decision_output["item_decisions"]

    for decision in decisions:

        material = decision["material"]
        action = decision["decision"]

        for item in session.items:

            if item.measurement.material_name.lower() == material.lower():

                if action == CustomerDecision.ACCEPT_AVAILABLE:
                    item.status = OrderItemStatus.ACCEPTED

                elif action == CustomerDecision.CANCEL_ITEM:
                    item.status = OrderItemStatus.CANCELLED

                elif action == CustomerDecision.REQUEST_ALTERNATIVE:
                    item.status = OrderItemStatus.NEGOTIATING


def all_items_resolved(session):

    for item in session.items:
        if item.status == OrderItemStatus.NEGOTIATING:
            return False

    return True

def all_items_cancelled(session):

    for item in session.items:
        if item.status != OrderItemStatus.CANCELLED:
            return False

    return True
