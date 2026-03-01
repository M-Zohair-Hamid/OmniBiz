# Development Guide (Detailed)

> Scope: This guide documents **only what is present in this repo** right now. It lists every module declared in dependency files and every major subsystem exposed by the codebase.

## 1) Project Overview
A single-company inventory & sales management system with a React + Tailwind frontend and a Flask + SQLAlchemy backend. The application uses a single SQLite database (company.db) with business settings management including logo upload/placement options.

## 2) Runtime Requirements
- **Python**: 3.11+ (used by startup scripts)
- **Node.js**: 18+ recommended for React tooling
- **OS**: Windows (PowerShell scripts) and Linux/macOS (bash script)

## 3) Repository Layout
```
assets/                 Static HTML templates (invoice/bill)
backend/                Flask backend
frontend/               React frontend
imgs/                   Image assets
instance/               SQLite DBs (runtime data)
start.ps1               Windows start script
start.sh                Linux/macOS start script
stop.ps1                Windows stop script
INSTALLER.*             Installer scripts
```

## 4) Database
- **Single database** → backend/instance/company.db
- Contains business_settings table for logo and business information management
- No authentication required - direct access to all features

## 5) Backend Dependencies (Python)
Declared in: backend/requirements.txt

**Total modules: 8+**
1. Flask==3.0.0
2. Flask-CORS==4.0.0
3. Flask-JWT-Extended==4.5.3
4. Flask-SQLAlchemy==3.1.1
5. SQLAlchemy==2.0.23
6. python-dotenv==1.0.0
7. WeasyPrint==60.2
8. Pillow (for image processing - logo upload/resize)
9. reportlab==4.0.7 (for PDF/report generation)

### Backend Responsibilities
- REST APIs for orders, buyers, items, payments, reports, settings
- Business settings and logo management
- Backup/restore
- PDF generation for invoices/bills
- Image processing for logo uploads

### Key Backend Files
- backend/app.py — app bootstrap, CORS, auto-backup
- backend/models.py — SQLAlchemy models (including BusinessSettings)
- backend/routes/settings_bp.py — Business settings and logo management API
- backend/routes/order_bp.py — Order API with 12-item validation and round_off_amount()
- backend/routes/payment_bp.py — Payment API with ROUND_HALF_UP rounding
- backend/routes/*.py — Other API routes
- backend/utils.py — shared helpers

### Core API Endpoints (High-Level)
- /api/settings — Business settings management (GET/POST)
- /api/settings/upload-logo — Logo upload with automatic PNG conversion and resizing
- /api/settings/remove-logo — Remove business logo
- /api/orders (12-item limit validation, rounded status calculation)
- /api/buyers
- /api/items
- /api/payments (whole-rupee rounding with ROUND_HALF_UP)
- /api/reports/*
- /api/backup, /api/backup/restore, /api/backup/periodic

### Order Management Features
- **MAX_ORDER_ITEMS = 12**: Hard limit enforced in create/update endpoints
- **round_off_amount()**: Decimal ROUND_HALF_UP for consistent financial calculations
- **calculate_order_status()**: Uses rounded values matching payment logic
- **Frontend validation**: UI blocks adding items beyond 12-item limit
- **Cart display**: Real-time "Cart: X/12 items | Qty: Y" indicator in modal

### Payment Features
- **Whole-rupee rounding**: All payment calculations use ROUND_HALF_UP
- **Auto-detection**: Payment type (full/partial) auto-selected based on amount
- **Status alignment**: Order status calculation matches payment rounding
- **Partial unlock**: Orders with partial payments remain editable (only paid locked)

### Business Settings Management Features
- **Logo upload**: Automatic PNG conversion and image resizing (max 800x800)
- **Logo placement**: Options for header or watermark placement in invoices/bills
- **Business information**: Name, address, contact, GST/NTN, bank account details
- **Remove logo**: One-click logo removal functionality
- **Clear all**: Reset all business information to defaults
- **Real-time updates**: Changes reflected immediately in invoice/bill templates

## 6) Frontend Dependencies (React)
Declared in: frontend/package.json

**Total dependencies: 10**
1. axios
2. chart.js
3. html2canvas
4. html2pdf.js
5. react
6. react-chartjs-2
7. react-dom
8. react-icons
9. react-router-dom
10. tailwindcss

**Dev dependencies: 3**
1. autoprefixer
2. postcss
3. react-scripts

### Frontend Responsibilities
- UI for orders, buyers, items, payments, ledgers, reports
- Business settings modal with logo upload and management
- 12-item order validation with real-time cart counter
- Fixed 12-row print tables (Bill/STI) with serial numbers and centered single-page layout
- Payment type auto-selection based on remaining balance
- Modals, filters, and printable views
- Report generation view in a separate tab

### Key Frontend Files
- frontend/src/App.js — routing
- frontend/src/services/api.js — API client
- frontend/src/components/BusinessSettingsModal.js — Business settings and logo management UI
- frontend/src/components/BackupModal.js — Backup and restore UI
- frontend/src/pages/OrdersPage.js — Order management with 12-item validation and cart display
- frontend/src/pages/BillPage.js — Fixed 12-row Bill print table with centered layout
- frontend/src/pages/InvoicePage.js — Fixed 12-row Sales Tax Invoice print table with centered layout
- frontend/src/pages/*.js — other pages (Payments, Reports, BuyerReport, etc.)
- frontend/src/components/*.js — shared UI components

## 7) Root-Level package.json
Declared in: package.json (root)

**Total dependencies: 2**
1. chart.js
2. react-chartjs-2

> This appears to be a minimal root package.json that duplicates frontend deps. If not intended, remove or document the purpose.

## 8) How the Application Runs
### Windows
- start.ps1: initializes DBs, starts Flask and React, opens browser

### Linux/macOS
- start.sh: uses .venv if present, initializes DBs, starts Flask and React, opens browser

## 9) Reports & Analytics
- Summary cards for total sales, pending, orders, buyers
- Buyer-wise and item-wise tables
- Generated buyer report in a new tab
- Buyer relationship analysis endpoint: /api/reports/buyer-relationship

## 10) Buyer Relationship Analysis Algorithm
- Deterministic scoring using existing data (orders/payments/buyers)
- Metrics: purchase frequency, revenue contribution, payment discipline, growth trend
- Weighted score (0–100) with labels
- Output includes per-buyer metrics breakdown

## 11) Backup System
- Manual backup: /api/backup
- Periodic ZIP backup: /api/backup/periodic
- Restore: /api/backup/restore and /api/backup/periodic/restore

## 12) Important Notes
- **node_modules** is currently committed. Consider removing from Git and adding to .gitignore for cleaner diffs.
- Two summary docs exist: PROJECT_SUMMARY.md and PROJECT_SUMMARY_BRIEF.md

## 13) Quick Start (Manual)
### Backend
```
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate # Linux/macOS
pip install -r requirements.txt
python app.py
```

### Frontend
```
cd frontend
npm install
npm start
```

---
If you want this guide expanded further (e.g., exact DB schema, route-by-route docs, or UI component tree), say which section to expand first.
