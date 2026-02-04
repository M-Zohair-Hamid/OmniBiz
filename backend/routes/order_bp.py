from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Order, OrderItem, Item, Buyer, Payment
from utils import get_company_id_from_token, format_date_display
from datetime import datetime
from sqlalchemy import func
import random
import string

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def get_session():
    """Get the session bound to current company's database"""
    company_code = getattr(g, 'company_code', 'umarsons')
    # Use db.get_engine with the correct bind
    engine = db.get_engine(bind=company_code)
    # Create a new session with this engine
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    return Session()

def generate_order_number(buyer_id, buyer_name, order_date):
    """Generate unique order number: BuyerName_YYYY-MM-DD_ID1000
    Auto ID starts from 1000 and increments globally per buyer across all dates"""
    date_str = order_date.strftime('%Y-%m-%d')
    
    # Query ALL orders for this buyer (regardless of date)
    session = get_session()
    existing_orders = session.query(Order).filter(
        Order.buyer_id == buyer_id
    ).all()
    
    print(f"\n[DEBUG] Generating order for buyer_id={buyer_id}, buyer_name={buyer_name}")
    print(f"[DEBUG] Found {len(existing_orders)} existing orders for this buyer")
    
    # Extract max number from all orders for this buyer
    max_num = 999
    for order in existing_orders:
        try:
            # Format: BuyerName_YYYY-MM-DD_ID1000, BuyerName_YYYY-MM-DD_ID1001, etc
            id_part = order.order_number.split('_ID')[-1]
            num = int(id_part)
            print(f"[DEBUG] Found order number: {order.order_number}, ID part: {id_part}, num: {num}")
            if num > max_num:
                max_num = num
        except (ValueError, IndexError) as e:
            print(f"[DEBUG] Error parsing {order.order_number}: {e}")
            continue
    
    next_num = max_num + 1
    order_number = f"{buyer_name}_{date_str}_ID{next_num}"
    print(f"[DEBUG] Generated order number: {order_number}")
    return order_number

def calculate_order_status(session, order):
    total_paid = session.query(func.coalesce(func.sum(Payment.amount), 0)).filter_by(order_id=order.id).scalar() or 0
    remaining = round(order.total_amount - total_paid, 2)
    if total_paid <= 0:
        return 'pending'
    if remaining <= 0:
        return 'paid'
    return 'partial'

@bp.route('', methods=['GET'])
def get_orders():
    session = get_session()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '', type=str)
    
    query = session.query(Order)
    
    if status:
        query = query.filter_by(status=status)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply ordering and pagination using offset/limit
    offset = (page - 1) * per_page
    items = query.order_by(Order.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    status_updated = False
    data = []
    for o in items:
        computed_status = calculate_order_status(session, o)
        if o.status != computed_status:
            o.status = computed_status
            status_updated = True
        data.append({
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
        })

    if status_updated:
        session.commit()

    return jsonify({
        'data': data,
        'total': total,
        'pages': pages,
        'current_page': page
    }), 200

@bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    session = get_session()
    order = session.query(Order).filter_by(id=order_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    computed_status = calculate_order_status(session, order)
    if order.status != computed_status:
        order.status = computed_status
        session.commit()
    
    return jsonify({
        'id': order.id,
        'order_number': order.order_number,
        'buyer_id': order.buyer_id,
        'buyer_name': order.buyer.company_name,
        'company_name': order.company.name if order.company else 'Unknown',
        'buyer': {
            'id': order.buyer.id,
            'company_name': order.buyer.company_name,
            'city': order.buyer.city,
            'ntn_number': order.buyer.ntn_number,
            'gst_number': order.buyer.gst_number,
            'phone': order.buyer.phone
        },
        'order_date': order.order_date.isoformat(),
        'subtotal': order.subtotal,
        'tax_rate': order.tax_rate,
        'tax_amount': order.tax_amount,
        'total_amount': order.total_amount,
        'status': order.status,
        'notes': order.notes,
        'items': [{
            'id': oi.id,
            'item_id': oi.item_id,
            'name': oi.item.name,
            'item': {
                'code': oi.item.code,
                'name': oi.item.name,
                'unit_price': oi.item.unit_price
            },
            'quantity': oi.quantity,
            'unit_price': oi.unit_price,
            'line_total': oi.line_total
        } for oi in order.items],
        'created_at': format_date_display(order.created_at),
        'updated_at': format_date_display(order.updated_at)
    }), 200

@bp.route('', methods=['POST'])
def create_order():
    session = get_session()
    data = request.get_json()
    
    if not data.get('buyer_id') or not data.get('items'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    buyer = session.query(Buyer).filter_by(id=data['buyer_id']).first()
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    # Get buyer name and generate order number
    order_date = datetime.fromisoformat(data.get('order_date')) if data.get('order_date') else datetime.utcnow()
    order_number = generate_order_number(buyer.id, buyer.company_name, order_date)
    
    # Calculate totals
    subtotal = 0
    items_list = []
    
    for item_data in data['items']:
        item = session.query(Item).filter_by(id=item_data['item_id']).first()
        if not item:
            return jsonify({'error': f'Item {item_data["item_id"]} not found'}), 404
        
        quantity = float(item_data['quantity'])
        
        # Validate stock availability
        if quantity > item.quantity_in_stock:
            return jsonify({'error': f'Insufficient stock for {item.name}. Requested: {quantity}, Available: {item.quantity_in_stock}'}), 400
        
        # Deduct stock immediately when creating order
        item.quantity_in_stock -= quantity
        
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
        company_id=buyer.company_id,
        order_date=datetime.fromisoformat(data['order_date']) if data.get('order_date') else datetime.utcnow(),
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=data.get('status', 'pending'),
        notes=data.get('notes', '')
    )
    
    session.add(order)
    session.flush()
    
    for item_data in items_list:
        order_item = OrderItem(
            order_id=order.id,
            item_id=item_data['item'].id,
            quantity=item_data['quantity'],
            unit_price=item_data['unit_price'],
            line_total=item_data['line_total']
        )
        session.add(order_item)
    
    session.commit()
    
    return jsonify({'id': order.id, 'order_number': order_number, 'message': 'Order created successfully'}), 201

@bp.route('/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    session = get_session()
    order = session.query(Order).filter_by(id=order_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    data = request.get_json()
    # Validate buyer if being updated
    if 'buyer_id' in data:
        buyer = session.query(Buyer).filter_by(id=int(data['buyer_id'])).first()
        if not buyer:
            return jsonify({'error': 'Buyer not found'}), 404
    
    # If items are being updated, handle inventory adjustments
    if 'items' in data and data['items']:
        # Store old items BEFORE deleting them - get the items list separately
        old_items_list = list(order.items)
        old_items = {oi.item_id: oi.quantity for oi in old_items_list}
        print(f"DEBUG: Old items dict: {old_items}")  # Debug
        
        # Delete old order items
        session.query(OrderItem).filter_by(order_id=order_id).delete()
        session.flush()  # Ensure deletion is processed
        
        # Calculate new totals and create new items
        subtotal = 0
        items_list = []
        
        for item_data in data['items']:
            item = session.query(Item).filter_by(id=int(item_data['item_id'])).first()
            if not item:
                session.rollback()
                return jsonify({'error': f'Item {item_data["item_id"]} not found'}), 404
            
            quantity = float(item_data['quantity'])
            old_qty = old_items.get(item.id, 0)
            qty_difference = quantity - old_qty  # Positive = add to order, Negative = reduce from order
            
            print(f"DEBUG: Item {item.name}: old_qty={old_qty}, new_qty={quantity}, difference={qty_difference}, current_stock={item.quantity_in_stock}")  # Debug
            
            # Check if we have enough stock for the additional quantity
            if qty_difference > 0:  # Increasing quantity
                if qty_difference > item.quantity_in_stock:
                    session.rollback()
                    return jsonify({'error': f'Insufficient stock for {item.name}. Need additional: {qty_difference}, Available: {item.quantity_in_stock}'}), 400
                item.quantity_in_stock -= qty_difference
                print(f"DEBUG: Deducted {qty_difference}, new stock: {item.quantity_in_stock}")  # Debug
            elif qty_difference < 0:  # Decreasing quantity
                item.quantity_in_stock += abs(qty_difference)  # Return to stock
                print(f"DEBUG: Returned {abs(qty_difference)}, new stock: {item.quantity_in_stock}")  # Debug
            
            unit_price = item.unit_price
            line_total = quantity * unit_price
            subtotal += line_total
            
            items_list.append({
                'item': item,
                'quantity': quantity,
                'unit_price': unit_price,
                'line_total': line_total
            })
        
        # Handle items that were removed from order (restore their stock)
        for old_item_id, old_qty in old_items.items():
            if not any(int(item_data['item_id']) == old_item_id for item_data in data['items']):
                item = session.query(Item).filter_by(id=old_item_id).first()
                if item:
                    item.quantity_in_stock += old_qty
        
        # Restore inventory for items that were removed from order
        for old_item_id, old_qty in old_items.items():
            if not any(int(item_data['item_id']) == old_item_id for item_data in data['items']):
                item = session.query(Item).filter_by(id=old_item_id).first()
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
            session.add(order_item)
    
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
        session.commit()
        
        # Calculate and update the order status based on payments
        computed_status = calculate_order_status(session, order)
        if order.status != computed_status:
            order.status = computed_status
            session.commit()
        
        # Return the updated order with its data
        return jsonify({
            'message': 'Order updated successfully',
            'order': {
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
                'notes': order.notes
            }
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    session = get_session()
    order = session.query(Order).filter_by(id=order_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Restore stock for all items in the order
    for order_item in order.items:
        item = session.query(Item).filter_by(id=order_item.item_id).first()
        if item:
            item.quantity_in_stock += order_item.quantity
    
    session.delete(order)
    session.commit()
    
    return jsonify({'message': 'Order deleted successfully and stock restored'}), 200
