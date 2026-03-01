# Development Guide (Detailed)

> Scope: This guide documents **only what is present in this repo** right now. It lists every module declared in dependency files and every major subsystem exposed by the codebase.

## 1) Project Overview
A multi-company inventory & sales management system with a React + Tailwind frontend and a Flask + SQLAlchemy backend. Each company has an isolated SQLite database.

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

## 4) Databases (Per Company)
- **Business Company** → backend/instance/company.db

Company context is selected through headers/JWT. The backend routes all requests to the company database.

## 5) Backend Dependencies (Python)
Declared in: backend/requirements.txt

**Total modules: 7**
1. Flask==3.0.0
2. Flask-CORS==4.0.0
3. Flask-JWT-Extended==4.5.3
4. Flask-SQLAlchemy==3.1.1
5. SQLAlchemy==2.0.23
6. python-dotenv==1.0.0
7. WeasyPrint==60.2

> Also present: reportlab==4.0.7 in requirements (used for PDF/report generation). This makes **8 total**. If you remove it, update the count.

### Backend Responsibilities
- REST APIs for orders, buyers, items, payments, reports
- Multi-company DB routing
- Backup/restore
- PDF generation for invoices/bills

### Key Backend Files
- backend/app.py — app bootstrap, CORS, DB switching, auto-backup
- backend/models.py — SQLAlchemy models
- backend/routes/*.py — API routes
- backend/utils.py — shared helpers

### Core API Endpoints (High-Level)
- /api/orders
- /api/buyers
- /api/items
- /api/payments
- /api/reports/*
- /api/backup, /api/backup/restore, /api/backup/periodic

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
- Modals, filters, and printable views
- Report generation view in a separate tab

### Key Frontend Files
- frontend/src/App.js — routing
- frontend/src/services/api.js — API client and headers
- frontend/src/pages/*.js — pages (Orders, Payments, Reports, BuyerReport, etc.)
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
