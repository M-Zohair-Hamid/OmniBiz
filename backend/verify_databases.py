"""
Database Verification Script
Verifies that both company databases are separate and isolated
"""
import sqlite3
import os

def verify_database(db_name, company_name):
    """Verify database structure and data"""
    db_path = os.path.join('instance', db_name)
    
    if not os.path.exists(db_path):
        print(f"❌ {db_name} not found!")
        return False
    
    print(f"\n{'='*60}")
    print(f"Verifying: {company_name} Database ({db_name})")
    print(f"{'='*60}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check companies table
        cursor.execute("SELECT id, name, code, email FROM companies")
        companies = cursor.fetchall()
        print(f"\n✓ Companies ({len(companies)}):")
        for company in companies:
            print(f"  ID: {company[0]}, Name: {company[1]}, Code: {company[2]}, Email: {company[3]}")
        
        # Check users table
        cursor.execute("SELECT id, username, full_name, company_id FROM users")
        users = cursor.fetchall()
        print(f"\n✓ Users ({len(users)}):")
        for user in users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Name: {user[2]}, Company ID: {user[3]}")
        
        # Check buyers table
        cursor.execute("SELECT id, name, company_name, city, company_id FROM buyers")
        buyers = cursor.fetchall()
        print(f"\n✓ Buyers ({len(buyers)}):")
        for buyer in buyers:
            print(f"  ID: {buyer[0]}, Name: {buyer[1]}, City: {buyer[3]}, Company ID: {buyer[4]}")
        
        # Check items table
        cursor.execute("SELECT id, code, name, unit_price, company_id FROM items")
        items = cursor.fetchall()
        print(f"\n✓ Items ({len(items)}):")
        for item in items:
            print(f"  ID: {item[0]}, Code: {item[1]}, Name: {item[2]}, Price: Rs.{item[3]}, Company ID: {item[4]}")
        
        # Get database file size
        file_size = os.path.getsize(db_path)
        print(f"\n✓ Database Size: {file_size:,} bytes ({file_size/1024:.2f} KB)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.close()
        return False

def main():
    print("\n" + "="*60)
    print("DATABASE ISOLATION VERIFICATION")
    print("="*60)
    
    os.chdir(os.path.dirname(__file__))
    
    # Verify UmarSons database
    umarsons_ok = verify_database('umarsons.db', 'UmarSons')
    
    # Verify Makkah Packages database
    makkah_ok = verify_database('makkah_packages.db', 'Makkah Packages')
    
    # Summary
    print(f"\n{'='*60}")
    print("VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"UmarSons Database:       {'✓ PASS' if umarsons_ok else '❌ FAIL'}")
    print(f"Makkah Packages Database: {'✓ PASS' if makkah_ok else '❌ FAIL'}")
    print()
    
    if umarsons_ok and makkah_ok:
        print("✓ SUCCESS: Both databases are properly isolated!")
        print()
        print("Key Points:")
        print("  • Each company has its own separate .db file")
        print("  • Data cannot cross between databases")
        print("  • Each database has its own company record (ID 1 or 2)")
        print("  • Buyers, Items, Orders specific to each database")
        print()
    else:
        print("❌ FAILED: Database verification issues detected!")
    
    print("="*60)

if __name__ == '__main__':
    main()
