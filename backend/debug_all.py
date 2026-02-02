from models import db, Buyer, Order
from app import app

with app.app_context():
    print("\n=== All Buyers ===")
    buyers = Buyer.query.all()
    for b in buyers:
        print(f"ID: {b.id}, Name: {b.company_name}")
    
    print("\n=== All Orders ===")
    orders = Order.query.all()
    for o in orders:
        print(f"ID: {o.id}, Buyer ID: {o.buyer_id}, Order#: {o.order_number}")
