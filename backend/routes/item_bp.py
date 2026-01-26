from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Item
from utils import get_company_id_from_token, format_date_display
from datetime import datetime

bp = Blueprint('items', __name__, url_prefix='/api/items')

def verify_company_access():
    """Verify user has access to the company"""
    return get_company_id_from_token()

# Helper: compute next auto code (HS-<number>) starting at 1000
AUTO_CODE_PREFIX = 'HS-'
AUTO_CODE_START = 1000

def get_next_item_code(company_id):
    """Get the next auto-incremented item code (HS-1000, HS-1001, etc.)"""
    # Query all items for company and find max HS number
    items = Item.query.filter_by(company_id=company_id).all()
    max_num = AUTO_CODE_START - 1
    
    for item in items:
        code = (item.code or '').strip()
        if code.startswith(AUTO_CODE_PREFIX):
            try:
                num = int(code[len(AUTO_CODE_PREFIX):])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue
    
    next_num = max_num + 1
    return f"{AUTO_CODE_PREFIX}{next_num}"

@bp.route('', methods=['GET'])
def get_items():
    company_id = verify_company_access()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)
    
    query = Item.query.filter_by(company_id=company_id)
    
    if search:
        query = query.filter(
            (Item.name.ilike(f'%{search}%')) |
            (Item.code.ilike(f'%{search}%'))
        )
    
    pagination = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'data': [{
            'id': i.id,
            'code': i.code,
            'name': i.name,
            'description': i.description,
            'unit': i.unit,
            'unit_price': i.unit_price,
            'quantity_in_stock': i.quantity_in_stock,
            'is_active': i.is_active,
            'created_at': format_date_display(i.created_at)
        } for i in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@bp.route('/next-code', methods=['GET'])
def next_code():
    company_id = verify_company_access()
    return jsonify({'next_code': get_next_item_code(company_id)}), 200

@bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    company_id = verify_company_access()
    item = Item.query.filter_by(id=item_id, company_id=company_id).first()
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    return jsonify({
        'id': item.id,
        'code': item.code,
        'name': item.name,
        'description': item.description,
        'unit': item.unit,
        'unit_price': item.unit_price,
        'quantity_in_stock': item.quantity_in_stock,
        'is_active': item.is_active,
        'created_at': format_date_display(item.created_at),
        'updated_at': format_date_display(item.updated_at)
    }), 200

@bp.route('', methods=['POST'])
def create_item():
    company_id = verify_company_access()
    data = request.get_json()
    
    if not data.get('name') or not data.get('unit_price'):
        return jsonify({'error': 'Missing required fields: name, unit_price'}), 400
    
    code = (data.get('code') or '').strip()
    if not code:
        code = get_next_item_code(company_id)
    
    try:
        item = Item(
            code=code,
            name=data['name'],
            description=data.get('description', ''),
            unit=data.get('unit', 'PCS'),
            unit_price=float(data['unit_price']),
            quantity_in_stock=float(data.get('quantity_in_stock', 0)),
            company_id=company_id
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'id': item.id, 'code': item.code, 'message': 'Item created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        error_str = str(e)
        if 'code' in error_str:
            return jsonify({'error': f'Item code "{code}" already exists in database'}), 409
        elif 'name' in error_str:
            return jsonify({'error': f'Item name "{data.get("name")}" already exists in database'}), 409
        print(f"Error creating item: {error_str}")
        return jsonify({'error': f'Failed to create item: {error_str}'}), 500

@bp.route('/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    company_id = verify_company_access()
    item = Item.query.filter_by(id=item_id, company_id=company_id).first()
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    data = request.get_json()
    
    try:
        item.code = data.get('code', item.code)
        item.name = data.get('name', item.name)
        item.description = data.get('description', item.description)
        item.unit = data.get('unit', item.unit)
        item.unit_price = float(data.get('unit_price', item.unit_price))
        item.quantity_in_stock = float(data.get('quantity_in_stock', item.quantity_in_stock))
        item.is_active = data.get('is_active', item.is_active)
        item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Item updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        error_str = str(e)
        if 'code' in error_str:
            return jsonify({'error': f'Item code "{data.get("code", item.code)}" already exists in database'}), 409
        elif 'name' in error_str:
            return jsonify({'error': f'Item name "{data.get("name", item.name)}" already exists in database'}), 409
        print(f"Error updating item: {error_str}")
        return jsonify({'error': f'Failed to update item: {error_str}'}), 500

@bp.route('/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    company_id = verify_company_access()
    item = Item.query.filter_by(id=item_id, company_id=company_id).first()
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Item deleted successfully'}), 200
