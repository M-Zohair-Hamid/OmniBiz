# Project Summary

## Overview
Business management system for single-company operations. The application uses a single SQLite database (company.db) and provides a unified interface for managing all business operations including business settings, orders, payments, buyers, items, reporting, and printable invoices/bills with robust backup and restore support.

## Technology Stack
- Frontend: React with Tailwind CSS
- Backend: Flask + SQLAlchemy
- Database: SQLite (instance/company.db)

## Architecture
- Single-company architecture with no authentication required
- Direct dashboard access on application startup
- All business data stored in company.db
- Business settings include logo management with automatic resizing and placement options

## Core Functional Areas
### Business Settings
- Comprehensive business information management
- Business logo upload with automatic PNG conversion and resizing
- Logo placement options (header or watermark)
- Business details: name, address, contact, GST/NTN, bank account
- Remove logo functionality
- Clear all business information option
- Real-time updates reflected in invoices and bills

### Orders
- Create, edit, view, and list orders.
- Status auto-calculated as pending, partial, or paid based on payments and balances.
- Stock checks enforce available quantity during order creation/editing.
- Edit/delete actions are blocked for paid or partially paid orders.

### Payments
- Supports full and partial payments against orders.
- Tracks remaining balance per order.
- Income tax rate and amount recorded with payments.
- Additional payment flow includes income tax prefill from latest historical value.
- Order payment listing endpoint returns all payments for an order.

### Buyers & Items
- CRUD operations for buyers and items.
- Search and selection helpers in the UI.
- Stock visibility in item suggestions and validation at order submission.

### Ledgers
- Buyer-wise ledger with date filtering.
- Aggregated payment and order history for account review.

### Reports
- Buyer-wise and item-wise reports.
- Table-focused design (charts removed for clarity).
- Summary cards for quick high-level insights.

### Invoices & Bills
- Printable invoice/bill views with business logo
- Professional templates with customizable business information
- Fixed 12-row print layout with centered single-page output
- Logo placement options (header or watermark)
- Templates stored under assets/templates

### Backup & Restore
- Database backups stored in configurable backup folder
- Folder structure: <backup root>/company/company.db
- Manual backup with overwrite confirmation
- Auto-backup on startup if more than 24 hours since last backup
- Restore functionality available from UI with overwrite confirmation

## Key API Endpoints
- Settings: /api/settings, /api/settings/upload-logo, /api/settings/remove-logo
- Orders: /api/orders
- Payments: /api/payments, /api/payments/order/<id>
- Reports: /api/reports/*
- Backup: /api/backup, /api/backup/config, /api/backup/restore

## Frontend Highlights
- Modern indigo/cyan theme with responsive design
- Business settings modal with logo upload and management
- Modal animations with smooth open/close transitions (fade/scale/slide)
- Order and payment workflows include validation feedback and disabled actions when locked
- Print layout optimization for invoices/bills with single-page centered output

## Backend Highlights
- Database migrations on startup to add missing columns
- Eager mapping in order/payment endpoints to avoid lazy-loading errors
- Image processing with Pillow for logo upload (automatic PNG conversion and resizing)
- CORS configuration for cross-origin requests
- Business settings management with file upload support

## Operations & Scripts
- Windows: INSTALLER.bat, start.ps1, stop.ps1
- Linux/Mac: INSTALLER.sh, start.sh

## Notable Workspace Files
- Backend: backend/app.py, backend/routes/*.py (including settings_bp.py)
- Frontend: frontend/src/pages/*.js, frontend/src/components/*.js (including BusinessSettingsModal.js)
- Templates: assets/templates/**
- Config: backend/instance, frontend/setupProxy.js, frontend/tailwind.config.js
- Database: backend/instance/company.db
