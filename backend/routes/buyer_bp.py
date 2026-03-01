from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Buyer, User
from utils import get_company_id_from_token, format_date_display
from datetime import datetime

bp = Blueprint('buyers', __name__, url_prefix='/api/buyers')

def get_session():
    """Get the session bound to current company's database"""
    company_code = getattr(g, 'company_code', 'company')
    engine = db.get_engine(bind=company_code)
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    return Session()

def verify_company_access():
    """Verify user has access to the company"""
    return get_company_id_from_token()

@bp.route('', methods=['GET'])
def get_buyers():
    session = get_session()
    company_id = verify_company_access()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)
    
    query = session.query(Buyer).filter_by(company_id=company_id)
    
    if search:
        query = query.filter(
            (Buyer.company_name.ilike(f'%{search}%')) |
            (Buyer.email.ilike(f'%{search}%')) |
            (Buyer.gst_number.ilike(f'%{search}%'))
        )
    
    # Get total count before pagination
    total = query.count()
    if total == 0:
        fallback_query = session.query(Buyer)
        if search:
            fallback_query = fallback_query.filter(
                (Buyer.company_name.ilike(f'%{search}%')) |
                (Buyer.email.ilike(f'%{search}%')) |
                (Buyer.gst_number.ilike(f'%{search}%'))
            )
        fallback_total = fallback_query.count()
        if fallback_total > 0:
            query = fallback_query
            total = fallback_total
    
    # Apply ordering and pagination using offset/limit
    offset = (page - 1) * per_page
    items = query.order_by(Buyer.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    return jsonify({
        'data': [{
            'id': b.id,
            'company_name': b.company_name,
            'gst_number': b.gst_number,
            'ntn_number': b.ntn_number,
            'address': b.address,
            'contact_person': b.contact_person,
            'email': b.email,
            'phone': b.phone,
            'city': b.city,
            'is_active': b.is_active,
            'created_at': format_date_display(b.created_at)
        } for b in items],
        'total': total,
        'pages': pages,
        'current_page': page
    }), 200

@bp.route('/<int:buyer_id>', methods=['GET'])
def get_buyer(buyer_id):
    session = get_session()
    company_id = verify_company_access()
    buyer = session.query(Buyer).filter_by(id=buyer_id, company_id=company_id).first()
    
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    return jsonify({
        'id': buyer.id,
        'company_name': buyer.company_name,
        'gst_number': buyer.gst_number,
        'ntn_number': buyer.ntn_number,
        'address': buyer.address,
        'contact_person': buyer.contact_person,
        'email': buyer.email,
        'phone': buyer.phone,
        'city': buyer.city,
        'is_active': buyer.is_active,
        'created_at': format_date_display(buyer.created_at),
        'updated_at': format_date_display(buyer.updated_at)
    }), 200

@bp.route('', methods=['POST'])
def create_buyer():
    session = get_session()
    company_id = verify_company_access()
    data = request.get_json()
    
    if not data.get('company_name') or not data.get('gst_number') or not data.get('ntn_number') or not data.get('address'):
        return jsonify({'error': 'Missing required fields: company_name, gst_number, ntn_number, address'}), 400
    
    try:
        buyer = Buyer(
            company_name=data['company_name'],
            gst_number=data['gst_number'],
            ntn_number=data['ntn_number'],
            address=data['address'],
            contact_person=data.get('contact_person', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            city=data.get('city', ''),
            company_id=company_id
        )
        
        session.add(buyer)
        session.commit()
        
        return jsonify({'id': buyer.id, 'message': 'Buyer created successfully'}), 201
    except Exception as e:
        session.rollback()
        error_str = str(e)
        if 'company_name' in error_str or 'UNIQUE constraint failed' in error_str:
            if 'company_name' in error_str:
                return jsonify({'error': 'Company name already exists in database'}), 409
            elif 'gst_number' in error_str:
                return jsonify({'error': 'GST number already exists in database'}), 409
            elif 'ntn_number' in error_str:
                return jsonify({'error': 'NTN number already exists in database'}), 409
        print(f"Error creating buyer: {error_str}")
        return jsonify({'error': f'Failed to create buyer: {error_str}'}), 500

@bp.route('/<int:buyer_id>', methods=['PUT'])
def update_buyer(buyer_id):
    session = get_session()
    company_id = verify_company_access()
    buyer = session.query(Buyer).filter_by(id=buyer_id, company_id=company_id).first()
    
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    data = request.get_json()
    
    try:
        buyer.company_name = data.get('company_name', buyer.company_name)
        buyer.gst_number = data.get('gst_number', buyer.gst_number)
        buyer.ntn_number = data.get('ntn_number', buyer.ntn_number)
        buyer.address = data.get('address', buyer.address)
        buyer.contact_person = data.get('contact_person', buyer.contact_person)
        buyer.email = data.get('email', buyer.email)
        buyer.phone = data.get('phone', buyer.phone)
        buyer.city = data.get('city', buyer.city)
        buyer.is_active = data.get('is_active', buyer.is_active)
        buyer.updated_at = datetime.utcnow()
        
        session.commit()
        return jsonify({'message': 'Buyer updated successfully'}), 200
    except Exception as e:
        session.rollback()
        error_str = str(e)
        if 'company_name' in error_str:
            return jsonify({'error': 'Company name already exists in database'}), 409
        elif 'gst_number' in error_str:
            return jsonify({'error': 'GST number already exists in database'}), 409
        elif 'ntn_number' in error_str:
            return jsonify({'error': 'NTN number already exists in database'}), 409
        print(f"Error updating buyer: {error_str}")
        return jsonify({'error': f'Failed to update buyer: {error_str}'}), 500

@bp.route('/<int:buyer_id>', methods=['DELETE'])
def delete_buyer(buyer_id):
    session = get_session()
    company_id = verify_company_access()
    buyer = session.query(Buyer).filter_by(id=buyer_id, company_id=company_id).first()
    
    if not buyer:
        return jsonify({'error': 'Buyer not found'}), 404
    
    session.delete(buyer)
    session.commit()
    
    return jsonify({'message': 'Buyer deleted successfully'}), 200
