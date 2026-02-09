from decimal import Decimal

from app.database import SessionLocal
from app.models.material import Material
from app.models.inventory import InventoryBatch
from app.models.customer import Customer
from app.models.invoice import Invoice

from app.crud.inventory import (
    get_inventory_batches,
    deduct_inventory_from_batch
)
from app.crud.customer import get_or_create_customer
from app.crud.order import (
    create_order,
    add_order_item,
    update_order_item_quantity,
    cancel_order_item,
    update_order_status
)
from app.crud.invoice import create_invoice
from app.crud.credit import add_payment


def run_full_pipeline_test():
    db = SessionLocal()

    print("\n========== FULL BACKEND PIPELINE TEST ==========\n")

    # --------------------------------------------------
    print("1️⃣ MATERIAL SETUP")
    material = db.query(Material).filter_by(material_name="cotton").first()
    if not material:
        material = Material(material_name="cotton", category="raw")
        db.add(material)
        db.commit()
        db.refresh(material)
    print("✔ Material:", material.material_id)

    # --------------------------------------------------
    print("\n2️⃣ INVENTORY BATCH SETUP")
    batch = InventoryBatch(
        material_id=material.material_id,
        color="blue",
        rolls_available=3,
        meters_per_roll=20,
        loose_meters_available=5
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    print("✔ Batch:", batch.batch_id)

    # --------------------------------------------------
    print("\n3️⃣ INVENTORY READ")
    batches = get_inventory_batches(db, "cotton", "blue")
    print("✔ Batches found:", len(batches))

    # --------------------------------------------------
    print("\n4️⃣ CUSTOMER SETUP")
    customer = get_or_create_customer(
        db,
        phone_number="9999999999",
        business_name="Test Textile Shop"
    )
    print("✔ Customer:", customer.phone_number)

    # --------------------------------------------------
    print("\n5️⃣ ORDER CREATION")
    order = create_order(db, customer.phone_number)
    print("✔ Order:", order.order_id)

    # --------------------------------------------------
    print("\n6️⃣ ADD ORDER ITEM")
    item = add_order_item(
        db,
        order_id=order.order_id,
        material_id=material.material_id,
        quantity_meters=40,
        price_per_meter=Decimal("100")
    )
    print("✔ Order Item:", item.order_item_id)

    # --------------------------------------------------
    print("\n7️⃣ UPDATE ORDER ITEM QUANTITY")
    item = update_order_item_quantity(
        db,
        item.order_item_id,
        quantity_meters=50
    )
    print("✔ Updated quantity:", item.quantity_meters)

    # --------------------------------------------------
    print("\n8️⃣ INVENTORY DEDUCTION")
    updated_batch = deduct_inventory_from_batch(
        db,
        batch_id=batch.batch_id,
        rolls_to_deduct=1,
        loose_meters_to_deduct=5
    )
    print(
        "✔ Remaining stock:",
        updated_batch.rolls_available,
        "rolls +",
        updated_batch.loose_meters_available,
        "meters"
    )

    # --------------------------------------------------
    print("\n9️⃣ CREATE INVOICE (PDF + LEDGER)")
    invoice = create_invoice(db, order.order_id)
    print("✔ Invoice:", invoice.invoice_number)
    print("✔ PDF Path:", invoice.pdf_path)
    print("✔ Invoice Total:", invoice.total_amount)

    # --------------------------------------------------
    print("\n🔟 OUTSTANDING BEFORE PAYMENT")
    db.refresh(customer)
    print("✔ Outstanding:", customer.outstanding_balance)

    # --------------------------------------------------
    print("\n1️⃣1️⃣ ADD PAYMENT")
    add_payment(
        db,
        customer_phone=customer.phone_number,
        amount=Decimal("500")
    )
    db.refresh(customer)
    print("✔ Outstanding after payment:", customer.outstanding_balance)

    # --------------------------------------------------
    print("\n1️⃣2️⃣ UPDATE ORDER STATUS")
    update_order_status(db, order.order_id, "confirmed")
    print("✔ Order confirmed")

    # --------------------------------------------------
    print("\n1️⃣3️⃣ CANCEL ORDER ITEM (POST TEST)")
    cancel_order_item(db, item.order_item_id)
    print("✔ Order item cancelled")

    db.close()

    print("\n✅ ALL PIPELINE TESTS PASSED SUCCESSFULLY")
    print("=============================================\n")


if __name__ == "__main__":
    run_full_pipeline_test()
