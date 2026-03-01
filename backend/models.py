from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

# Global variable to track current database
_current_db = 'company'

def switch_database(app, company_code):
    """Switch to use company database via SQLAlchemy binds"""
    global _current_db
    
    bind_key = 'company'  # Always use the company database
    
    _current_db = bind_key

    # Point the active session to the selected bind so model queries use correct DB
    try:
        db.session.bind = db.engines[bind_key]
    except Exception:
        pass
    
    # Remove current session and connections
    try:
        db.session.remove()
        db.session.close()
    except:
        pass
    
    # Dispose of all connections to force reconnect to the right database
    try:
        if hasattr(db, 'engines') and bind_key in db.engines:
            db.engines[bind_key].dispose()
        elif hasattr(db, 'engine'):
            db.engine.dispose()
    except:
        pass
    
    # Store the current bind in app context
    app.config['SQLALCHEMY_CURRENT_BIND'] = bind_key
    
    return company_code

def get_current_bind():
    """Get the current database bind key"""
    return _current_db

def get_db_for_company(company_code):
    """Get database engine for the company"""
    return db.engines['company']

def get_current_db():
    """Get current database engine based on _current_db"""
    return db.engines[_current_db]

# ========== COMPANY MODEL ==========
class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)
    background_image = db.Column(db.String(255))
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    gst_number = db.Column(db.String(50))
    ntn_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    users = db.relationship('User', backref='company', lazy=True, cascade='all, delete-orphan')
    buyers = db.relationship('Buyer', backref='company', lazy=True, cascade='all, delete-orphan')
    items = db.relationship('Item', backref='company', lazy=True, cascade='all, delete-orphan')
    orders = db.relationship('Order', backref='company', lazy=True, cascade='all, delete-orphan')

# ========== BUSINESS SETTINGS MODEL ==========
class BusinessSettings(db.Model):
    __tablename__ = 'business_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, unique=True)
    business_name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    whatsapp = db.Column(db.String(50))
    logo_filename = db.Column(db.String(255))  # Stores the filename of uploaded logo
    logo_placement = db.Column(db.String(20), default='both')  # 'watermark', 'side', 'both'
    logo_as_watermark = db.Column(db.Boolean, default=True)  # Whether to show logo as watermark
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = db.relationship('Company', backref=db.backref('settings', uselist=False))

# ========== USER MODEL ==========
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100))
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(50), default='user')  # admin, user
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ========== BUYER MODEL ==========
class Buyer(db.Model):
    __tablename__ = 'buyers'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(100), nullable=False, unique=True)
    gst_number = db.Column(db.String(50), nullable=False, unique=True)
    ntn_number = db.Column(db.String(50), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    city = db.Column(db.String(50))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = db.relationship('Order', backref='buyer', lazy=True, cascade='all, delete-orphan')

# ========== ITEM MODEL ==========
class Item(db.Model):
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    unit = db.Column(db.String(20), default='PCS')  # PCS, KG, etc.
    unit_price = db.Column(db.Float, nullable=False)
    quantity_in_stock = db.Column(db.Float, default=0)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order_items = db.relationship('OrderItem', backref='item', lazy=True, cascade='all, delete-orphan')

# ========== ORDER MODEL ==========
class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('buyers.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    subtotal = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    income_tax_rate = db.Column(db.Float, default=0)  # New: Income tax rate for the order
    income_tax_amount = db.Column(db.Float, default=0)  # New: Income tax amount for the order
    total_amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, shipped, delivered
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

# ========== ORDER ITEM MODEL ==========
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    line_total = db.Column(db.Float, nullable=False)

# ========== PAYMENT MODEL ==========
class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, nullable=False, default=0)  # Remaining balance after this payment
    payment_method = db.Column(db.String(50), nullable=False)  # cash, card, bank_transfer, cheque
    payment_type = db.Column(db.String(20), nullable=False)  # partial, full
    notes = db.Column(db.Text)
    income_tax_rate = db.Column(db.Float, default=0)  # Income tax rate percentage (e.g., 1.5 for 1.5%)
    income_tax_amount = db.Column(db.Float, default=0)  # New: Income tax for this payment (not added to payment amount)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    order = db.relationship('Order', backref='payments', lazy=True)

def init_db(company_code='company'):
    """Initialize database with sample data for specific company"""
    # Check if data already exists
    try:
        existing_company = Company.query.first()
        if existing_company:
            print(f"Database for {company_code} already initialized")
            return
    except:
        # Table doesn't exist yet, proceed with initialization
        pass
    
    # Create company
    company = Company(
        id=1,
        name='Business Company',
        code='ORG',
        background_image='imgs/1.jpg',
        address='Business District, City, Country',
        phone='+1-800-0000000',
        email='support@company.local',
        gst_number='GST-ORG-2024-001',
        ntn_number='TAX-ORG-2024-001'
    )
    
    db.session.add(company)
    db.session.commit()
    
    # Create admin user
    from werkzeug.security import generate_password_hash
    
    user = User(
        employee_id=f'EMP00{company.id}',
        username=f'admin{company.id}',
        password=generate_password_hash('admin123'),
        full_name=f'Admin User - {company.name}',
        email=f'admin@{company.code.lower()}.com',
        role='admin',
        company_id=company.id
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Create sample buyers
    buyers = [
        Buyer(
            company_name='Sample Client A',
            contact_person='John Smith',
            email='contact@clienta.local',
            phone='+1-800-1111111',
            address='123 Business Avenue, City',
            city='City',
            gst_number='GST-BUYER-001',
            ntn_number='TAX-BUYER-001',
            company_id=company.id
        ),
        Buyer(
            company_name='Sample Client B',
            contact_person='Jane Doe',
            email='contact@clientb.local',
            phone='+1-800-2222222',
            address='456 Commerce Street, City',
            city='City',
            gst_number='GST-BUYER-002',
            ntn_number='TAX-BUYER-002',
            company_id=company.id
        )
    ]
    items = [
        Item(
            code='ITEM-001',
            name='Product - Standard',
            description='Standard quality product',
            unit='PCS',
            unit_price=15.50,
            quantity_in_stock=5000,
            company_id=company.id
        ),
        Item(
            code='ITEM-002',
            name='Product - Premium',
            description='Premium quality product',
            unit='PCS',
            unit_price=22.00,
            quantity_in_stock=3000,
            company_id=company.id
        ),
        Item(
            code='ITEM-003',
            name='Product - Deluxe',
            description='Deluxe quality product',
            unit='PCS',
            unit_price=28.00,
            quantity_in_stock=2000,
            company_id=company.id
        )
    ]
    
    for buyer in buyers:
        db.session.add(buyer)
    
    for item in items:
        db.session.add(item)
    
    db.session.commit()
    
    print(f"OK: Database initialized successfully for {company.name} ({company_code})")
