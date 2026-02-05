from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from models import db, Order, Buyer, Item, OrderItem
from utils import format_date_display
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

def verify_company_access():
    try:
        claims = get_jwt()
        return claims.get('company_id')
    except:
        # For development: extract from Authorization header if it's a mock token
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer mock-token-'):
            company_code = auth_header.replace('Bearer mock-token-', '')
            # Map company codes to IDs
            if company_code == 'PC':
                return 1
            elif company_code == 'QP':
                return 2
        return 1  # Default to first company

@bp.route('', methods=['GET'])
def get_dashboard():
    company_id = verify_company_access()
    
    # Summary metrics
    total_sales = db.session.query(func.sum(Order.total_amount)).filter_by(company_id=company_id).scalar() or 0
    
    # Count orders with pending status as pending payments
    pending_orders_amount = db.session.query(func.sum(Order.total_amount)).filter(
        Order.company_id == company_id,
        Order.status == 'pending'
    ).scalar() or 0
    
    recent_orders = Order.query.filter_by(company_id=company_id).filter(
        Order.created_at >= datetime.utcnow() - timedelta(days=30)
    ).all()
    
    # Order status counts
    paid = Order.query.filter_by(company_id=company_id, status='paid').count()
    partial = Order.query.filter_by(company_id=company_id, status='partial').count()
    pending = Order.query.filter_by(company_id=company_id, status='pending').count()

    # Legacy/alternate statuses (optional, included in pending if used)
    confirmed = Order.query.filter_by(company_id=company_id, status='confirmed').count()
    shipped = Order.query.filter_by(company_id=company_id, status='shipped').count()
    if confirmed or shipped:
        pending += confirmed + shipped
    
    # Recent orders
    recent_orders_data = [{
        'id': o.id,
        'order_number': o.order_number,
        'buyer_name': o.buyer.company_name,
        'total_amount': o.total_amount,
        'status': o.status,
        'created_at': format_date_display(o.created_at)
    } for o in sorted(recent_orders, key=lambda x: x.created_at, reverse=True)[:10]]
    
    # Buyer-wise sales (top 5)
    buyers_query = db.session.query(
        Buyer.company_name,
        func.sum(Order.total_amount).label('total')
    ).join(Order).filter(Order.company_id == company_id).group_by(Buyer.id).order_by(
        func.sum(Order.total_amount).desc()
    ).limit(5).all()
    
    buyer_data = [{'name': b[0], 'value': float(b[1])} for b in buyers_query]
    
    # Item-wise sales (top 5)
    items_query = db.session.query(
        Item.name,
        func.sum(OrderItem.line_total).label('total')
    ).join(OrderItem).filter(Item.company_id == company_id).group_by(Item.id).order_by(
        func.sum(OrderItem.line_total).desc()
    ).limit(5).all()
    
    item_data = [{'name': i[0], 'value': float(i[1])} for i in items_query]
    
    return jsonify({
        'summary': {
            'total_sales': float(total_sales),
            'pending_payments': float(pending_orders_amount),
            'recent_orders_count': len(recent_orders)
        },
        'payment_status': {
            'paid': paid,
            'partial': partial,
            'pending': pending
        },
        'recent_orders': recent_orders_data,
        'buyer_wise_sales': buyer_data,
        'item_wise_sales': item_data
    }), 200
