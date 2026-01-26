from flask import Flask, jsonify, g, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt
from datetime import timedelta
import os
import sqlite3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Multi-database configuration
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Use simple relative paths - Flask will resolve them to instance folder
app.config['SQLALCHEMY_BINDS'] = {
    'umarsons': 'sqlite:///umarsons.db',
    'makkah_packages': 'sqlite:///makkah_packages.db'
}
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///umarsons.db'  # Default database

# Initialize extensions
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Company-Code", "X-Company-Id"],
        "expose_headers": ["Content-Type", "X-Company-Code", "X-Company-Id"],
        "supports_credentials": True
    }
})
jwt = JWTManager(app)

# Import database and models
from models import db, init_db, switch_database

# Initialize database
db.init_app(app)

def ensure_database(company_code: str):
    """Validate SQLite file; rebuild if corrupted or missing tables."""
    uri = app.config['SQLALCHEMY_BINDS'][company_code]
    db_file = uri.replace('sqlite:///', '', 1)
    db_path = db_file if os.path.isabs(db_file) else os.path.join(app.instance_path, db_file)

    recreate = False
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('PRAGMA integrity_check;')
            result = cur.fetchone()
            if not result or str(result[0]).lower() != 'ok':
                recreate = True
        except Exception as exc:  # Corrupted or unreadable file
            print(f"[DB] Integrity check failed for {company_code}: {exc}")
            recreate = True
        finally:
            try:
                conn.close()
            except Exception:
                pass
    else:
        recreate = True

    if recreate:
        try:
            if os.path.exists(db_path):
                os.remove(db_path)
                print(f"[DB] Removed bad database file: {db_path}")
        except Exception as exc:
            print(f"[DB] Failed to remove {db_path}: {exc}")

    switch_database(app, company_code)
    db.create_all()
    init_db(company_code)
    print(f"[DB] {company_code} ready at {db_path}")

@app.before_request
def before_request():
    """Switch to the correct database before each request"""
    # Skip for health check and static files
    if request.path == '/api/health' or request.path.startswith('/static'):
        return
    
    # Determine company from token or default
    company_code = None
    
    # Try to get from JWT token
    try:
        claims = get_jwt()
        company_id = claims.get('company_id')
        if company_id == 1:
            company_code = 'umarsons'
        elif company_id == 2:
            company_code = 'makkah_packages'
    except:
        pass
    # Try to get from mock token
    if not company_code:
        auth_header = request.headers.get('Authorization', '')
        if 'mock-token-PC' in auth_header:
            company_code = 'umarsons'
        elif 'mock-token-QP' in auth_header:
            company_code = 'makkah_packages'

    # Allow explicit company override header from frontend
    if not company_code:
        header_code = request.headers.get('X-Company-Code', '').upper()
        if header_code in ['PC', 'UMARSONS']:
            company_code = 'umarsons'
        elif header_code in ['QP', 'MAKKAH_PACKAGES']:
            company_code = 'makkah_packages'
    
    # Default to umarsons if no company specified
    if not company_code:
        company_code = 'umarsons'
    
    # Switch database
    print(f"[BEFORE_REQUEST] Path: {request.path}, Switching to database: {company_code}")
    switch_database(app, company_code)
    g.company_code = company_code

# Register blueprints
from routes import auth_bp, buyer_bp, item_bp, order_bp, report_bp, dashboard_bp, ledger_bp

app.register_blueprint(auth_bp.bp)
app.register_blueprint(buyer_bp.bp)
app.register_blueprint(item_bp.bp)
app.register_blueprint(order_bp.bp)
app.register_blueprint(report_bp.bp)
app.register_blueprint(dashboard_bp.bp)
app.register_blueprint(ledger_bp.bp)

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    # Triggered when the Authorization header is present but the token is malformed/invalid
    print(f"[JWT] Invalid token: {error}")
    return jsonify({'error': 'Invalid or malformed token', 'detail': error}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    # Triggered when the Authorization header is missing or badly formatted
    print(f"[JWT] Missing/invalid auth header: {error}")
    return jsonify({'error': 'Missing or invalid authorization header', 'detail': error}), 401

# Create tables for both databases on startup
with app.app_context():
    ensure_database('umarsons')
    ensure_database('makkah_packages')
    print("Both company databases initialized successfully")

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
