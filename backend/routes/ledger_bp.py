from flask import Blueprint, request, jsonify, send_file, g
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

def get_session():
    """Get the session bound to current company's database"""
    company_code = getattr(g, 'company_code', 'umarsons')
    engine = db.engines[company_code]
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    return Session()

def verify_company_access():
    return get_company_id_from_token()

@bp.route('/<int:buyer_id>', methods=['GET'])
def get_ledger(buyer_id):
    """Get ledger data for a specific buyer - simplified without invoices"""
    company_id = verify_company_access()
    session = get_session()
    
    # Get date range from query params
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    # Verify buyer belongs to company
    buyer = session.query(Buyer).filter_by(id=buyer_id, company_id=company_id).first()
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    # Build query for orders
    query = session.query(Order).filter(
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
    payments_query = session.query(Payment).filter(
        Payment.order_id.in_(order_ids),
        Payment.company_id == company_id
    )
    
    # Apply date filters to payments as well
    if start_date:
        payments_query = payments_query.filter(Payment.payment_date >= start)
    if end_date:
        payments_query = payments_query.filter(Payment.payment_date <= end)
    
    payments = payments_query.order_by(Payment.payment_date).all()
    
    # Build order summary with payments
    order_summaries = []
    total_income_tax_all = 0
    
    for order in orders:
        # Calculate total payments for this order
        order_payments = [p for p in payments if p.order_id == order.id]
        total_paid = round(sum(p.amount for p in order_payments), 2)
        remaining = round(order.total_amount - total_paid, 2)
        
        # Calculate order status
        if total_paid <= 0:
            order_status = 'pending'
        elif remaining <= 0:
            order_status = 'paid'
        else:
            order_status = 'partial'
        
        # Calculate total income tax for this order
        order_income_tax = round(sum(p.income_tax_amount if p.income_tax_amount else 0 for p in order_payments), 2)
        total_income_tax_all += order_income_tax
        
        order_summaries.append({
            'order_id': order.id,
            'order_number': order.order_number,
            'subtotal': round(order.subtotal, 2),
            'total_amount': round(order.total_amount, 2),
            'status': order_status,
            'total_paid': total_paid,
            'due_payment': remaining if order_status == 'partial' else 0,
            'income_tax': order_income_tax
        })
    
    # Calculate summary totals
    total_sales = sum([o['total_amount'] for o in order_summaries])
    total_payments = sum([o['total_paid'] for o in order_summaries])
    total_due = sum([o['due_payment'] for o in order_summaries])
    
    ledger_entries = []  # Keep for backward compatibility but will show order summaries
    
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
        'orders': order_summaries,
        'summary': {
            'total_sales': total_sales,
            'total_payments': total_payments,
            'total_due': total_due,
            'total_income_tax': total_income_tax_all
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
