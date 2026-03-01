# OmniBiz

A modern, fully responsive web application for managing business operations. The system handles orders, invoices, payments, and analytics with a sophisticated indigo/cyan color theme and comprehensive business settings management.

## 🎨 Design System

The application features a professional **Deep Indigo & Electric Cyan** color palette:

- **Primary (Deep Indigo):** `#17144B` - Backgrounds, main layouts, borders
- **Secondary (Muted Slate Blue):** `#3A3F8C` - Cards, elevated surfaces
- **Accent (Electric Cyan):** `#00D4FF` - Buttons, links, highlights, hover states
- **Text (Soft Off-White):** `#EBEEF5` - Primary text, high contrast readability

This cinematic color scheme provides:
- ✅ High contrast for accessibility
- ✅ Professional, modern appearance
- ✅ Consistent visual hierarchy
- ✅ Electric cyan accents for interactive elements

## 🚀 Quick Start

### First Time Setup (New Computer)

#### Windows (PowerShell)
```powershell
.\INSTALLER.ps1    # Run installer
.\start.ps1        # Start application daily
```

#### Linux/Mac (Bash)
```bash
chmod +x INSTALLER.sh start.sh
./INSTALLER.sh     # Run installer
./start.sh         # Start application daily
```

The installer will:
- ✅ Check Python 3.11+ and Node.js 18+
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Initialize databases
- ✅ Create desktop shortcut
- ✅ Takes 10-15 minutes

### Daily Usage

**Just run the start script:**

#### Windows
```powershell
.\start.ps1
```

#### Linux/Mac
```bash
./start.sh
```

The script will:
- ✅ Start Flask backend (Port 5000)
- ✅ Start React frontend (Port 3000)
- ✅ Open browser automatically

**Login:**
- Click **Business Company** button (Universal Organization)
- No password required - instant dashboard access!

---

## � Repository Structure

### 📁 Folders

| Folder | Description |
|--------|-------------|
| **assets/** | Design assets including invoice templates for UmarSons and Makkah Packages with logos, watermarks, and print layouts |
| **backend/** | Python Flask REST API with SQLAlchemy ORM, authentication, blueprints for orders, payments, items, buyers, and reports |
| **frontend/** | React.js SPA with Tailwind CSS, Chart.js dashboards, responsive UI components, and service layer for API calls |
| **imgs/** | Static image resources for branding and UI elements |
| **instance/** | SQLite database file (company.db) - business data storage |
| **node_modules/** | NPM dependencies for the root workspace (auto-generated, not manually edited) |

### 📄 Root Files

| File | Purpose |
|------|---------|
| **.gitignore** | Git ignore rules for Python, Node.js, databases, and build artifacts |
| **DEVELOPMENT.md** | Developer guide with architecture, API documentation, and contribution guidelines |
| **INSTALLER.bat** | Windows batch installer (legacy alternative to PowerShell) |
| **INSTALLER.ps1** | PowerShell installer script - checks dependencies, creates venv, installs packages, initializes databases |
| **INSTALLER.sh** | Bash installer script for Linux/Mac - mirrors INSTALLER.ps1 functionality |
| **package.json** | Root Node.js workspace configuration for managing frontend dependencies |
| **PROJECT_SUMMARY.md** | Comprehensive project documentation with features, tech stack, and implementation details |
| **PROJECT_SUMMARY_BRIEF.md** | Quick overview and executive summary of the project |
| **README.md** | This file - main documentation with quick start, features, and usage instructions |
| **start-venv.ps1** | Virtual environment launcher script for backend Python environment |
| **start.ps1** | Daily startup script - activates venv, starts Flask backend and React frontend, opens browser |
| **start.sh** | Bash version of start.ps1 for Linux/Mac systems |
| **stop.ps1** | Cleanup script to stop all running Flask and React processes |

---

## 🛠️ Available Scripts

- **INSTALLER.ps1** / **INSTALLER.sh** - Complete first-time setup (Windows/Linux/Mac)
- **start.ps1** / **start.sh** - Start the application
- **stop.ps1** - Stop all services
- **check_items.py** - Verify database integrity

---

## 📁 Detailed Project Structure

**Project Date**: February 2026  
**Last Updated**: February 17, 2026

```
Project-CS-L/
├── frontend/                 # React.js frontend application
│   ├── public/              # Static assets
│   │   └── imgs/            # Company background images
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── Sidebar.js   # Navigation with indigo gradient
│   │   │   ├── Toast.js     # Notification system
│   │   │   └── ProtectedRoute.js
│   │   ├── context/         # React Context (Auth, Toast)
│   │   ├── pages/           # Page components with indigo/cyan theme
│   │   │   ├── DashboardPage.js
│   │   │   ├── OrdersPage.js

│   │   │   ├── ItemsPage.js
│   │   │   ├── BuyersPage.js
│   │   │   ├── ReportsPage.js
│   │   │   ├── PaymentsPage.js
│   │   │   ├── InvoicesPage.js
│   │   │   ├── LedgerPage.js
│   │   │   └── LoginPage.js
│   │   ├── services/        # API service client
│   │   ├── utils/           # Utilities (export, date)
│   │   ├── App.js           # Main app component
│   │   ├── index.js         # React entry point
│   │   └── index.css        # Tailwind + custom styles
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                  # Python Flask backend
│   ├── app.py               # Flask application
│   ├── models.py            # Database models
│   ├── utils.py             # Utility functions
│   ├── requirements.txt     # Python dependencies
│   ├── routes/              # API route blueprints
│   │   ├── auth_bp.py       # Authentication
│   │   ├── buyer_bp.py      # Buyer management
│   │   ├── item_bp.py       # Item/Product management
│   │   ├── order_bp.py      # Order management
│   │   ├── invoice_bp.py    # Invoice generation
│   │   ├── payment_bp.py    # Payment tracking
│   │   ├── ledger_bp.py     # Party ledger
│   │   ├── report_bp.py     # Reports & analytics
│   │   ├── settings_bp.py   # Business settings & logo management
│   │   └── dashboard_bp.py  # Dashboard data
│   │   └── dashboard_bp.py  # Dashboard data
│   └── instance/            # SQLite database
│       └── company.db       # Company database
│
└── assets/                   # Design assets
    └── templates/            # Invoice templates
        ├── invoice.html      # Regular invoice (indigo theme)
        ├── sales-tax-invoice.html  # Sales tax invoice (indigo theme)
        └── umarsons/         # Invoice templates
            ├── logo.png      # Company logo
            └── watermark.png # Invoice watermark
```

## ✨ Key Features

### UI/UX Features
- ✅ **Modern Indigo/Cyan Theme** - Professional deep indigo with electric cyan accents
- ✅ **Fully Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Glassmorphism Effects** - Backdrop blur and transparency for modern look
- ✅ **Dark Theme Sidebar** - Indigo gradient navigation with smooth transitions
- ✅ **Color-Coded Buttons** - Red for destructive actions (Delete, Cancel, Logout)
- ✅ **Large, Readable Charts** - Black text with 14-16px fonts for accessibility
- ✅ **Toast Notifications** - Real-time feedback for user actions
- ✅ **Smooth Animations** - Hover effects, scale transforms, transitions
- ✅ **Consistent Typography** - Montserrat font for headers and titles

### Business Features

1. **Business Settings Management**
   - Comprehensive business information editor
   - Logo upload with automatic resizing and PNG conversion
   - Logo placement options (header/watermark)
   - Business information fields (name, address, contact, GST/NTN, bank details)
   - Remove logo functionality
   - Clear all business information with one click
   - Real-time preview of business information

2. **Dashboard & Analytics**
   - Real-time Chart.js visualizations with black text indicators
   - Buyer-wise sales analytics
   - Item-wise sales breakdown
   - Payment status distribution (Doughnut chart)
   - Recent orders overview
   - Summary cards with key metrics
   - Large font sizes (14-16px) for readability

3. **Buyer Management**
   - Add/Edit/Delete buyers with unique constraint protection
   - GST/NTN number support
   - Credit limit tracking
   - Contact information management
   - Search and pagination
   - Duplicate prevention with user-friendly errors

4. **Item Management**
   - Product catalog management with auto-generated codes (HS-XXXX from 1000)
   - Unique item codes and names (prevents duplicates)
   - Pricing management
   - Unit configuration (PCS, KG, MTR, BOX)
   - Item details and description management

5. **Order Management**
   - Create dynamic orders with up to 12 items per order (hard limit enforced)
   - Live cart indicator showing "Cart: X/12 items | Qty: Y" in order modal
   - Automatic tax calculation (18% GST)
   - Order status tracking (pending/partial/paid) with consistent rounding
   - Delivery date management
   - Real-time total updates
   - Item quantity and rate management
   - Frontend and backend validation for 12-item maximum

6. **Invoice & Print Management**
   - Professional HTML invoice templates (indigo theme)
   - Fixed 12-row print tables for Bills and Sales Tax Invoices
   - Serial-numbered rows (1-12) with blank cells for unused slots
   - Single-page print layout (no pagination)
   - Regular Bill and Sales Tax Invoice templates
   - Company logo and watermark support
   - Auto-generate invoices from orders
   - Tax calculation and formatting
   - PDF export capability
   - Invoice status tracking
   - Filename format: `invoice-YYYY-MM-DD-BuyerName.pdf`

7. **Payment Management**
   - Record partial/full payments with auto-detection
   - Smart payment type selection based on remaining balance
   - Whole-rupee rounding (ROUND_HALF_UP) for consistent calculations
   - Multiple payment methods (bank, cash, check)
   - Auto-calculate balances with rounded amounts
   - Payment tracking with status indicators
   - Partial orders unlocked for payment (only paid orders locked)

8. **Ledger System**
   - Party ledger with running balance
   - Date range filtering
   - PDF export with company branding
   - Transaction history
   - Credit/debit color coding

9. **Reports & Analytics**
   - Buyer-wise sales reports with bar charts
   - Item-wise sales analysis with horizontal bars
   - Filterable date ranges
   - CSV export functionality
   - Summary statistics
   - Payment status breakdown
   - PNG export for charts

## 🛠️ Technology Stack

### Frontend
- **React 18.x** - Modern UI with functional components
- **Tailwind CSS 3.x** - Utility-first styling with custom indigo/cyan theme
- **Chart.js** - Data visualization with customized black text (14-16px fonts)
- **Axios** - HTTP client with JWT token interceptors
- **React Router** - SPA navigation
- **Google Fonts** - Montserrat font family

### Backend
- **Flask 2.3+** - Python web framework
- **Flask-SQLAlchemy** - ORM for database operations
- **Flask-CORS** - Cross-origin resource sharing
- **SQLite** - Lightweight database (separate per company)
- **JWT** - Token-based authentication

### Dev Tools
- **PowerShell** - Automation scripts (start.ps1, INSTALLER.bat)
- **Batch Scripts** - Windows utilities (backup-database.bat, check-status.bat)
- **npm** - Frontend package management
- **pip** - Python package management

### Invoice Templates
- **HTML/CSS** - Professional invoice templates with Montserrat font
  - `sales-tax-invoice.html` - Sales tax invoice with GST breakdown
  - `invoice.html` - Regular invoice without tax details
- **Theme Colors** - Indigo (#17144B) borders and headers
- **Assets** - Company logo and watermark support

## 🎨 Color Palette Reference

The application uses a professional indigo/cyan color scheme:

```css
/* Primary Colors */
--deep-indigo: #17144B;     /* Backgrounds, borders, cards */
--slate-blue: #3A3F8C;      /* Secondary backgrounds, elevated sections */
--electric-cyan: #00D4FF;   /* Primary buttons, links, accents */
--off-white: #EBEEF5;       /* Text, light backgrounds */

/* Semantic Colors */
--red-500: #ef4444;         /* Delete, Cancel, Logout buttons */
--emerald-700: #047857;     /* Success messages, stock indicators */
--black: #000000;           /* Chart text, body text */
```

### Usage in Components
- **Sidebar**: Indigo gradient (`bg-gradient-to-b from-[#17144B] via-[#3A3F8C]`)
- **Primary Buttons**: Cyan gradient (`bg-gradient-to-r from-[#00D4FF] to-[#3A3F8C]`)
- **Destructive Actions**: Red gradient (`bg-gradient-to-r from-red-500 to-red-600`)
- **Tables**: Indigo borders (`border-[#17144B]`)
- **Cards**: Slate blue backgrounds (`bg-[#3A3F8C]`)

### Chart Configuration
Charts use black text for better readability:
```javascript
chartOptions = {
  plugins: {
    legend: { labels: { color: '#000000', font: { size: 16 } } }
  },
  scales: {
    x: { ticks: { color: '#000000', font: { size: 14 } } },
    y: { ticks: { color: '#000000', font: { size: 14 } } }
  }
}
```

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

Direct dashboard access - no authentication required! Simply open the application and start managing your business.

```
Access: Open application at http://localhost:3000
Instant access to all features!
```

## API Endpoints

All endpoints are publicly accessible (no authentication required).

### Authentication (Legacy - not currently used)
- `POST /api/auth/login` - Login user (optional)
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

### Business Settings
- `GET /api/settings` - Get business settings
- `POST /api/settings` - Update business settings
- `POST /api/settings/upload-logo` - Upload business logo
- `POST /api/settings/remove-logo` - Remove business logo
- `GET /api/settings/logo/<filename>` - Get logo file

## Database Schema

### Tables

- **business_settings** - Business information and configuration (name, address, GST/NTN, logo, bank details)
- **buyers** - Client/mill information (with GST/NTN support)
- **items** - Product catalog
- **orders** - Customer orders with automatic totals
- **order_items** - Order line items with tax calculation
- **invoices** - Generated invoices with PDF export
- **payments** - Payment records with multiple methods

### Key Features
- Business logo management with placement options (header/watermark)
- GST/NTN number support for business and buyers
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

### Starting the Application
1. Run `start.bat` or `start.ps1` (opens browser automatically)
2. Browser navigates to `http://localhost:3000`
3. Dashboard loads instantly - no login required!

### Navigation
- Use sidebar to navigate between modules (indigo theme with cyan highlights)
- Click module names to view/manage data
- Use "+ Add" buttons (cyan gradient) to create new records
- Delete/Cancel buttons are red for clarity
- Edit options available in tables

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

✅ Direct dashboard access (no authentication required)  
✅ **Business Settings Management** with logo upload/remove/clear functionality  
✅ **Logo placement options** (header/watermark) with automatic resizing  
✅ Comprehensive business information editor (GST/NTN, bank details)  
✅ Single database system (company.db)  
✅ GST/NTN number support for business and buyers  
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
✅ Professional indigo/cyan color theme (#17144B, #3A3F8C, #00D4FF)  
✅ Large, readable chart text (14-16px, black color)  
✅ Red buttons for destructive actions (Delete/Cancel/Logout)  
✅ Dark green stock indicators for better contrast  
✅ Invoice templates with Montserrat font and company branding  
✅ Glassmorphism login page with gradient backgrounds  
✅ 12-item order limit with frontend UI blocking and backend validation  
✅ Fixed 12-row print tables (Bill/STI) with serial numbers and blanks  
✅ Live cart counter in order modal ("Cart: X/12 items | Qty: Y")  
✅ Smart payment type auto-selection (full/partial detection)  
✅ Consistent whole-rupee rounding across all financial calculations  

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

**Project Date**: February 2026  
**Last Updated**: February 17, 2026  
**Version**: 1.1.0  
**Status**: Production Ready

```
Project-CS-L
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ app.py
│  ├─ instance
│  │  └─ company.db
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
│  │  ├─ settings_bp.py
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
│  │     ├─ settings_bp.cpython-311.pyc
│  │     └─ __init__.cpython-311.pyc
│  ├─ uploads/
│  ├─ utils.py
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
│  │  │  ├─ BackupModal.js
│  │  │  ├─ BusinessSettingsModal.js
│  │  │  ├─ ProtectedRoute.js
│  │  │  ├─ Sidebar.js
│  │  │  └─ Toast.js
│  │  ├─ context
│  │  │  ├─ AuthContext.js
│  │  │  └─ ToastContext.js
│  │  ├─ hooks
│  │  │  └─ useModalAnimation.js
│  │  ├─ index.css
│  │  ├─ index.js
│  │  ├─ pages
│  │  │  ├─ BillPage.js
│  │  │  ├─ BuyersPage.js
│  │  │  ├─ DashboardPage.js
│  │  │  ├─ InvoicePage.js
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
│  │     ├─ exportUtils.js
│  │     └─ numberToWords.js
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
