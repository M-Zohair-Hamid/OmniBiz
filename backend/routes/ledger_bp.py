from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, Buyer, OrderItem
from utils import get_company_id_from_token, format_date_display
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from sqlalchemy import func
import io

bp = Blueprint('ledgers', __name__, url_prefix='/api/ledgers')

def verify_company_access():
    return get_company_id_from_token()

@bp.route('/<int:buyer_id>', methods=['GET'])
def get_ledger(buyer_id):
    """Get ledger data for a specific buyer - simplified without invoices"""
    company_id = verify_company_access()
    
    # Get date range from query params
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    # Verify buyer belongs to company
    buyer = Buyer.query.filter_by(id=buyer_id, company_id=company_id).first()
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    # Build query for orders
    query = Order.query.filter(
        Order.buyer_id == buyer_id,
        Order.company_id == company_id
    )
    
    # Apply date filters
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Order.order_date >= start)
        except ValueError:
            return jsonify({'error': 'Invalid start date format. Use YYYY-MM-DD'}), 400
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Order.order_date <= end)
        except ValueError:
            return jsonify({'error': 'Invalid end date format. Use YYYY-MM-DD'}), 400
    
    orders = query.order_by(Order.order_date).all()
    
    # Calculate ledger entries from orders
    ledger_entries = []
    running_balance = 0
    
    for order in orders:
        # Add order entries (debit)
        for item in order.items:
            running_balance += item.line_total
            
            ledger_entries.append({
                'date': format_date_display(order.order_date),
                'invoice_number': order.order_number,
                'item_name': item.item.name,
                'quantity': item.quantity,
                'rate': item.unit_price,
                'amount': item.line_total,
                'tax': order.tax_amount,
                'total': item.line_total,
                'type': 'debit',
                'balance': running_balance
            })
    
    # Calculate summary
    total_debits = sum([e['total'] for e in ledger_entries if e['type'] == 'debit'])
    total_credits = 0  # No payments yet
    closing_balance = total_debits - total_credits
    
    return jsonify({
        'buyer': {
            'id': buyer.id,
            'company_name': buyer.company_name,
            'address': buyer.address,
            'city': buyer.city,
            'gst_number': buyer.gst_number,
            'ntn_number': buyer.ntn_number,
            'phone': buyer.phone,
            'email': buyer.email
        },
        'entries': ledger_entries,
        'summary': {
            'opening_balance': 0,
            'total_debits': total_debits,
            'total_credits': total_credits,
            'closing_balance': closing_balance
        },
        'date_range': {
            'start': start_date if start_date else 'All',
            'end': end_date if end_date else 'All'
        }
    }), 200

@bp.route('/<int:buyer_id>/pdf', methods=['GET'])
def generate_ledger_pdf(buyer_id):
    """Generate simplified PDF for buyer ledger (Invoice/Payment features pending)"""
    return jsonify({'error': 'PDF export feature will be re-implemented with new invoice system'}), 501
