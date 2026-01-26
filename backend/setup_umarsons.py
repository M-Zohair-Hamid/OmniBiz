"""
Setup UmarSons Database
Properly initializes UmarSons database with only UmarSons data
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db, Company, User, Buyer, Item
from werkzeug.security import generate_password_hash
import os

# Create minimal Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///umarsons.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def setup_umarsons():
    """Setup UmarSons database from scratch"""
    with app.app_context():
        print("Creating UmarSons database...")
        
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        # Create company
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
        db.session.add(company)
        db.session.commit()
        
        # Create admin user
        user = User(
            employee_id='EMP001',
            username='admin1',
            password=generate_password_hash('admin123'),
            full_name='Admin User - UmarSons',
            email='admin@pc.com',
            role='admin',
            company_id=1
        )
        db.session.add(user)
        db.session.commit()
        
        # Create buyers
        buyers = [
            Buyer(
                name='Al-Abbas Textiles',
                company_name='Al-Abbas Textile Mills',
                contact_person='Ahmed Khan',
                email='ahmed@alabbas.com',
                phone='042-1234567',
                address='123 Textile Lane, Lahore',
                city='Lahore',
                gst_number='GST-BUYER-001',
                ntn_number='NTN-BUYER-001',
                credit_limit=500000,
                company_id=1
            ),
            Buyer(
                name='Crescent Fabrics',
                company_name='Crescent Textiles Ltd',
                contact_person='Hassan Ali',
                email='hassan@crescent.com',
                phone='042-7654321',
                address='456 Mill Road, Lahore',
                city='Lahore',
                gst_number='GST-BUYER-002',
                ntn_number='NTN-BUYER-002',
                credit_limit=300000,
                company_id=1
            ),
            Buyer(
                name='Sunrays Textile Mills Ltd',
                company_name='Sunrays Textiles',
                contact_person='Bilal Ahmed',
                email='bilal@sunrays.com',
                phone='021-3456789',
                address='Manufacturing Zone, Karachi',
                city='Karachi',
                gst_number='GST-BUYER-003',
                ntn_number='NTN-BUYER-003',
                credit_limit=600000,
                company_id=1
            )
        ]
        
        for buyer in buyers:
            db.session.add(buyer)
        db.session.commit()
        
        # Create items
        items = [
            Item(
                code='PC-001',
                name='Cardboard Cone - Small',
                description='Premium quality cardboard cones for small yarn spools',
                unit='PCS',
                unit_price=15.50,
                quantity_in_stock=5000,
                company_id=1
            ),
            Item(
                code='PC-002',
                name='Cardboard Cone - Medium',
                description='Premium quality cardboard cones for medium yarn spools',
                unit='PCS',
                unit_price=22.00,
                quantity_in_stock=3000,
                company_id=1
            ),
            Item(
                code='PC-003',
                name='Cardboard Cone - Large',
                description='Premium quality cardboard cones for large yarn spools',
                unit='PCS',
                unit_price=28.00,
                quantity_in_stock=2000,
                company_id=1
            ),
            Item(
                code='HS-CODE-4822',
                name='Red + White Paper Cheese',
                description='High-quality paper cheese for textile applications',
                unit='PCS',
                unit_price=10.50,
                quantity_in_stock=8000,
                company_id=1
            )
        ]
        
        for item in items:
            db.session.add(item)
        db.session.commit()
        
        print("OK: UmarSons database created successfully!")
        print(f"  - Company: {company.name}")
        print(f"  - Buyers: {len(buyers)}")
        print(f"  - Items: {len(items)}")

if __name__ == '__main__':
    setup_umarsons()
