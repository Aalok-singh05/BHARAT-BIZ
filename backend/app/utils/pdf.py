from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO

def generate_invoice_pdf(context, output_path):
    """
    Generates a professional PDF invoice using ReportLab Platypus.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#2c3e50"),
        alignment=1, # Center
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#7f8c8d")
    )
    
    # 1. Header Section
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Paragraph("<b>BHARAT-BIZ TEXTILES</b>", styles['Heading3']))
    elements.append(Paragraph("123, Market Road, Surat, Gujarat - 395002", header_style))
    elements.append(Paragraph("GSTIN: 24ABCDE1234F1Z5", header_style))
    elements.append(Paragraph("Phone: +91 98765 43210", header_style))
    elements.append(Spacer(1, 20))

    # 2. Invoice & Customer Details (Grid)
    # Left: Bill To, Right: Invoice Info
    
    customer_info = [
        [Paragraph("<b>BILL TO:</b>", styles['Normal'])],
        [Paragraph(f"{context.get('customer_name', 'Valued Customer')}", styles['Normal'])],
        [Paragraph(f"{context.get('customer_phone', '')}", styles['Normal'])],
    ]
    
    invoice_info = [
        [Paragraph("<b>INVOICE DETAILS:</b>", styles['Normal'])],
        [Paragraph(f"Invoice No: {context['invoice_number']}", styles['Normal'])],
        [Paragraph(f"Date: {context['date']}", styles['Normal'])],
    ]
    
    # Create a table for header layout
    header_data = [[
        Table(customer_info, colWidths=[250]),
        Table(invoice_info, colWidths=[200])
    ]]
    
    header_table = Table(header_data, colWidths=[280, 230])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 30))

    # 3. Items Table
    data = [['Item', 'Qty (m)', 'Rate', 'Amount']]
    
    items = context.get('items', [])
    for item in items:
        data.append([
            item['material'],
            f"{item['qty']}",
            f"Rs. {item['rate']}",
            f"Rs. {item['amount']}"
        ])
    
    # Table Styling
    table = Table(data, colWidths=[250, 80, 80, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#ecf0f1")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'), # Qty right align
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'), # Rate right align
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'), # Amount right align
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#bdc3c7")),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))

    # 4. Totals
    subtotal = context.get('subtotal', 0)
    gst = context.get('gst', 0)
    total = context.get('total', 0)

    totals_data = [
        ['Subtotal:', f"Rs. {subtotal}"],
        [f'GST ({round(float(gst / subtotal) * 100) if subtotal else 0}%):', f"Rs. {gst}"],
        ['Total Amount:', f"Rs. {total}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[410, 100])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'), # Bold Total row
        ('FONTSIZE', (0, 2), (-1, 2), 12),
        ('TOPPADDING', (0, 2), (-1, 2), 10),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 40))

    # 5. Footer
    elements.append(Paragraph("<b>Terms & Conditions:</b>", styles['Normal']))
    elements.append(Paragraph("1. Goods once sold will not be taken back.", styles['Normal']))
    elements.append(Paragraph("2. Subject to Surat Jurisdiction.", styles['Normal']))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Thank you for your business!", title_style))

    # Build PDF
    doc.build(elements)
