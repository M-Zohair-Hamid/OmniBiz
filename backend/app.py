from flask import Flask, jsonify, g, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt
from datetime import timedelta, datetime
import os
import sqlite3
from dotenv import load_dotenv
from sqlalchemy import text

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
CORS(app, 
     resources={r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Company-Code", "X-Company-Id"],
        "expose_headers": ["Content-Type", "X-Company-Code", "X-Company-Id"],
        "supports_credentials": True,
        "max_age": 3600
     }},
     intercept_exceptions=True)
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
    db.metadata.create_all(bind=db.get_engine(bind=company_code))
    init_db(company_code)
    ensure_payment_balance_column(company_code)
    ensure_order_income_tax_columns(company_code)
    print(f"[DB] {company_code} ready at {db_path}")

def ensure_payment_balance_column(company_code: str):
    """Ensure payments columns exist for legacy databases."""
    try:
        engine = db.get_engine(bind=company_code)
        with engine.connect() as connection:
            table_exists = connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='payments'")
            ).fetchone()
            if not table_exists:
                db.metadata.create_all(bind=db.get_engine(bind=company_code))
                return

            result = connection.execute(text("PRAGMA table_info(payments)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'balance' not in columns:
                connection.execute(text("ALTER TABLE payments ADD COLUMN balance FLOAT NOT NULL DEFAULT 0"))
                print(f"[DB] Added payments.balance column for {company_code}")
            if 'order_id' not in columns:
                connection.execute(text("ALTER TABLE payments ADD COLUMN order_id INTEGER"))
                print(f"[DB] Added payments.order_id column for {company_code}")
            if 'income_tax_rate' not in columns:
                connection.execute(text("ALTER TABLE payments ADD COLUMN income_tax_rate FLOAT NOT NULL DEFAULT 0"))
                print(f"[DB] Added payments.income_tax_rate column for {company_code}")
            if 'income_tax_amount' not in columns:
                connection.execute(text("ALTER TABLE payments ADD COLUMN income_tax_amount FLOAT NOT NULL DEFAULT 0"))
                print(f"[DB] Added payments.income_tax_amount column for {company_code}")
            
            connection.commit()
    except Exception as exc:
        print(f"[DB] Failed to ensure payments columns for {company_code}: {exc}")

def ensure_order_income_tax_columns(company_code: str):
    """Ensure orders.income_tax_rate and income_tax_amount columns exist."""
    try:
        engine = db.get_engine(bind=company_code)
        with engine.connect() as connection:
            result = connection.execute(text("PRAGMA table_info(orders)"))
            columns = [row[1] for row in result.fetchall()]
            if 'income_tax_rate' not in columns:
                connection.execute(text("ALTER TABLE orders ADD COLUMN income_tax_rate FLOAT NOT NULL DEFAULT 0"))
                print(f"[DB] Added orders.income_tax_rate column for {company_code}")
            if 'income_tax_amount' not in columns:
                connection.execute(text("ALTER TABLE orders ADD COLUMN income_tax_amount FLOAT NOT NULL DEFAULT 0"))
                print(f"[DB] Added orders.income_tax_amount column for {company_code}")
            connection.commit()
    except Exception as exc:
        print(f"[DB] Failed to ensure order income tax columns for {company_code}: {exc}")

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
        elif 'mock-token-MP' in auth_header or 'mock-token-QP' in auth_header:
            company_code = 'makkah_packages'

    # Allow explicit company override header from frontend
    if not company_code:
        header_code = request.headers.get('X-Company-Code', '').upper()
        if header_code in ['PC', 'UMARSONS']:
            company_code = 'umarsons'
        elif header_code in ['QP', 'MP', 'MAKKAH_PACKAGES', 'MAKKAH']:
            company_code = 'makkah_packages'
    
    # Default to umarsons if no company specified
    if not company_code:
        company_code = 'umarsons'
    
    # Switch database
    print(f"[BEFORE_REQUEST] Path: {request.path}, Company: {company_code}")
    switch_database(app, company_code)
    g.company_code = company_code

@app.after_request
def after_request(response):
    """Ensure CORS headers are present on all responses"""
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Company-Code, X-Company-Id'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, X-Company-Code, X-Company-Id'
    return response

# Register blueprints
from routes import auth_bp, buyer_bp, item_bp, order_bp, report_bp, dashboard_bp, ledger_bp, payment_bp, backup_bp

app.register_blueprint(auth_bp.bp)
app.register_blueprint(buyer_bp.bp)
app.register_blueprint(item_bp.bp)
app.register_blueprint(order_bp.bp)
app.register_blueprint(report_bp.bp)
app.register_blueprint(dashboard_bp.bp)
app.register_blueprint(ledger_bp.bp)
app.register_blueprint(payment_bp.bp)
app.register_blueprint(backup_bp.bp)

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
    
    # Auto-backup check on startup
    try:
        from routes import backup_bp
        backup_config = backup_bp.get_backup_config()
        if backup_config.get('auto_backup_enabled', False):
            last_backup = backup_config.get('last_backup_time')
            backup_location = backup_config.get('backup_location')
            
            # Check if we need to backup (more than 24 hours since last backup)
            should_backup = False
            if last_backup:
                last_backup_dt = datetime.fromisoformat(last_backup)
                time_diff = datetime.now() - last_backup_dt
                should_backup = time_diff.total_seconds() > 86400  # 24 hours
            else:
                should_backup = True  # Never backed up before
            
            if should_backup and backup_location:
                try:
                    result = backup_bp.create_backup(backup_location, overwrite=True, scope='both')
                    if result:
                        print(f"[AUTO-BACKUP] Successfully created backup: {result}")
                    else:
                        print("[AUTO-BACKUP] Failed to create backup")
                except Exception as e:
                    print(f"[AUTO-BACKUP] Error creating backup: {e}")
            elif should_backup and not backup_location:
                print("[AUTO-BACKUP] Auto-backup enabled but no backup location configured")
    except Exception as e:
        print(f"[AUTO-BACKUP] Error checking backup configuration: {e}")

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
