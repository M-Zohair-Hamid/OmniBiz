from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, Buyer, Item, OrderItem
from utils import get_company_id_from_token, format_date_display
from datetime import datetime, timedelta
from sqlalchemy import func
import csv
import io

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
