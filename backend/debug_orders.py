from models import db, Order
from app import app

with app.app_context():
    orders = Order.query.order_by(Order.id.desc()).limit(5).all()
    print("\n=== Recent Orders ===")
    for o in orders:
        print(f"ID: {o.id}, Buyer ID: {o.buyer_id}, Order#: {o.order_number}")
    
    print("\n=== Al-Abbas Orders ===")
    # Check buyer_id for Al-Abbas
    from models import Buyer
    al_abbas = Buyer.query.filter_by(company_name='Al-Abbas Textile Mills').first()
    if al_abbas:
        print(f"Al-Abbas Buyer ID: {al_abbas.id}")
        al_abbas_orders = Order.query.filter_by(buyer_id=al_abbas.id).order_by(Order.id.desc()).all()
        print(f"Al-Abbas Order Count: {len(al_abbas_orders)}")
        for o in al_abbas_orders:
            print(f"  - {o.order_number}")
    else:
        print("Al-Abbas not found")
