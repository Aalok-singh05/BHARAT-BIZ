from datetime import datetime
from decimal import Decimal
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.customer import Customer
from app.models.material import Material
from app.utils.pdf import generate_invoice_pdf
from app.crud.credit import add_credit_for_invoice
from app.crud.gst_config import get_gst_rate


def generate_invoice_number():
    return f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def create_invoice(db: Session, order_id):
    # 1️⃣ Fetch order
    order = (
        db.query(Order)
        .filter(Order.order_id == order_id)
        .first()
    )
    if not order:
        raise ValueError("Order not found")

    # 2️⃣ Fetch order items
    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order_id)
        .all()
    )
    if not items:
        raise ValueError("Order has no items")

    # 3️⃣ Calculate subtotal
    subtotal = sum(
        (item.quantity_meters * item.price_per_meter)
        for item in items
    )

    # 4️⃣ GST + total (Dynamic from DB)
    gst_rate = get_gst_rate(db)
    gst_amount = subtotal * gst_rate
    total_amount = subtotal + gst_amount

    # 5️⃣ Create invoice DB record (PDF pending)
    invoice = Invoice(
        order_id=order_id,
        invoice_number=generate_invoice_number(),
        subtotal=subtotal,
        gst_amount=gst_amount,
        total_amount=total_amount,
        pdf_path="PENDING"
    )

    db.add(invoice)
    db.flush()  # No commit — caller manages transaction
    db.refresh(invoice)

    # 6️⃣ Fetch customer
    customer = (
        db.query(Customer)
        .filter(Customer.phone_number == order.customer_phone)
        .first()
    )

    # 7️⃣ Build invoice item rows
    item_rows = []
    for item in items:
        material = (
            db.query(Material)
            .filter(Material.material_id == item.material_id)
            .first()
        )

        amount = item.quantity_meters * item.price_per_meter

        item_rows.append({
            "material": material.material_name,
            "qty": item.quantity_meters,
            "rate": item.price_per_meter,
            "amount": amount
        })

    # 8️⃣ Prepare PDF path
    invoices_dir = Path("app/invoices")
    invoices_dir.mkdir(exist_ok=True)

    pdf_path = invoices_dir / f"{invoice.invoice_number}.pdf"

    # 9️⃣ Generate PDF
    generate_invoice_pdf(
        context={
            "invoice_number": invoice.invoice_number,
            "date": datetime.now().strftime("%d-%m-%Y"),
            "customer_name": customer.business_name or customer.phone_number,
            "items": item_rows,
            "subtotal": subtotal,
            "gst": gst_amount,
            "total": total_amount
        },
        output_path=str(pdf_path)
    )

    # 🔟 Update invoice with PDF path
    invoice.pdf_path = str(pdf_path)
    db.flush()  # No commit — caller manages transaction
    db.refresh(invoice)

    # 🔗 Add credit entry for this invoice
    add_credit_for_invoice(
        db=db,
        customer_phone=order.customer_phone,
        order_id=order_id,
        amount=total_amount
    )

    return invoice
