from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, Buyer, Item, OrderItem
from utils import get_company_id_from_token, format_date_display
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import joinedload
import csv
import io
import os
import tempfile

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

def verify_company_access():
    return get_company_id_from_token()

@bp.route('/summary', methods=['GET'])
def get_summary():
    company_id = verify_company_access()
    
    # Total sales
    total_sales = db.session.query(func.sum(Order.total_amount)).filter_by(company_id=company_id).scalar() or 0
    
    # Pending orders as pending payments
    pending_payments = db.session.query(func.sum(Order.total_amount)).filter(
        Order.company_id == company_id,
        Order.status == 'pending'
    ).scalar() or 0
    
    # Recent orders count
    recent_orders = Order.query.filter_by(company_id=company_id).filter(
        Order.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    # Total buyers
    total_buyers = Buyer.query.filter_by(company_id=company_id, is_active=True).count()
    
    return jsonify({
        'total_sales': float(total_sales),
        'pending_payments': float(pending_payments),
        'recent_orders': recent_orders,
        'total_buyers': total_buyers
    }), 200

@bp.route('/payment-status', methods=['GET'])
def get_payment_status():
    company_id = verify_company_access()
    
    confirmed = Order.query.filter_by(company_id=company_id, status='confirmed').count()
    shipped = Order.query.filter_by(company_id=company_id, status='shipped').count()
    pending = Order.query.filter_by(company_id=company_id, status='pending').count()
    
    return jsonify({
        'paid': confirmed,
        'partial': shipped,
        'pending': pending
    }), 200

@bp.route('/buyer-wise', methods=['GET'])
def get_buyer_wise():
    company_id = verify_company_access()
    
    buyers = Buyer.query.filter_by(company_id=company_id).all()
    
    data = []
    for buyer in buyers:
        total_orders = db.session.query(func.sum(Order.total_amount)).filter_by(
            buyer_id=buyer.id, company_id=company_id
        ).scalar() or 0
        
        data.append({
            'buyer_name': buyer.company_name,
            'total_orders': float(total_orders),
            'order_count': Order.query.filter_by(buyer_id=buyer.id, company_id=company_id).count()
        })
    
    return jsonify(data), 200

@bp.route('/item-wise', methods=['GET'])
def get_item_wise():
    company_id = verify_company_access()
    
    items = Item.query.filter_by(company_id=company_id).all()
    
    data = []
    for item in items:
        from models import OrderItem
        total_quantity = db.session.query(func.sum(OrderItem.quantity)).filter(
            OrderItem.item_id == item.id
        ).scalar() or 0
        
        total_value = db.session.query(func.sum(OrderItem.line_total)).filter(
            OrderItem.item_id == item.id
        ).scalar() or 0
        
        data.append({
            'item_name': item.name,
            'item_code': item.code,
            'total_quantity': float(total_quantity),
            'total_value': float(total_value),
            'unit_price': item.unit_price,
            'stock': item.quantity_in_stock
        })
    
    return jsonify(data), 200

@bp.route('/orders', methods=['GET'])
def get_orders_report():
    company_id = verify_company_access()
    
    start_date = request.args.get('start_date', '', type=str)
    end_date = request.args.get('end_date', '', type=str)
    buyer_id = request.args.get('buyer_id', '', type=int)
    status = request.args.get('status', '', type=str)
    
    query = Order.query.filter_by(company_id=company_id)
    
    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))
    if buyer_id:
        query = query.filter_by(buyer_id=buyer_id)
    if status:
        query = query.filter_by(status=status)
    
    orders = query.all()
    
    return jsonify([{
        'order_number': o.order_number,
        'buyer_name': o.buyer.company_name,
        'order_date': format_date_display(o.order_date),
        'total_amount': o.total_amount,
        'status': o.status
    } for o in orders]), 200

@bp.route('/orders/export-csv', methods=['GET'])
def export_orders_csv():
    company_id = verify_company_access()
    
    start_date = request.args.get('start_date', '', type=str)
    end_date = request.args.get('end_date', '', type=str)
    
    query = Order.query.filter_by(company_id=company_id)
    
    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))
    
    orders = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Order Number', 'Buyer', 'Order Date', 'Subtotal', 'Tax', 'Total', 'Status'])
    
    for order in orders:
        writer.writerow([
            order.order_number,
            order.buyer.company_name,
            order.order_date.strftime('%d-%m-%Y'),
            f"₨ {order.subtotal:.2f}",
            f"₨ {order.tax_amount:.2f}",
            f"₨ {order.total_amount:.2f}",
            order.status
        ])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'orders_report_{datetime.utcnow().strftime("%Y%m%d")}.csv'
    )

@bp.route('/orders/<int:order_id>/generate-sti-pdf', methods=['GET'])
@jwt_required()
def generate_sti_pdf(order_id):
    """Generate Sales Tax Invoice PDF for an order"""
    company_id = verify_company_access()
    
    # Fetch the order with eager loading
    order = Order.query.options(joinedload(Order.buyer), joinedload(Order.company)).filter_by(id=order_id, company_id=company_id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Get buyer from the order relationship
    buyer = order.buyer
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    # Get order items with eager loading of Item relationship
    order_items = OrderItem.query.options(joinedload(OrderItem.item)).filter_by(order_id=order_id).all()
    
    # Get company name
    company_name = order.company.name if order.company else 'UMARSONS'
    
    # Calculate due date (30 days from order date)
    due_date = (order.order_date + timedelta(days=30)).strftime('%B %d, %Y')
    order_date_str = order.order_date.strftime('%B %d, %Y')
    
    # Build HTML content for the invoice
    items_rows = ''
    subtotal = 0
    for i, item in enumerate(order_items, 1):
        amount_before_tax = item.line_total
        tax_amount = amount_before_tax * (order.tax_rate / 100)
        amount_after_tax = amount_before_tax + tax_amount
        subtotal += amount_before_tax
        
        items_rows += f"""
        <tr>
            <td>{i}</td>
            <td>{item.item.name if hasattr(item, 'item') else 'Item'}</td>
            <td class="center">{item.quantity}</td>
            <td class="right">₨ {item.item.unit_price:,.2f}</td>
            <td class="center">{order.tax_rate}%</td>
            <td class="right">₨ {amount_before_tax:,.2f}</td>
            <td class="right">₨ {amount_after_tax:,.2f}</td>
        </tr>
        """
    
    total_tax = subtotal * (order.tax_rate / 100)
    total_amount = subtotal + total_tax
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{order.order_number}.pdf</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            @page {{
                size: A4;
                margin: 12mm;
            }}

            html, body {{
                height: 100%;
            }}
            
            body {{
                font-family: Arial, Helvetica, sans-serif;
                background: #f8f8f8;
                padding: 15px;
                line-height: 1.4;
            }}
            
            .invoice-container {{
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 10px;
                position: relative;
                z-index: 1;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                min-height: 100%;
                display: flex;
                flex-direction: column;
            }}

            .invoice-content {{
                flex: 1;
                display: flex;
                flex-direction: column;
            }}

            .invoice-bottom {{
                margin-top: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                page-break-inside: avoid;
            }}
            
            .invoice-header {{
                position: relative;
                text-align: center;
                margin-bottom: 5px;
                padding-bottom: 5px;
                border-bottom: 2px solid #17144B;
            }}
            
            .company-logo {{
                position: absolute;
                left: 0;
                top: 0;
                max-width: 100px;
                max-height: 60px;
            }}
            
            .company-logo img {{
                width: 100%;
                height: 100%;
                object-fit: contain;
            }}
            
            .company-info {{
                text-align: center;
                font-size: 11px;
            }}
            
            .company-info h1 {{
                font-family: 'Montserrat', Arial, sans-serif;
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 3px;
                color: #17144B;
                letter-spacing: 2px;
            }}
            
            .company-info p {{
                margin: 1px 0;
                color: #333;
                font-size: 9px;
            }}
            
            .company-info p.address {{
                font-weight: 600;
                font-size: 11px;
            }}
            
            .invoice-title {{
                font-family: 'Montserrat', Arial, sans-serif;
                text-align: center;
                font-size: 18px;
                font-weight: 800;
                color: #17144B;
                margin: 5px 0;
                text-transform: uppercase;
            }}
            
            .details-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 10px;
            }}
            
            .details-section {{
                border: 1px solid #e5e7eb;
                padding: 12px;
                border-radius: 4px;
            }}
            
            .details-section h3 {{
                font-size: 11px;
                font-weight: bold;
                color: #17144B;
                margin-bottom: 8px;
                text-transform: uppercase;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }}
            
            .details-section p {{
                font-size: 10px;
                color: #374151;
                margin: 3px 0;
            }}
            
            .details-section .label {{
                font-weight: bold;
                display: inline-block;
                width: 80px;
            }}
            
            .invoice-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                padding: 0;
                font-size: 10px;
            }}
            
            .invoice-table thead {{
                background: linear-gradient(135deg, #17144B, #0d0a2e);
                color: white;
            }}
            
            .invoice-table th {{
                padding: 6px 6px;
                text-align: left;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 9px;
            }}
            
            .invoice-table th.center {{
                text-align: center;
            }}
            
            .invoice-table th.right {{
                text-align: right;
            }}
            
            .invoice-table td {{
                padding: 4px;
                border-bottom: 1px solid #e5e7eb;
                color: #374151;
            }}
            
            .invoice-table td.center {{
                text-align: center;
            }}
            
            .invoice-table td.right {{
                text-align: right;
            }}
            
            .summary-section {{
                width: 100%;
                margin: 0;
                padding: 0;
                border: 1px solid #17144B;
                border-radius: 4px;
                overflow: hidden;
            }}
            
            .summary-row {{
                display: flex;
                justify-content: space-between;
                padding: 5px 10px;
                font-size: 11px;
                border-bottom: 1px solid #e5e7eb;
            }}
            
            .summary-row.subtotal {{
                background: #f9fafb;
            }}
            
            .summary-row.tax {{
                background: #fef3c7;
                font-weight: 600;
            }}
            
            .summary-row.total {{
                background: linear-gradient(135deg, #17144B, #0d0a2e);
                color: white;
                font-weight: bold;
                font-size: 12px;
                border-bottom: none;
            }}
            
            .amount-in-words {{
                margin-top: 8px;
                padding: 8px 10px;
                background: #e8e7f5;
                border-left: 4px solid #17144B;
                border-radius: 4px;
                font-size: 10px;
                color: #17144B;
                font-weight: 600;
            }}
            
            .tax-breakdown {{
                margin-top: 8px;
                padding: 10px;
                background: #e8e7f5;
                border-left: 4px solid #17144B;
                border-radius: 4px;
            }}
            
            .tax-breakdown h4 {{
                font-size: 10px;
                font-weight: bold;
                color: #17144B;
                margin-bottom: 5px;
                text-transform: uppercase;
            }}
            
            .tax-breakdown table {{
                width: 100%;
                font-size: 10px;
            }}
            
            .tax-breakdown td {{
                padding: 5px 0;
                color: #17144B;
            }}
            
            .tax-breakdown td:last-child {{
                text-align: right;
                font-weight: bold;
            }}
            
            .invoice-footer {{
                text-align: center;
                margin-top: 25px;
                padding-top: 8px;
                border-top: 1px solid #e5e7eb;
                font-size: 9px;
                color: #6b7280;
            }}
            
            .invoice-footer p {{
                margin: 3px 0;
            }}
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-content">
                <!-- Header -->
                <div class="invoice-header">
                    <div class="company-logo">
                        <!-- Logo will be embedded or referenced -->
                    </div>
                    <div class="company-info">
                        <h1>{company_name}</h1>
                        <p class="address">P-5284, ST#09 REHMATABAD, SHEIKUPURA ROAD FAISALABAD.</p>
                    </div>
                </div>
                
                <!-- Invoice Title -->
                <div class="invoice-title">Sales Tax Invoice</div>
                
                <!-- Details Grid -->
                <div class="details-grid">
                    <div class="details-section">
                        <h3>Bill To:</h3>
                        <p><strong>{buyer.company_name}</strong></p>
                        <p><span class="label">City:</span> {buyer.city or 'N/A'}</p>
                        <p><span class="label">NTN:</span> {buyer.ntn_number or 'N/A'}</p>
                        <p><span class="label">GST #:</span> {buyer.gst_number or 'N/A'}</p>
                        <p><span class="label">Phone:</span> {buyer.phone or 'N/A'}</p>
                    </div>
                    <div class="details-section">
                        <h3>Invoice Details:</h3>
                        <p><span class="label">ID#:</span> {order.order_number}</p>
                        <p><span class="label">Date:</span> {order_date_str}</p>
                        <p><span class="label">Due Date:</span> {due_date}</p>
                    </div>
                </div>
                
                <!-- Items Table -->
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th style="width: 4%;">#</th>
                            <th style="width: 30%;">Description</th>
                            <th class="center" style="width: 8%;">Qty</th>
                            <th class="right" style="width: 12%;">Rate</th>
                            <th class="center" style="width: 8%;">Tax %</th>
                            <th class="right" style="width: 15%;">Amount Before Tax</th>
                            <th class="right" style="width: 15%;">Amount After Tax</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_rows}
                    </tbody>
                </table>
                
                <div class="invoice-bottom">
                    <!-- Summary -->
                    <div class="summary-section">
                        <div class="summary-row subtotal">
                            <span>Subtotal (Before Tax):</span>
                            <span>₨ {subtotal:,.2f}</span>
                        </div>
                        <div class="summary-row tax">
                            <span>Sales Tax ({order.tax_rate}%):</span>
                            <span>₨ {total_tax:,.2f}</span>
                        </div>
                        <div class="summary-row">
                            <span>Additional Charges:</span>
                            <span>₨ {0:,.2f}</span>
                        </div>
                        <div class="summary-row total">
                            <span>TOTAL AMOUNT:</span>
                            <span>₨ {total_amount:,.2f}</span>
                        </div>
                    </div>
                    
                    <!-- Amount in Words -->
                    <div class="amount-in-words">
                        <strong>Amount in Words:</strong> [Amount in words will be added]
                    </div>
                    
                    <!-- Tax Breakdown -->
                    <div class="tax-breakdown">
                        <h4>Sales Tax Breakdown</h4>
                        <table>
                            <tr>
                                <td>Base Amount (Before Tax):</td>
                                <td>₨ {subtotal:,.2f}</td>
                            </tr>
                            <tr>
                                <td>GST @ {order.tax_rate}%:</td>
                                <td>₨ {total_tax:,.2f}</td>
                            </tr>
                            <tr>
                                <td style="border-top: 1px solid #17144B; padding-top: 8px;">Total Tax Amount:</td>
                                <td style="border-top: 1px solid #17144B; padding-top: 8px;">₨ {total_tax:,.2f}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="invoice-footer">
                <p><strong>Thank you for your business!</strong></p>
                <p><strong>Payment Terms:</strong> Net 30 Days</p>
                <p>For queries: umarsons08@gmail.com | Cell: 0301-7194270 | WhatsApp: 0313-7050844</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Generate filename
    filename = f"{order.order_number}.pdf"
    
    try:
        # Import WeasyPrint only when needed
        from weasyprint import HTML
        
        # Convert HTML to PDF using WeasyPrint
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        # Return PDF file
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        print(f"PDF Generation Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

