from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.customer import Customer
from fastapi.responses import FileResponse
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"]
)

@router.get("")
def get_invoices(
    search: str = None,
    db: Session = Depends(get_db)
):
    """
    List all invoices with optional search by customer name or invoice number.
    """
    query = db.query(
        Invoice,
        Customer.business_name,
        Customer.phone_number
    ).join(
        Order, Invoice.order_id == Order.order_id
    ).join(
        Customer, Order.customer_phone == Customer.phone_number
    )

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Customer.business_name).like(search_term)) |
            (func.lower(Invoice.invoice_number).like(search_term))
        )

    # Order by newest first
    results = query.order_by(desc(Invoice.created_at)).all()

    invoices = []
    for invoice, business_name, phone in results:
        invoices.append({
            "id": str(invoice.invoice_id),
            "invoice_number": invoice.invoice_number,
            "date": invoice.created_at.strftime("%d-%m-%Y"),
            "customer_name": business_name or phone, # Fallback to phone if no business name
            "customer_phone": phone,
            "amount": float(invoice.total_amount),
            "gst_amount": float(invoice.gst_amount),
            "status": "Generated", # Since it exists in DB
            "pdf_generated": bool(invoice.pdf_path and os.path.exists(invoice.pdf_path))
        })

    return invoices

def ensure_invoice_pdf_exists(db: Session, invoice: Invoice):
    """
    Checks if the invoice PDF exists locally. if not, REGENERATES it.
    This fixes the issue where invoices generated on one machine are missing on others.
    """
    # 1. Check if file exists
    if invoice.pdf_path and os.path.exists(invoice.pdf_path):
        return True

    # 2. If missing, REGENERATE
    logger.warning(f"Invoice PDF missing for {invoice.invoice_number}. Regenerating...")
    
    try:
        from app.models.order_item import OrderItem
        from app.models.material import Material
        from app.utils.pdf import generate_invoice_pdf
        from pathlib import Path
        from datetime import datetime

        # Fetch Data
        order = db.query(Order).filter(Order.order_id == invoice.order_id).first()
        customer = db.query(Customer).filter(Customer.phone_number == order.customer_phone).first()
        items = db.query(OrderItem).filter(OrderItem.order_id == invoice.order_id).all()

        # Build Items
        item_rows = []
        for item in items:
            material = db.query(Material).filter(Material.material_id == item.material_id).first()
            amount = float(item.quantity_meters or 0) * float(item.price_per_meter or 0)
            item_rows.append({
                "material": material.material_name if material else "Unknown",
                "qty": float(item.quantity_meters or 0),
                "rate": float(item.price_per_meter or 0),
                "amount": amount
            })

        # Prepare Path
        invoices_dir = Path("app/invoices")
        invoices_dir.mkdir(parents=True, exist_ok=True) # Ensure directory exists
        
        # Use existing path if valid structure, else create new
        if invoice.pdf_path and "app/invoices" in invoice.pdf_path.replace("\\", "/"):
             pdf_path = invoice.pdf_path 
        else:
             pdf_path = str(invoices_dir / f"{invoice.invoice_number}.pdf")

        # Call Generator
        generate_invoice_pdf(
            context={
                "invoice_number": invoice.invoice_number,
                "date": invoice.created_at.strftime("%d-%m-%Y"),
                "customer_name": customer.business_name or customer.phone_number,
                "items": item_rows,
                "subtotal": float(invoice.subtotal),
                "gst": float(invoice.gst_amount),
                "total": float(invoice.total_amount)
            },
            output_path=pdf_path
        )

        # Update DB if path changed (normalize separators)
        invoice.pdf_path = str(pdf_path)
        db.commit()
        db.refresh(invoice)
        
        logger.info(f"Successfully regenerated invoice: {pdf_path}")
        return True

    except Exception as e:
        logger.error(f"Failed to regenerate invoice PDF: {e}")
        return False

@router.get("/{invoice_id}/download")
def download_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """
    Download the invoice PDF.
    """
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # ATTEMPT REGENERATION IF MISSING
    if not ensure_invoice_pdf_exists(db, invoice):
         raise HTTPException(status_code=404, detail="PDF file not found and could not be regenerated.")

    return FileResponse(
        path=invoice.pdf_path,
        media_type="application/pdf",
        filename=f"{invoice.invoice_number}.pdf"
    )

@router.post("/{invoice_id}/send")
def send_invoice_whatsapp(invoice_id: str, db: Session = Depends(get_db)):
    """
    Resend the invoice PDF to the customer via WhatsApp.
    """
    from app.integrations.whatsapp import upload_media, send_document_message

    # 1. Fetch Invoice & Link to Customer
    result = db.query(Invoice, Customer.phone_number, Customer.business_name)\
        .join(Order, Invoice.order_id == Order.order_id)\
        .join(Customer, Order.customer_phone == Customer.phone_number)\
        .filter(Invoice.invoice_id == invoice_id)\
        .first()

    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice, phone, business_name = result

    # 2. Validate PDF existence (Auto-Regenerate)
    if not ensure_invoice_pdf_exists(db, invoice):
        raise HTTPException(status_code=404, detail="PDF file not found and could not be regenerated.")

    # 3. Upload PDF to WhatsApp to get Media ID
    try:
        media_id = upload_media(invoice.pdf_path, mime_type="application/pdf")
        if not media_id:
             raise HTTPException(status_code=500, detail="Failed to upload PDF to WhatsApp")

        # 4. Send Document Message
        caption = f"Here is your invoice {invoice.invoice_number} from {business_name or 'Sharma Textiles'}."
        filename = f"{invoice.invoice_number}.pdf"
        
        response = send_document_message(phone, media_id, filename=filename, caption=caption)
        
        return {
            "status": "success",
            "message": "Invoice sent successfully",
            "whatsapp_response": response
        }
    except Exception as e:
        logger.error(f"WhatsApp send failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"WhatsApp send failed: {str(e)}")
