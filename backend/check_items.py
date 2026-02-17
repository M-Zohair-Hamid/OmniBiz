"""
Check items in both databases
"""
from sqlalchemy.orm import sessionmaker
from app import app
from models import db, Item, Company

def check_items():
    with app.app_context():
        for bind_key, company_label in [("umarsons", "UmarSons"), ("makkah_packages", "Makkah Packages")]:
            engine = db.engines[bind_key]
            Session = sessionmaker(bind=engine)
            session = Session()
            
            try:
                company = session.query(Company).first()
                items = session.query(Item).all()
                
                print(f"\n{'='*60}")
                print(f"Company: {company.name} ({bind_key})")
                print(f"Total Items: {len(items)}")
                print(f"{'='*60}")
                
                if items:
                    print(f"First 5 items:")
                    for i, item in enumerate(items[:5], 1):
                        print(f"  {i}. {item.code} | {item.name} | ₨{item.unit_price}")
                    
                    if len(items) > 5:
                        print(f"\n  ... and {len(items) - 5} more items")
                        print(f"\nLast 5 items:")
                        for i, item in enumerate(items[-5:], len(items)-4):
                            print(f"  {i}. {item.code} | {item.name} | ₨{item.unit_price}")
                else:
                    print("  NO ITEMS FOUND!")
                    
            finally:
                session.close()

if __name__ == "__main__":
    check_items()
