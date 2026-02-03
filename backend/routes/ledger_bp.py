from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, Buyer, OrderItem, Payment
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
    
    # Get all payments for these orders
    order_ids = [order.id for order in orders]
    payments_query = Payment.query.filter(
        Payment.order_id.in_(order_ids),
        Payment.company_id == company_id
    )
    
    # Apply date filters to payments as well
    if start_date:
        payments_query = payments_query.filter(Payment.payment_date >= start)
    if end_date:
        payments_query = payments_query.filter(Payment.payment_date <= end)
    
    payments = payments_query.order_by(Payment.payment_date).all()
    
    # Calculate ledger entries from orders and payments (order-wise)
    ledger_entries = []
    running_balance = 0
    
    # Combine orders and payments, sort by date
    all_transactions = []
    
    # Add orders as transactions
    for order in orders:
        all_transactions.append({
            'date': order.order_date,
            'type': 'order',
            'data': order
        })
    
    # Add payments as transactions
    for payment in payments:
        all_transactions.append({
            'date': payment.payment_date,
            'type': 'payment',
            'data': payment
        })
    
    # Sort all transactions by date
    all_transactions.sort(key=lambda x: x['date'])
    
    # Process transactions in chronological order
    for transaction in all_transactions:
        if transaction['type'] == 'order':
            order = transaction['data']
            running_balance += order.total_amount
            
            # Create order description from items
            item_names = [item.item.name for item in order.items[:3]]  # First 3 items
            if len(order.items) > 3:
                item_names.append(f"+ {len(order.items) - 3} more")
            description = ", ".join(item_names)
            
            ledger_entries.append({
                'date': format_date_display(order.order_date),
                'reference': order.order_number,
                'description': description,
                'debit': order.total_amount,
                'credit': 0,
                'sales_tax': order.tax_amount,
                'income_tax': 0,
                'type': 'debit',
                'balance': running_balance
            })
        
        elif transaction['type'] == 'payment':
            payment = transaction['data']
            running_balance -= payment.amount
            
            ledger_entries.append({
                'date': format_date_display(payment.payment_date),
                'reference': f"Payment - {payment.order.order_number if payment.order else 'N/A'}",
                'description': f"{payment.payment_method.replace('_', ' ').title()} - {payment.notes if payment.notes else 'Payment received'}",
                'debit': 0,
                'credit': payment.amount,
                'sales_tax': 0,
                'income_tax': payment.income_tax_amount if payment.income_tax_amount else 0,
                'type': 'credit',
                'balance': running_balance
            })
    
    # Calculate summary
    total_debits = sum([e['debit'] for e in ledger_entries if e['type'] == 'debit'])
    total_credits = sum([e['credit'] for e in ledger_entries if e['type'] == 'credit'])
    total_sales_tax = sum([e['sales_tax'] for e in ledger_entries])
    total_income_tax = sum([e['income_tax'] for e in ledger_entries])
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
            'total_sales_tax': total_sales_tax,
            'total_income_tax': total_income_tax,
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
