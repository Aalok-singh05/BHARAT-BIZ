from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_invoice_pdf(context, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    y = height - 40

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "INVOICE")
    y -= 40

    # Header
    c.setFont("Helvetica", 10)
    c.drawString(40, y, f"Invoice No: {context['invoice_number']}")
    y -= 15
    c.drawString(40, y, f"Date: {context['date']}")
    y -= 15
    c.drawString(40, y, f"Customer: {context['customer_name']}")
    y -= 30

    # Table header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y, "Material")
    c.drawString(220, y, "Qty (m)")
    c.drawString(300, y, "Rate")
    c.drawString(380, y, "Amount")
    y -= 15

    c.setFont("Helvetica", 10)

    # Items
    for item in context["items"]:
        c.drawString(40, y, str(item["material"]))
        c.drawString(220, y, str(item["qty"]))
        c.drawString(300, y, str(item["rate"]))
        c.drawString(380, y, str(item["amount"]))
        y -= 15

        if y < 80:
            c.showPage()
            y = height - 40

    y -= 20

    # Totals
    c.drawRightString(500, y, f"Subtotal: {context['subtotal']}")
    y -= 15
    c.drawRightString(500, y, f"GST: {context['gst']}")
    y -= 15
    c.drawRightString(500, y, f"Total: {context['total']}")

    c.showPage()
    c.save()
