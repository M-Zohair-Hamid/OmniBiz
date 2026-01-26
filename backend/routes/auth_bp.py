from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Company

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password') or not data.get('company_id'):
        return jsonify({'error': 'Missing credentials'}), 400
    
    user = User.query.filter_by(
        username=data['username'],
        company_id=int(data['company_id']),
        is_active=True
    ).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # JWT spec expects subject (identity) as a string; cast to string to avoid "Subject must be a string" errors
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'company_id': user.company_id, 'role': user.role}
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role,
            'company_id': user.company_id,
            'company_name': user.company.name
        }
    }), 200

@bp.route('/companies', methods=['GET'])
def get_companies():
    """Get list of available companies (hardcoded since each has separate DB)"""
    companies = [
        {
            'id': 1,
            'name': 'UmarSons',
            'code': 'PC',
            'background_image': 'imgs/1.jpg'
        },
        {
            'id': 2,
            'name': 'Makkah Packages',
            'code': 'QP',
            'background_image': 'imgs/2.jpg'
        }
    ]
    return jsonify(companies), 200

@bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    # Debug logging for token validation
    auth_header = request.headers.get('Authorization', '')
    print(f"[verify-token] Authorization header: {auth_header[:80]}...")

    user_id = get_jwt_identity()
    claims = get_jwt()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'company_id': claims.get('company_id'),
            'role': claims.get('role'),
            'company_name': user.company.name
        }
    }), 200
