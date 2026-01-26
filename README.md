# PaperCone Business Management System

A modern, fully responsive web application for managing textile industry paper cone orders. The system handles multi-company orders, invoices, payments, and analytics with company-specific dashboards.

## 🚀 Quick Start

### First Time Setup (New Computer)
1. **Double-click** `INSTALLER.bat`
   - Installs Python 3.11+ and Node.js 18+ (if needed)
   - Installs all dependencies automatically
   - Creates database and desktop shortcut
   - Takes 10-15 minutes

### Daily Usage
**Double-click** `start.bat` - That's it!

The script will:
- ✅ Start Flask backend (Port 5000)
- ✅ Start React frontend (Port 3000)
- ✅ Open browser automatically

**Login:**
- Click **UmarSons** button (Company in Faisalabad)
- Click **Makkah Packages** button (Company in Faisalabad)
- No password required - instant dashboard access!

---

## 🛠️ Utility Scripts

- **INSTALLER.bat** - Complete first-time setup (run this first on new computers)
- **start.bat** - Start the application (backend + frontend)
- **stop.bat** - Stop all services
- **check-status.bat** - Verify system status and dependencies
- **reinstall-dependencies.bat** - Fix corrupted packages
- **backup-database.bat** - Create timestamped database backup
- **create-shortcut.bat** - Create desktop shortcut

See `README.txt` for detailed instructions on each script.

---

**Project Date**: January 25, 2026  

```
Project-CS-L/
├── frontend/                 # React.js frontend application
│   ├── public/              # Static assets
│   │   └── imgs/            # Company background images
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── context/         # React Context (Auth, Toast)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service client
│   │   ├── App.js           # Main app component
│   │   ├── index.js         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                  # Python Flask backend
   - Add/Edit/Delete buyers with unique constraint protection
   - Comprehensive duplicate prevention with user-friendly errors
│   ├── app.py               # Flask application
│   ├── models.py            # Database models
   - Product catalog management with auto-generated codes (HS-XXXX from 1000)
   - Unique item codes and names (prevents duplicates)

## Technology Stack

✅ Mock token-based multi-company system  
✅ Direct dashboard access (no password)
✅ Company-specific data isolation (UmarSons, Makkah Packages)
✅ GST/NTN number support for companies and buyers
✅ Auto-generated item codes (HS-1000+) with unique constraints
✅ Auto-prefixed buyer GST-/NTN- fields
✅ Unique constraint error handling (409 Conflict responses)
✅ Duplicate prevention with field-specific error messages
✅ Responsive sidebar navigation  
✅ Real-time dashboard with Chart.js analytics  
✅ Buyer management with CRUD operations and duplicate prevention
✅ Item/Product management with auto-code generation
✅ Dynamic order creation with automatic totals  
✅ Professional invoice PDF generation (Rs. format)  
✅ Invoice filename: `invoice-YYYY-MM-DD-BuyerName.pdf`
✅ Party ledger with running balance
✅ Ledger PDF export with date filtering
✅ Payment tracking with multiple methods  
✅ Advanced reporting & analytics  
✅ Excel/CSV export functionality  
✅ Pagination and search  
✅ Toast notifications  
✅ Axios interceptor for automatic token handling
✅ Complete installer and utility scripts with full dependency checking
✅ Database backup system  
   - Payment status distribution
   - Buyer-wise and item-wise analytics
   - Recent orders overview

3. **Buyer Management**
   - Add/Edit/Delete buyers
   - Credit limit tracking
   - Contact information management
   - Search and pagination

4. **Item Management**
   - Product catalog management
   - Pricing and stock tracking
   - Unit configuration (PCS, KG, MTR, BOX)
   - Inventory management

5. **Order Management**
   - Create dynamic orders with multiple items
   - Automatic tax calculation
   - Order status tracking
   - Delivery date management

6. **Invoice Management**
   - Auto-generate invoices from orders
   - Tax calculation and formatting
   - PDF export capability
   - Invoice status tracking

7. **Payment Management**
   - Record partial/full payments
   - Multiple payment methods (bank, cash, check)
   - Auto-calculate balances
   - Payment tracking

8. **Reports & Analytics**
   - Buyer-wise sales reports
   - Item-wise sales analysis
   - Filterable date ranges
   - CSV export functionality

### UI/UX Features

- ✅ Fully responsive design (desktop, tablet, mobile)
- ✅ Modern Tailwind CSS styling
- ✅ Company-specific dashboard backgrounds
- ✅ Color-coded status indicators
- ✅ Toast notifications for feedback
- ✅ Collapsible sidebar navigation
- ✅ Dynamic table pagination
- ✅ Real-time data visualization
- ✅ PKR currency formatting

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- Python 3.8+
- pip (Python package manager)
- SQLite (included with Python)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   # or
   source venv/bin/activate       # On macOS/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your settings
   ```

5. **Run Flask server:**
   ```bash
   python app.py
   ```
   Server will be available at: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start React development server:**
   ```bash
   npm start
   ```
   Application will open at: `http://localhost:3000`

## Company Access

```
Company 1: UmarSons
- Location: Industrial Area, Faisalabad, Pakistan
- GST: GST-PC-2024-001
- Mock Token: Bearer mock-token-PC
- Access: Click "UmarSons" button on login page

Company 2: Makkah Packages
- Location: Textile City, Faisalabad, Pakistan
- GST: GST-QP-2024-002
- Mock Token: Bearer mock-token-QP
- Access: Click "Makkah Packages" button on login page

No password required - instant dashboard access!
```

## API Endpoints

All endpoints accept optional JWT tokens (`@jwt_required(optional=True)`).
Mock tokens: `Bearer mock-token-PC` or `Bearer mock-token-QP`

### Authentication
- `POST /api/auth/login` - Login user (optional - direct access available)
- `GET /api/auth/companies` - Get available companies
- `GET /api/auth/verify-token` - Verify JWT token

### Buyers
- `GET /api/buyers` - List buyers (with pagination)
- `GET /api/buyers/{id}` - Get buyer details
- `POST /api/buyers` - Create buyer
- `PUT /api/buyers/{id}` - Update buyer
- `DELETE /api/buyers/{id}` - Delete buyer

### Items
- `GET /api/items` - List items
- `GET /api/items/{id}` - Get item details
- `POST /api/items` - Create item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/{id}` - Get invoice details
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}/pdf` - Download invoice PDF

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `DELETE /api/payments/{id}` - Delete payment

### Ledgers
- `GET /api/ledgers/{buyer_id}` - Get party ledger with date filters
- `GET /api/ledgers/{buyer_id}/pdf` - Download ledger PDF
- Date filters: `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

### Reports
- `GET /api/reports/summary` - Summary statistics
- `GET /api/reports/payment-status` - Payment status breakdown
- `GET /api/reports/buyer-wise` - Buyer-wise sales
- `GET /api/reports/item-wise` - Item-wise sales
- `GET /api/reports/orders/export-csv` - Export orders as CSV

### Dashboard
- `GET /api/dashboard` - Dashboard data with charts

## Database Schema

### Tables

- **companies** - Company information (with GST/NTN numbers, Faisalabad addresses)
- **users** - User accounts with company isolation
- **buyers** - Client/mill information (with GST/NTN support)
- **items** - Product catalog
- **orders** - Customer orders with automatic totals
- **order_items** - Order line items with tax calculation
- **invoices** - Generated invoices with PDF export
- **payments** - Payment records with multiple methods

### Key Features
- Complete company data isolation (all queries filtered by company_id)
- GST/NTN number support for companies and buyers
- Running balance calculation in ledgers
- Automatic tax and total calculations

## Configuration

### Environment Variables (.env)

```
FLASK_ENV=development
FLASK_APP=app.py
JWT_SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///papercone.db
```

### Frontend API Configuration

The frontend automatically connects to `http://localhost:5000/api`. To change the API URL:

1. Update `REACT_APP_API_URL` environment variable
2. Or modify the `API_BASE_URL` in `src/context/AuthContext.js`

## Usage Guide

### Login Process
1. Run `start.bat` (or use desktop shortcut)
2. Browser opens to `http://localhost:3000`
3. Click company button (UmarSons or Makkah Packages)
4. Dashboard loads instantly - no password needed!

### Navigation
- Use sidebar to navigate between modules
- Click module names to view/manage data
- Use "+ Add" buttons to create new records
- Edit and delete options available in tables

### Creating Orders
1. Go to Orders section
2. Click "+ New Order"
3. Select buyer and items
4. Set quantities and tax rate
5. Click "Create Order"

### Generating Invoices
1. Go to Invoices section
2. Click "+ Create Invoice"
3. Select an order
4. Set invoice and due dates
5. Download PDF if needed

### Recording Payments
1. Go to Payments section
2. Click "+ Record Payment"
3. Select invoice and enter amount
4. Choose payment method
5. Add reference number if applicable

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920x1080 and larger)
- Laptops (1366x768)
- Tablets (768x1024)
- Mobile devices (375x667)

All components resize dynamically based on screen size.

## Features Implemented

✅ Mock token-based multi-company system  
✅ Direct dashboard access (no password)
✅ Company-specific data isolation (UmarSons, Makkah Packages)
✅ GST/NTN number support for companies and buyers
✅ Responsive sidebar navigation  
✅ Real-time dashboard with Chart.js analytics  
✅ Buyer management with CRUD operations  
✅ Item/Product management  
✅ Dynamic order creation with automatic totals  
✅ Professional invoice PDF generation (Rs. format)  
✅ Invoice filename: `invoice-YYYY-MM-DD-BuyerName.pdf`
✅ Party ledger with running balance
✅ Ledger PDF export with date filtering
✅ Payment tracking with multiple methods  
✅ Advanced reporting & analytics  
✅ Excel/CSV export functionality  
✅ Pagination and search  
✅ Toast notifications  
✅ Axios interceptor for automatic token handling
✅ Complete installer and utility scripts
✅ Database backup system  

## Future Enhancements

- Email invoice delivery
- SMS payment reminders
- Advanced inventory analytics
- User role management
- Audit logs
- Bulk order import from CSV
- Integration with accounting software
- Mobile app (React Native)
- Real-time notifications
- Advanced reporting with filters

## Troubleshooting

### "Network Error" on Dashboard
**Solution:** Backend not running. Run `stop.bat` then `start.bat`

### "Python is not installed"
**Solution:** Run `INSTALLER.bat` - it will guide you to install Python 3.11+

### "Node.js is not installed"
**Solution:** Run `INSTALLER.bat` - it will guide you to install Node.js 18+

### Package Errors
**Solution:** Run `reinstall-dependencies.bat`

### Check System Status
**Solution:** Run `check-status.bat` to verify all components

For detailed troubleshooting, see `README.txt`

## Support

For issues or questions:
1. Run `check-status.bat` first
2. Check terminal windows for error messages
3. Review Flask backend logs
4. Try `reinstall-dependencies.bat`

## License

This project is proprietary and confidential.

---

**Project Date**: January 2026  
**Version**: 1.0.0  
**Status**: Production Ready

```
Project-CS-L
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ app.py
│  ├─ init_databases.py
│  ├─ instance
│  │  ├─ makkah_packages.db
│  │  └─ umarsons.db
│  ├─ migrate_add_gst_ntn.py
│  ├─ models.py
│  ├─ requirements.txt
│  ├─ routes
│  │  ├─ auth_bp.py
│  │  ├─ buyer_bp.py
│  │  ├─ dashboard_bp.py
│  │  ├─ invoice_bp.py
│  │  ├─ item_bp.py
│  │  ├─ ledger_bp.py
│  │  ├─ order_bp.py
│  │  ├─ payment_bp.py
│  │  ├─ report_bp.py
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  │     ├─ auth_bp.cpython-311.pyc
│  │     ├─ buyer_bp.cpython-311.pyc
│  │     ├─ dashboard_bp.cpython-311.pyc
│  │     ├─ invoice_bp.cpython-311.pyc
│  │     ├─ item_bp.cpython-311.pyc
│  │     ├─ ledger_bp.cpython-311.pyc
│  │     ├─ order_bp.cpython-311.pyc
│  │     ├─ payment_bp.cpython-311.pyc
│  │     ├─ report_bp.cpython-311.pyc
│  │     └─ __init__.cpython-311.pyc
│  ├─ setup_databases.py
│  ├─ setup_umarsons.py
│  ├─ test_isolation.py
│  ├─ test_switching.py
│  ├─ update_company_info.py
│  ├─ utils.py
│  ├─ verify_databases.py
│  └─ __pycache__
│     ├─ app.cpython-311.pyc
│     ├─ models.cpython-311.pyc
│     └─ utils.cpython-311.pyc
├─ frontend
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ index.html
│  ├─ setupProxy.js
│  ├─ src
│  │  ├─ App.js
│  │  ├─ components
│  │  │  ├─ ProtectedRoute.js
│  │  │  ├─ Sidebar.js
│  │  │  └─ Toast.js
│  │  ├─ context
│  │  │  ├─ AuthContext.js
│  │  │  └─ ToastContext.js
│  │  ├─ index.css
│  │  ├─ index.js
│  │  ├─ pages
│  │  │  ├─ BuyersPage.js
│  │  │  ├─ DashboardPage.js
│  │  │  ├─ InvoicesPage.js
│  │  │  ├─ ItemsPage.js
│  │  │  ├─ LedgerPage.js
│  │  │  ├─ LoginPage.js
│  │  │  ├─ OrdersPage.js
│  │  │  ├─ PaymentsPage.js
│  │  │  └─ ReportsPage.js
│  │  ├─ services
│  │  │  └─ api.js
│  │  └─ utils
│  │     ├─ dateUtils.js
│  │     └─ exportUtils.js
│  └─ tailwind.config.js
├─ imgs
│  └─ 1.jpg
├─ INSTALLER.bat
├─ INSTALLER.sh
├─ instance
│  └─ papercone.db
├─ PROJECT_STATE.md
├─ public
│  └─ imgs
├─ README.md
├─ README.txt
├─ start.ps1
├─ start.sh
├─ stop.ps1
└─ test-date-format.js

```