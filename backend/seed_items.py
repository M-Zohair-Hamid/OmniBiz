"""
Seed 100+ dummy items into both company databases.
"""
from sqlalchemy.orm import sessionmaker
import random

from app import app
from models import db, Item, Company

TARGET_COUNT = 120


def seed_items_for_company(bind_key: str, company_label: str, target_count: int = TARGET_COUNT) -> None:
    engine = db.get_engine(bind=bind_key)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        company = session.query(Company).first()
        if not company:
            print(f"[SEED] No company found for {bind_key}; skipping.")
            return

        existing_items = session.query(Item).order_by(Item.id.asc()).all()
        existing_names = {item.name for item in existing_items}
        current_count = len(existing_items)

        # Normalize existing item codes to HS-#### format
        seq = 1
        for item in existing_items:
            item.code = f"HS-{seq:04d}"
            seq += 1
        session.commit()

        existing_codes = {item.code for item in existing_items}

        if current_count >= target_count:
            print(f"[SEED] {bind_key}: already has {current_count} items. No changes.")
            return

        needed = target_count - current_count
        items_to_add = []
        seq = len(existing_items) + 1

        while len(items_to_add) < needed:
            code = f"HS-{seq:04d}"
            name = f"{company_label} Paper Cone {seq:04d}"
            seq += 1

            if code in existing_codes or name in existing_names:
                continue

            unit = random.choice(["PCS", "KG", "MTR"])
            unit_price = round(random.uniform(15, 80), 2)
            quantity_in_stock = float(random.randint(200, 5000))
            description = f"{company_label} sample item for testing ({code})"

            items_to_add.append(
                Item(
                    code=code,
                    name=name,
                    description=description,
                    unit=unit,
                    unit_price=unit_price,
                    quantity_in_stock=quantity_in_stock,
                    company_id=company.id,
                )
            )

            existing_codes.add(code)
            existing_names.add(name)

        session.add_all(items_to_add)
        session.commit()

        print(f"[SEED] {bind_key}: added {len(items_to_add)} items. Total now {current_count + len(items_to_add)}.")
    finally:
        session.close()


def main() -> None:
    with app.app_context():
        seed_items_for_company("umarsons", "UmarSons")
        seed_items_for_company("makkah_packages", "Makkah Packages")


if __name__ == "__main__":
    main()
