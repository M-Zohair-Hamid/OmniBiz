from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, OrderItem, Item, Buyer
from utils import get_company_id_from_token, format_date_display
from datetime import datetime
import random
import string

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def verify_company_access():
    return get_company_id_from_token()

def generate_order_number(buyer_name, order_date):
    """Generate unique order number: BuyerName_YYYY-MM-DD_ID1000
    Auto ID starts from 1000 and increments per day per buyer"""
    date_str = order_date.strftime('%Y-%m-%d')
    
    # Query all orders for this buyer on this date
    from models import Company
    existing_orders = Order.query.filter(
        Order.order_number.like(f'{buyer_name}_{date_str}_ID%')
    ).all()
    
    # Extract max number
    max_num = 999
    for order in existing_orders:
        try:
            # Format: BuyerName_YYYY-MM-DD_ID1000, BuyerName_YYYY-MM-DD_ID1001, etc
            parts = order.order_number.split('_ID')
            num = int(parts[-1])
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            continue
    
    next_num = max_num + 1
    return f"{buyer_name}_{date_str}_ID{next_num}"

@bp.route('', methods=['GET'])
def get_orders():
    company_id = verify_company_access()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '', type=str)
    
    query = Order.query.filter_by(company_id=company_id)
    
    if status:
        query = query.filter_by(status=status)
    
    pagination = query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'data': [{
            'id': o.id,
            'order_number': o.order_number,
            'buyer_id': o.buyer_id,
            'buyer_name': o.buyer.company_name,
            'order_date': format_date_display(o.order_date),
            'subtotal': o.subtotal,
            'tax_amount': o.tax_amount,
            'total_amount': o.total_amount,
            'status': o.status,
            'created_at': format_date_display(o.created_at)
        } for o in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    company_id = verify_company_access()
    order = Order.query.filter_by(id=order_id, company_id=company_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({
        'id': order.id,
        'order_number': order.order_number,
        'buyer_id': order.buyer_id,
        'buyer_name': order.buyer.company_name,
        'order_date': format_date_display(order.order_date),
        'subtotal': order.subtotal,
        'tax_rate': order.tax_rate,
        'tax_amount': order.tax_amount,
        'total_amount': order.total_amount,
        'status': order.status,
        'notes': order.notes,
        'items': [{
            'id': oi.id,
            'item_id': oi.item_id,
            'item_name': oi.item.name,
            'quantity': oi.quantity,
            'unit_price': oi.unit_price,
            'line_total': oi.line_total
        } for oi in order.items],
        'created_at': format_date_display(order.created_at),
        'updated_at': format_date_display(order.updated_at)
    }), 200

@bp.route('', methods=['POST'])
def create_order():
    company_id = verify_company_access()
    data = request.get_json()
    
    if not data.get('buyer_id') or not data.get('items'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    buyer = Buyer.query.filter_by(id=data['buyer_id'], company_id=company_id).first()
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    # Get buyer name and generate order number
    from models import Company
    company = Company.query.get(company_id)
    order_date = datetime.fromisoformat(data.get('order_date')) if data.get('order_date') else datetime.utcnow()
    order_number = generate_order_number(buyer.company_name, order_date)
    
    # Calculate totals
    subtotal = 0
    items_list = []
    
    for item_data in data['items']:
        item = Item.query.filter_by(id=item_data['item_id'], company_id=company_id).first()
        if not item:
            return jsonify({'error': f'Item {item_data["item_id"]} not found'}), 404
        
        quantity = float(item_data['quantity'])
        
        # Validate stock availability
        if quantity > item.quantity_in_stock:
            return jsonify({'error': f'Insufficient stock for {item.name}. Requested: {quantity}, Available: {item.quantity_in_stock}'}), 400
        
        unit_price = item.unit_price
        line_total = quantity * unit_price
        subtotal += line_total
        
        items_list.append({
            'item': item,
            'quantity': quantity,
            'unit_price': unit_price,
            'line_total': line_total
        })
    
    tax_rate = float(data.get('tax_rate', 0))
    tax_amount = subtotal * (tax_rate / 100)
    total_amount = subtotal + tax_amount
    
    order = Order(
        order_number=order_number,
        buyer_id=data['buyer_id'],
        company_id=company_id,
        order_date=datetime.fromisoformat(data['order_date']) if data.get('order_date') else datetime.utcnow(),
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=data.get('status', 'pending'),
        notes=data.get('notes', '')
    )
    
    db.session.add(order)
    db.session.flush()
    
    for item_data in items_list:
        order_item = OrderItem(
            order_id=order.id,
            item_id=item_data['item'].id,
            quantity=item_data['quantity'],
            unit_price=item_data['unit_price'],
            line_total=item_data['line_total']
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify({'id': order.id, 'order_number': order_number, 'message': 'Order created successfully'}), 201

@bp.route('/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    company_id = verify_company_access()
    order = Order.query.filter_by(id=order_id, company_id=company_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    data = request.get_json()
    # Validate buyer if being updated
    if 'buyer_id' in data:
        buyer = Buyer.query.filter_by(id=int(data['buyer_id']), company_id=company_id).first()
        if not buyer:
            return jsonify({'error': 'Buyer not found'}), 404
    
    # If items are being updated, handle inventory adjustments
    if 'items' in data and data['items']:
        # Store old items BEFORE deleting them - get the items list separately
        old_items_list = list(order.items)
        old_items = {oi.item_id: oi.quantity for oi in old_items_list}
        
        # Delete old order items
        OrderItem.query.filter_by(order_id=order_id).delete()
        db.session.flush()  # Ensure deletion is processed
        
        # Calculate new totals and create new items
        subtotal = 0
        items_list = []
        
        for item_data in data['items']:
            item = Item.query.filter_by(id=int(item_data['item_id']), company_id=company_id).first()
            if not item:
                db.session.rollback()
                return jsonify({'error': f'Item {item_data["item_id"]} not found'}), 404
            
            quantity = float(item_data['quantity'])
            
            # Validate stock availability
            if quantity > item.quantity_in_stock:
                db.session.rollback()
                return jsonify({'error': f'Insufficient stock for {item.name}. Requested: {quantity}, Available: {item.quantity_in_stock}'}), 400
            
            unit_price = item.unit_price
            line_total = quantity * unit_price
            subtotal += line_total
            
            # Adjust inventory: restore old quantity, deduct new quantity
            
            items_list.append({
                'item': item,
                'quantity': quantity,
                'unit_price': unit_price,
                'line_total': line_total
            })
        
        # Restore inventory for items that were removed from order
        for old_item_id, old_qty in old_items.items():
            if not any(int(item_data['item_id']) == old_item_id for item_data in data['items']):
                item = Item.query.filter_by(id=old_item_id, company_id=company_id).first()
                if item:
                    item.quantity_in_stock += old_qty
        
        # Update order totals
        tax_rate = float(data.get('tax_rate', order.tax_rate))
        tax_amount = subtotal * (tax_rate / 100)
        total_amount = subtotal + tax_amount
        
        order.subtotal = subtotal
        order.tax_rate = tax_rate
        order.tax_amount = tax_amount
        order.total_amount = total_amount
        
        # Add new order items
        for item_data in items_list:
            order_item = OrderItem(
                order_id=order.id,
                item_id=item_data['item'].id,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                line_total=item_data['line_total']
            )
            db.session.add(order_item)
    
    # Update other fields
    if 'buyer_id' in data:
        order.buyer_id = int(data['buyer_id'])
    if 'order_date' in data:
        order.order_date = datetime.fromisoformat(data['order_date'])
    if 'status' in data:
        order.status = data['status']
    if 'notes' in data:
        order.notes = data['notes']
    
    order.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': 'Order updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    company_id = verify_company_access()
    order = Order.query.filter_by(id=order_id, company_id=company_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Order deleted successfully and inventory restored'}), 200
    
    return jsonify({'message': 'Order deleted successfully'}), 200
