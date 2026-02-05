from app.database import SessionLocal
from app.crud.customer import get_or_create_customer
from app.crud.order import create_order, add_order_item
from app.models.material import Material

db = SessionLocal()

customer = get_or_create_customer(
    db,
    phone_number="9999999999",
    business_name="Test Shop"
)

order = create_order(db, customer.phone_number)

material = db.query(Material).first()

if material:
    add_order_item(
        db,
        order_id=order.order_id,
        material_id=material.material_id,
        quantity_meters=50,
        price_per_meter=120
    )

print("Order created:", order.order_id)

db.close()
