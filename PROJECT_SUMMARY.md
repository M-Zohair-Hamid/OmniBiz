# Project Summary

## Overview
Business management system for universal company operations. The company operates on its own isolated SQLite database, while the app provides a unified interface for managing all business operations. The system focuses on orders, payments, buyers, items, reporting, and printable invoices/bills, with robust backup and restore support.

## Technology Stack
- Frontend: React with Tailwind CSS
- Backend: Flask + SQLAlchemy
- Databases: SQLite per company
  - instance/company.db

## Architecture & Company Isolation
- Company context is selected per request.
- Frontend sends company headers (X-Company-Code, X-Company-Id).
- Backend resolves the active database based on the incoming company context.
- Each company’s data stays isolated while sharing the same codebase and UI.

## Core Functional Areas
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
- Printable invoice/bill views.
- Templates stored under assets/templates for each company.

### Backup & Restore
- Backups are stored in per-company folders, not zip files.
- Folder structure:
  - <backup root>/company/company.db
- Manual backup supports overwrite confirmation.
- Auto-backup runs on startup if more than 24 hours since last backup (overwrite enabled).
- Restore functionality is available from the UI with overwrite confirmation.

## Key API Endpoints
- Orders: /api/orders
- Payments: /api/payments, /api/payments/order/<id>
- Reports: /api/reports/*
- Backup: /api/backup, /api/backup/config, /api/backup/restore

## Frontend Highlights
- Multi-company navigation with tab title and header updates per company.
- Modal animations with smooth open/close transitions (fade/scale/slide).
- Order and payment workflows include validation feedback and disabled actions when locked.

## Backend Highlights
- Database migrations on startup to add missing columns.
- Eager mapping in order/payment endpoints to avoid lazy-loading errors.
- Company-safe order/payment queries tailored to per-DB isolation.

## Operations & Scripts
- Windows: INSTALLER.bat, start.ps1, stop.ps1
- Linux/Mac: INSTALLER.sh, start.sh

## Notable Workspace Files
- Backend: backend/app.py, backend/routes/*.py
- Frontend: frontend/src/pages/*.js, frontend/src/components/*.js
- Templates: assets/templates/**
- Config: backend/instance, frontend/setupProxy.js, frontend/tailwind.config.js
