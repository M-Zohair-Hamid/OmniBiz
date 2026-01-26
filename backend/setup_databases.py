"""
Setup Databases Script
Properly initializes Makkah Packages database
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db, Company, User, Buyer, Item
from werkzeug.security import generate_password_hash
import os

# Create minimal Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///makkah_packages.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def setup_makkah_packages():
    """Setup Makkah Packages database from scratch"""
    with app.app_context():
        print("Creating Makkah Packages database...")
        
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        # Create company
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
        user = User(
            employee_id='EMP002',
            username='admin2',
            password=generate_password_hash('admin123'),
            full_name='Admin User - Makkah Packages',
            email='admin@qp.com',
            role='admin',
            company_id=2
        )
        db.session.add(user)
        db.session.commit()
        
        # Create buyers
        buyers = [
            Buyer(
                name='Royal Textiles',
                company_name='Royal Textile Industries',
                contact_person='Zain Malik',
                email='zain@royal.com',
                phone='042-9876543',
                address='789 Industrial Area, Karachi',
                city='Karachi',
                gst_number='GST-BUYER-003',
                ntn_number='NTN-BUYER-003',
                credit_limit=450000,
                company_id=2
            ),
            Buyer(
                name='Elite Fabrics',
                company_name='Elite Fabric Solutions',
                contact_person='Sara Ahmed',
                email='sara@elite.com',
                phone='042-1112223',
                address='321 Export Zone, Karachi',
                city='Karachi',
                gst_number='GST-BUYER-004',
                ntn_number='NTN-BUYER-004',
                credit_limit=350000,
                company_id=2
            )
        ]
        
        for buyer in buyers:
            db.session.add(buyer)
        db.session.commit()
        
        # Create items
        items = [
            Item(
                code='QPP-001',
                name='Paper Cone - Large',
                description='High-quality paper cones for large yarn spools',
                unit='PCS',
                unit_price=28.00,
                quantity_in_stock=4000,
                company_id=2
            ),
            Item(
                code='QPP-002',
                name='Paper Cone - Extra Large',
                description='Industrial grade paper cones for extra large spools',
                unit='PCS',
                unit_price=35.00,
                quantity_in_stock=2500,
                company_id=2
            ),
            Item(
                code='QPP-003',
                name='Paper Cone - Jumbo',
                description='Heavy duty paper cones for jumbo spools',
                unit='PCS',
                unit_price=42.00,
                quantity_in_stock=1500,
                company_id=2
            )
        ]
        
        for item in items:
            db.session.add(item)
        db.session.commit()
        
        print("OK: Makkah Packages database created successfully!")
        print(f"  - Company: {company.name}")
        print(f"  - Buyers: {len(buyers)}")
        print(f"  - Items: {len(items)}")

if __name__ == '__main__':
    setup_makkah_packages()
