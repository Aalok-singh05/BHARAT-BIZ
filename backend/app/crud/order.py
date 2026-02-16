from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.order_item import OrderItem


def create_order(
    db: Session,
    customer_phone: str
):
    order = Order(
        customer_phone=customer_phone,
        status="PENDING"
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def add_order_item(
    db: Session,
    order_id,
    material_id,
    quantity_meters,
    price_per_meter
):
    item = OrderItem(
        order_id=order_id,
        material_id=material_id,
        quantity_meters=quantity_meters,
        price_per_meter=price_per_meter
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_order_status(
    db: Session,
    order_id,
    status: str
):
    order = (
        db.query(Order)
        .filter(Order.order_id == order_id)
        .first()
    )

    if not order:
        raise ValueError("Order not found")

    order.status = status
    db.commit()
    db.refresh(order)
    return order

def update_order_item_quantity(
    db: Session,
    order_item_id,
    quantity_meters
):
    item = (
        db.query(OrderItem)
        .filter(OrderItem.order_item_id == order_item_id)
        .first()
    )

    if not item:
        raise ValueError("Order item not found")

    item.quantity_meters = quantity_meters
    db.commit()
    db.refresh(item)
    return item

def cancel_order_item(
    db: Session,
    order_item_id
):
    item = (
        db.query(OrderItem)
        .filter(OrderItem.order_item_id == order_item_id)
        .first()
    )

    if not item:
        raise ValueError("Order item not found")

    db.delete(item)
    db.commit()
    return True
