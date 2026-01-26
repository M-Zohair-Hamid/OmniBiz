from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

# Global variable to track current database
_current_db = 'umarsons'

def switch_database(app, company_code):
    """Switch the active database based on company code"""
    global _current_db
    
    if company_code == 'umarsons':
        bind_key = 'umarsons'
    elif company_code == 'makkah_packages':
        bind_key = 'makkah_packages'
    else:
        bind_key = 'umarsons'
    
    _current_db = bind_key
    
    # Set the default database URI to the selected bind
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_BINDS'][bind_key]
    
    # Force new connection
    try:
        db.session.remove()
        db.session.close()
        db.engine.dispose()
    except:
        pass
    
    return company_code

def get_current_bind():
    """Get the current database bind key"""
    return _current_db

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

def init_db(company_code='umarsons'):
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
    
    # Create company based on company_code
    if company_code == 'umarsons':
        company = Company(
            id=1,
            name='UmarSons',
            code='PC',
            background_image='imgs/1.jpg',
            address='Industrial Area, Faisalabad, Pakistan',
            phone='+92-321-1234567',
            email='info@umarsons.com',
            gst_number='GST-PC-2024-001',
            ntn_number='NTN-PC-2024-001'
        )
    else:  # makkah_packages
        company = Company(
            id=2,
            name='Makkah Packages',
            code='QP',
            background_image='imgs/2.jpg',
            address='Textile City, Faisalabad, Pakistan',
            phone='+92-333-7654321',
            email='contact@makkahpackages.com',
            gst_number='GST-QP-2024-002',
            ntn_number='NTN-QP-2024-002'
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
    if company_code == 'umarsons':
        buyers = [
            Buyer(
                company_name='Al-Abbas Textile Mills',
                contact_person='Ahmed Khan',
                email='ahmed@alabbas.com',
                phone='042-1234567',
                address='123 Textile Lane, Lahore',
                city='Lahore',
                gst_number='GST-BUYER-001',
                ntn_number='NTN-BUYER-001',
                company_id=company.id
            ),
            Buyer(
                company_name='Crescent Textiles Ltd',
                contact_person='Hassan Ali',
                email='hassan@crescent.com',
                phone='042-7654321',
                address='456 Mill Road, Lahore',
                city='Lahore',
                gst_number='GST-BUYER-002',
                ntn_number='NTN-BUYER-002',
                company_id=company.id
            )
        ]
        items = [
            Item(
                code='PC-1000',
                name='Cardboard Cone - Small',
                description='Premium quality cardboard cones for small yarn spools',
                unit='PCS',
                unit_price=15.50,
                quantity_in_stock=5000,
                company_id=company.id
            ),
            Item(
                code='PC-1001',
                name='Cardboard Cone - Medium',
                description='Premium quality cardboard cones for medium yarn spools',
                unit='PCS',
                unit_price=22.00,
                quantity_in_stock=3000,
                company_id=company.id
            ),
            Item(
                code='PC-1002',
                name='Cardboard Cone - Large',
                description='Premium quality cardboard cones for large yarn spools',
                unit='PCS',
                unit_price=28.00,
                quantity_in_stock=2000,
                company_id=company.id
            )
        ]
    else:  # makkah_packages
        buyers = [
            Buyer(
                company_name='Royal Textile Industries',
                contact_person='Zain Malik',
                email='zain@royal.com',
                phone='042-9876543',
                address='789 Industrial Area, Karachi',
                city='Karachi',
                gst_number='GST-BUYER-003',
                ntn_number='NTN-BUYER-003',
                company_id=company.id
            ),
            Buyer(
                company_name='Elite Fabric Solutions',
                contact_person='Sara Ahmed',
                email='sara@elite.com',
                phone='042-1112223',
                address='321 Export Zone, Karachi',
                city='Karachi',
                gst_number='GST-BUYER-004',
                ntn_number='NTN-BUYER-004',
                company_id=company.id
            )
        ]
        items = [
            Item(
                code='QP-1000',
                name='Paper Cone - Large',
                description='High-quality paper cones for large yarn spools',
                unit='PCS',
                unit_price=28.00,
                quantity_in_stock=4000,
                company_id=company.id
            ),
            Item(
                code='QP-1001',
                name='Paper Cone - Extra Large',
                description='Industrial grade paper cones for extra large spools',
                unit='PCS',
                unit_price=35.00,
                quantity_in_stock=2500,
                company_id=company.id
            ),
            Item(
                code='QP-1002',
                name='Paper Cone - Jumbo',
                description='Heavy duty paper cones for jumbo spools',
                unit='PCS',
                unit_price=42.00,
                quantity_in_stock=1500,
                company_id=company.id
            )
        ]
    
    for buyer in buyers:
        db.session.add(buyer)
    
    for item in items:
        db.session.add(item)
    
    db.session.commit()
    
    print(f"OK: Database initialized successfully for {company.name} ({company_code})")
