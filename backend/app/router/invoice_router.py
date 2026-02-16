from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.customer import Customer
from fastapi.responses import FileResponse
import os

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

@router.get("/{invoice_id}/download")
def download_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """
    Download the invoice PDF.
    """
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if not invoice.pdf_path or not os.path.exists(invoice.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")

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

    # 2. Validate PDF existence
    if not invoice.pdf_path or not os.path.exists(invoice.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")

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
        raise HTTPException(status_code=500, detail=f"WhatsApp send failed: {str(e)}")
