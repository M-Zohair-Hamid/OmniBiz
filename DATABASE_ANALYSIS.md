# Comprehensive Project Summary: Database Tables, Data Flow & Features

## DATABASE TABLES & SCHEMAS

### 1. **Companies Table** ✅
**File Location**: `backend/models.py` (Line 60-76)

**Purpose**: Store company information for multi-tenant architecture (Umar Sons, Makkah Packages)

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- name (STRING): Company name (e.g., "UmarSons", "Makkah Packages")
- code (STRING, UNIQUE): Short code (e.g., "PC", "QP")
- background_image (STRING): Path to company background image
- address (STRING): Company address
- phone (STRING): Company phone
- email (STRING): Company email
- gst_number (STRING): Tax registration number
- ntn_number (STRING): Tax ID number
- created_at (DATETIME): Timestamp when created
```

**Data Stored**:
- Umar Sons: PC code, umarsons database
- Makkah Packages: QP code, makkah_packages database

**Relationships**: 1 Company → Many Users, Buyers, Items, Orders

**Status**: ✅ Fully functional

---

### 2. **Users Table** ✅
**File Location**: `backend/models.py` (Line 78-91)

**Purpose**: Store employee/user login credentials and roles

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- employee_id (STRING, UNIQUE): Employee ID (e.g., "EMP001", "EMP002")
- username (STRING, UNIQUE): Login username
- password (STRING): Hashed password (using werkzeug.security)
- email (STRING): User email
- full_name (STRING): Full name of user
- role (STRING): "admin" or "user"
- company_id (INT, FOREIGN KEY): Links to Companies table
- is_active (BOOLEAN): Active/inactive status
- created_at (DATETIME): Account creation timestamp
```

**Data Stored**:
- admin1 (Umar Sons) - role: admin
- admin2 (Makkah Packages) - role: admin

**Relationships**: Many Users → 1 Company

**Functionality**:
- Login authentication (routes/auth_bp.py)
- Token generation (JWT)
- Company filtering (users only see their company's data)

**Status**: ✅ Fully functional

---

### 3. **Buyers Table** ✅
**File Location**: `backend/models.py` (Line 93-116)

**Purpose**: Store customer/buyer information for order creation

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- company_name (STRING, UNIQUE): Official buyer company name
- gst_number (STRING, UNIQUE): Tax ID for buyer
- ntn_number (STRING, UNIQUE): National Tax Number for buyer
- address (STRING): Buyer address
- contact_person (STRING): Name of contact person (optional)
- email (STRING): Buyer email (optional)
- phone (STRING): Buyer phone (optional)
- city (STRING): Buyer city (optional)
- company_id (INT, FOREIGN KEY): Links to Companies table
- is_active (BOOLEAN): Active/inactive status (default: True)
- created_at (DATETIME): Timestamp when created
- updated_at (DATETIME): Last update timestamp
```

**Data Stored by Company**:
- **Umar Sons**:
  - Al-Abbas Textile Mills (GST-BUYER-001, NTN-BUYER-001)
  - Crescent Textiles Ltd (GST-BUYER-002, NTN-BUYER-002)
- **Makkah Packages**:
  - Royal Textile Industries (GST-BUYER-003, NTN-BUYER-003)
  - Elite Fabric Solutions (GST-BUYER-004, NTN-BUYER-004)

**Relationships**: Many Buyers → 1 Company, Many Orders ← 1 Buyer

**Functionality**:
- CRUD operations (routes/buyer_bp.py)
- Search functionality (BuyersPage.js)
- Search highlighting implementation

**Status**: ✅ Fully functional

---

### 4. **Items Table** ✅
**File Location**: `backend/models.py` (Line 118-138)

**Purpose**: Store product/item information and inventory tracking

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- code (STRING, UNIQUE): Item code (e.g., "PC-1000", "QP-1001")
- name (STRING, UNIQUE): Item name
- description (TEXT): Detailed description (optional)
- unit (STRING): Unit of measurement (default: "PCS", can be "KG", "BOX", etc.)
- unit_price (FLOAT): Price per unit
- quantity_in_stock (FLOAT): Current stock quantity
- company_id (INT, FOREIGN KEY): Links to Companies table
- is_active (BOOLEAN): Active/inactive status (default: True)
- created_at (DATETIME): Timestamp when created
- updated_at (DATETIME): Last update timestamp
```

**Data Stored by Company**:
- **Umar Sons (PC prefix)**:
  - PC-1000: Cardboard Cone - Small ($15.50, 5000 stock)
  - PC-1001: Cardboard Cone - Medium ($22.00, 3000 stock)
  - PC-1002: Cardboard Cone - Large ($28.00, 2000 stock)
- **Makkah Packages (QP prefix)**:
  - QP-1000: Paper Cone - Large ($28.00, 4000 stock)
  - QP-1001: Paper Cone - Extra Large ($35.00, 2500 stock)
  - QP-1002: Paper Cone - Jumbo ($42.00, 1500 stock)

**Relationships**: Many Items → 1 Company, Many OrderItems ← 1 Item

**Functionality**:
- CRUD operations (routes/item_bp.py)
- Stock tracking (deducted on order creation/update)
- Search functionality (ItemsPage.js)
- Search highlighting implementation

**Stock Management**:
- When order is created: Stock is deducted immediately
- When order is updated: Old stock returned, new stock deducted
- When order is deleted: Stock is restored

**Status**: ✅ Fully functional

---

### 5. **Orders Table** ✅
**File Location**: `backend/models.py` (Line 140-166)

**Purpose**: Store order records with financials and status tracking

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- order_number (STRING, UNIQUE): Generated order number
- buyer_id (INT, FOREIGN KEY): Links to Buyers table
- company_id (INT, FOREIGN KEY): Links to Companies table
- order_date (DATETIME): Date of order creation
- subtotal (FLOAT): Total before tax
- tax_rate (FLOAT): Tax percentage (e.g., 17 for 17%)
- tax_amount (FLOAT): Calculated tax (subtotal * tax_rate / 100)
- total_amount (FLOAT): Final amount (subtotal + tax_amount)
- status (STRING): pending, confirmed, shipped, delivered
- notes (TEXT): Additional notes (optional)
- created_at (DATETIME): Timestamp when created
- updated_at (DATETIME): Last update timestamp
```

**Order Number Format**: `{BuyerName}_{YYYY-MM-DD}_ID{AutoIncrement}`
- Example: `Al-Abbas Textile Mills_2026-02-03_ID1000`
- Auto-increment starts at 1000, increments per buyer (not per date)
- Same buyer on different dates: ID1000, ID1001, ID1002, etc.

**Relationships**: Many Orders → 1 Company, Many Orders → 1 Buyer, 1 Order → Many OrderItems

**Financial Calculation**:
```
subtotal = SUM(all order_items.line_total)
tax_amount = subtotal * (tax_rate / 100)
total_amount = subtotal + tax_amount
```

**Functionality**:
- CRUD operations (routes/order_bp.py)
- Stock deduction on creation/update
- Order filtering by status
- Pagination support
- Order generation options:
  - Generate STI (Sales Tax Invoice) PDF
  - Generate Bill (with tax include/exclude options)
  - Record Payment (coming soon)

**Status**: ✅ Fully functional

---

### 6. **OrderItems Table** ✅
**File Location**: `backend/models.py` (Line 168-176)

**Purpose**: Store line items for each order (many-to-many relationship)

**Table Schema**:
```
- id (INT, PRIMARY KEY): Auto-increment
- order_id (INT, FOREIGN KEY): Links to Orders table
- item_id (INT, FOREIGN KEY): Links to Items table
- quantity (FLOAT): Quantity ordered
- unit_price (FLOAT): Price per unit (snapshot at time of order)
- line_total (FLOAT): quantity * unit_price
```

**Data Stored**:
- Multiple items per order
- Captured price at time of order (not current price)
- Line totals used for order subtotal calculation

**Relationships**: Many OrderItems → 1 Order, Many OrderItems → 1 Item

**Functionality**:
- Created when order is created
- Updated when order is modified
- Deleted when order is deleted (cascade delete)

**Status**: ✅ Fully functional

---

## BACKEND ROUTES & API ENDPOINTS

### Authentication Routes (`routes/auth_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/auth/login` | POST | User login with username/password | ❌ (Returns JWT token only) |
| `/api/auth/logout` | POST | User logout | ❌ |
| `/api/auth/me` | GET | Get current user info | ❌ |

### Buyer Routes (`routes/buyer_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/buyers` | GET | List all buyers (paginated, searchable) | ❌ (Read only) |
| `/api/buyers/<id>` | GET | Get specific buyer details | ❌ |
| `/api/buyers` | POST | Create new buyer | ✅ Saves to Buyers table |
| `/api/buyers/<id>` | PUT | Update buyer information | ✅ Updates Buyers table |
| `/api/buyers/<id>` | DELETE | Delete buyer | ✅ Deletes from Buyers table |

**Validation**: company_name, gst_number, ntn_number, address are required

---

### Item Routes (`routes/item_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/items` | GET | List all items (paginated, searchable) | ❌ (Read only) |
| `/api/items/<id>` | GET | Get specific item details | ❌ |
| `/api/items` | POST | Create new item | ✅ Saves to Items table |
| `/api/items/<id>` | PUT | Update item (name, price, stock) | ✅ Updates Items table |
| `/api/items/<id>` | DELETE | Delete item | ✅ Deletes from Items table |

**Validation**: code, name, unit_price are required. Code & name must be unique

---

### Order Routes (`routes/order_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/orders` | GET | List orders (paginated, filterable by status) | ❌ (Read only) |
| `/api/orders/<id>` | GET | Get order details with items | ❌ |
| `/api/orders` | POST | Create new order | ✅ Saves Order + OrderItems + deducts stock |
| `/api/orders/<id>` | PUT | Update order items/status | ✅ Updates Order + OrderItems + adjusts stock |
| `/api/orders/<id>` | DELETE | Delete order | ✅ Deletes Order + OrderItems + restores stock |

**Order Creation Process**:
1. Generate unique order_number based on buyer + date
2. Calculate subtotal, tax, total
3. Create Order record
4. Create OrderItem records for each item
5. Deduct item stock quantities

---

### Report Routes (`routes/report_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/reports/summary` | GET | Dashboard summary (sales, payments, etc.) | ❌ (Read only) |
| `/api/reports/payment-status` | GET | Payment status breakdown | ❌ (Read only) |
| `/api/reports/buyer-wise` | GET | Sales by buyer | ❌ (Read only) |
| `/api/reports/orders/<id>/generate-sti-pdf` | GET | Generate STI PDF | ❌ (Returns PDF file) |

**Note**: Bill PDF generation route NOT yet implemented

---

### Ledger Routes (`routes/ledger_bp.py`)
| Endpoint | Method | Purpose | Saves Data |
|----------|--------|---------|-----------|
| `/api/ledgers/<buyer_id>` | GET | Get buyer ledger/payment history | ❌ (Read only, calculated) |
| `/api/ledgers/<buyer_id>/pdf` | GET | Generate ledger PDF | ❌ (Returns PDF file) |

**Note**: Ledger is read-only, calculated from Orders table

---

## FRONTEND PAGES & WHAT THEY DO

### 1. **LoginPage** (`pages/LoginPage.js`) 
**Purpose**: User authentication
- **Saves**: ✅ Calls `/api/auth/login` with credentials
- **Stores Locally**: 
  - `token`: JWT token
  - `selectedCompanyCode`: User's company (umarsons/makkah_packages)
  - `selectedCompanyId`: Company ID
  - `user`: User object
- **What It Does**:
  - Username/password authentication
  - Company selection
  - Error handling
  - Redirect to Dashboard on success

---

### 2. **DashboardPage** (`pages/DashboardPage.js`)
**Purpose**: Overview/summary of business metrics
- **Saves**: ❌ Read-only
- **Data Fetched**: 
  - Total sales (from Orders)
  - Pending payments (from Orders with pending status)
  - Recent orders (last 30 days)
  - Total buyers
  - Payment status breakdown
- **Displays**:
  - Summary cards with key metrics
  - Charts and visualizations
  - Quick access to other pages

---

### 3. **BuyersPage** (`pages/BuyersPage.js`)
**Purpose**: Manage customer/buyer information
- **Saves**: 
  - ✅ POST: Creates new buyers (→ Buyers table)
  - ✅ PUT: Updates buyer info (→ Buyers table)
  - ✅ DELETE: Deletes buyers (→ Buyers table)
- **Features**:
  - List buyers in paginated table
  - **Search**: Filters by company_name, email, phone (client-side)
  - **Highlight**: Highlights matching search terms
  - Form to add/edit buyers
  - Required fields: company_name, gst_number, ntn_number, address
  - Optional fields: contact_person, email, phone, city
- **Data Displayed**:
  - company_name, email, phone, city, gst_number, ntn_number

---

### 4. **ItemsPage** (`pages/ItemsPage.js`)
**Purpose**: Manage inventory/products
- **Saves**:
  - ✅ POST: Creates new items (→ Items table)
  - ✅ PUT: Updates item info (→ Items table)
  - ✅ DELETE: Deletes items (→ Items table)
- **Features**:
  - List items in paginated table
  - **Search**: Filters by code, name, unit, price, stock (client-side)
  - **Highlight**: Highlights matching search terms
  - Form to add/edit items
  - Required fields: code, name, unit_price
  - Optional fields: description, unit, quantity_in_stock
- **Data Displayed**:
  - code, name, unit, price, quantity_in_stock
- **Stock Tracking**: Shows current stock levels

---

### 5. **OrdersPage** (`pages/OrdersPage.js`)
**Purpose**: Create and manage orders
- **Saves**:
  - ✅ POST: Creates orders (→ Orders table, OrderItems table)
  - ✅ PUT: Updates orders (→ Orders table, OrderItems table)
  - ✅ DELETE: Deletes orders (→ Orders table)
- **Features**:
  - List orders with status filtering
  - Create new orders with multiple items
  - Edit existing orders and items
  - Delete orders with confirmation
  - **Generate Options** (on each order):
    - 🏷️ **STI**: Generate Sales Tax Invoice PDF
    - 📊 **Bill (Including Tax)**: Generate bill with tax
    - 📋 **Bill (Excluding Tax)**: Generate bill without tax
    - 💳 **Record Payment**: Coming soon
  - **Bill Tax Modal**: Appears when Bill is clicked, asks include/exclude
- **Data Displayed**:
  - order_number, buyer_name, order_date, subtotal, tax, total, status
- **Form Fields**:
  - Buyer selection
  - Order date
  - Items with quantity
  - Tax rate
  - Status (pending/confirmed/shipped/delivered)
  - Notes

---

### 6. **InvoicePage** (`pages/InvoicePage.js`)
**Purpose**: View and print Sales Tax Invoices (STI)
- **Saves**: ❌ Read-only
- **Data Source**: Fetches order from `/api/orders/<id>`
- **Features**:
  - Multi-page layout (A4 size)
  - Watermark background
  - Company branding (logo, address, contact)
  - Order details (date, due date, buyer info)
  - Itemized table with quantities and prices
  - Subtotal, Tax breakdown, Total
  - Amount in words
  - Footer on every page
  - **Print Mode**: CSS optimized for printing
  - **Tab Title**: Shows `{order_number}-STI` (e.g., Al-Abbas_2026-02-03_ID1000-STI)
- **Dual Company Support**:
  - Detects company from order
  - Loads correct branding (Umar Sons or Makkah Packages)

---

### 7. **BillPage** (`pages/BillPage.js`)
**Purpose**: View and print Bills with tax options
- **Saves**: ❌ Read-only
- **Data Source**: Fetches order from `/api/orders/<id>`
- **Features**:
  - Multi-page layout (A4 size)
  - **Tax Mode Selection** (via URL params):
    - `?tax=include`: Shows subtotal + tax
    - `?tax=exclude`: Shows subtotal only (no tax breakdown)
  - Watermark background
  - Company branding
  - Order details (buyer info, dates)
  - Itemized table
  - Summary section (subtotal, tax if included, total)
  - Amount in words
  - Footer on every page
  - **Print Mode**: CSS optimized for printing
  - **Tab Title**: Shows `{order_number}-BILL` (e.g., Al-Abbas_2026-02-03_ID1000-BILL)
- **Dual Company Support**: Same as InvoicePage
- **Note**: Currently renders in React, not persisted to PDF on server yet

---

### 8. **LedgerPage** (`pages/LedgerPage.js`)
**Purpose**: View buyer payment history and outstanding amounts
- **Saves**: ❌ Read-only
- **Data Source**: Calculates from Orders table
- **Features**:
  - List all buyers
  - For each buyer, show:
    - Total invoiced (sum of all order totals)
    - Total payments (sum of paid orders - NOT IMPLEMENTED YET)
    - Outstanding balance (calculated difference)
  - Buyer search
  - Click buyer to see detailed transaction history
- **Current Limitation**: Payment records not being saved, so balance calculations incomplete

---

### 9. **ReportsPage** (`pages/ReportsPage.js`)
**Purpose**: Business reports and analytics
- **Saves**: ❌ Read-only
- **Features**:
  - Summary statistics
  - Sales by status (pending/confirmed/shipped/delivered)
  - Sales by buyer
  - Charts and visualizations
  - Export to PDF option

---

## WHAT DATA IS BEING SAVED

### ✅ Being Saved to Database:

1. **Users**: Login credentials, roles, company assignment
2. **Buyers**: Company info, contact details, tax numbers
3. **Items**: Product info, prices, stock quantities
4. **Orders**: Order records, dates, financial totals
5. **OrderItems**: Line items with quantities and prices
6. **Stock Adjustments**: Deducted when orders created, restored when deleted

### ❌ NOT Being Saved to Database:

1. **Payments**: No payment records, just placeholder in UI
2. **Payment Status on Orders**: No way to mark orders as paid/partially paid
3. **Bill PDF Records**: Bills generated in memory, not saved
4. **Search History**: Search highlighting is client-side only
5. **User Activity Logs**: No audit trail of user actions
6. **Ledger Records**: Calculated on-the-fly from Orders

---

---

## DATA FLOW DIAGRAMS

### Order Creation Flow
```
User fills order form (OrdersPage)
    ↓
Selects buyer, items, quantities, tax rate
    ↓
POST /api/orders
    ↓
Backend validates buyer & items exist
    ↓
Calculate subtotal from all items
    ↓
Calculate tax = subtotal * tax_rate / 100
    ↓
Calculate total = subtotal + tax
    ↓
Generate order_number (BuyerName_YYYY-MM-DD_IDxxxx)
    ↓
Save Order record → Orders table
    ↓
For each item:
    - Save OrderItem record → OrderItems table
    - Deduct quantity from Items.quantity_in_stock
    ↓
Commit transaction
    ↓
Return order ID and number
```

### Invoice Viewing Flow
```
User clicks "📊 Bill" button on order (OrdersPage)
    ↓
Modal asks: Include Tax or Exclude Tax?
    ↓
User selects tax option
    ↓
Navigate to /invoice/:orderId (STI) or /bill/:orderId?tax=include/exclude
    ↓
Frontend loads order data via GET /api/orders/:orderId
    ↓
Render invoice/bill page with order data
    ↓
Company branding loads automatically based on order.company_name
    ↓
User can view, print (window.print()), or download
    ↓
Backend can generate PDF via /api/reports/orders/:id/generate-sti-pdf
```

### Stock Management Flow
```
CREATE ORDER:
    ↓
Item stock: 1000 → 1000 - order_quantity
    
UPDATE ORDER (change items):
    ↓
Restore old item stock: 1000 + old_quantity
    ↓
Deduct new item stock: 1000 - new_quantity
    
DELETE ORDER:
    ↓
Restore all item stock: 1000 + order_quantity
```

---

## KEY BUSINESS LOGIC

### Order Number Generation
```python
Format: {buyer_company_name}_{order_date}_{auto_id}
Example: Al-Abbas Textile Mills_2026-02-03_ID1000

Logic:
1. Query all orders for this buyer (all dates)
2. Extract highest ID number (e.g., 1000, 1001, 1002)
3. Next ID = max_id + 1
4. Generate: BuyerName_YYYY-MM-DD_ID{next_id}
```

### Financial Calculations
```python
UPON ORDER CREATION/UPDATE:
    subtotal = SUM(quantity × unit_price for each item)
    tax_amount = subtotal × (tax_rate / 100)
    total_amount = subtotal + tax_amount

BILL DISPLAY (with tax_mode):
    if tax_mode == 'include':
        display_total = subtotal + tax_amount
        show_tax_breakdown = true
    else:  # exclude
        display_total = subtotal  
        show_tax_breakdown = false
```

### Multi-Tenant Isolation
```
Each user has:
    - company_code (umarsons OR makkah_packages)
    - company_id (1 OR 2)

Database separation:
    - instance/umarsons.db
    - instance/makkah_packages.db

Frontend header shows active company

API requests include:
    - X-Company-Code header
    - X-Company-Id header
    - JWT token (contains company_id)

Backend filters by company_id in all queries
```

---

## CURRENT FEATURE STATUS MATRIX

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| **User Auth** | ✅ Complete | ✅ JWT Routes | ✅ Users Table | WORKING |
| **Buyer Management** | ✅ CRUD UI | ✅ Full Routes | ✅ Saved | WORKING |
| **Item Management** | ✅ CRUD UI | ✅ Full Routes | ✅ Saved | WORKING |
| **Order Creation** | ✅ Full Form | ✅ Full Routes | ✅ Saved + Stock | WORKING |
| **Order Modification** | ✅ Edit/Delete | ✅ Full Routes | ✅ Updates + Stock | WORKING |
| **STI Generation** | ✅ Display/Print | ✅ PDF Route | ❌ Not Persisted | PARTIAL |
| **Bill Generation** | ✅ React Display | ❌ No PDF Route | ❌ Not Persisted | PARTIAL |
| **Tax Options (Bill)** | ✅ UI Complete | N/A | N/A | WORKING |
| **Search & Highlight** | ✅ Implemented | N/A | N/A | WORKING |
| **Payment Records** | ⚠️ Placeholder | ❌ No Routes | ❌ No Table | NOT STARTED |
| **Payment Ledger** | ✅ Read-only | ❌ No Endpoints | ❌ Calculated | INCOMPLETE |
| **Order Status Tracking** | ✅ Status Field | ✅ Saved | ✅ Status Column | WORKING |
| **Dual Companies** | ✅ Full Support | ✅ DB Switching | ✅ Separate DBs | WORKING |

---

## FILE STRUCTURE SUMMARY

### Backend Organization
```
backend/
├── models.py              # 339 lines - All table definitions
├── app.py                 # Flask app setup
├── requirements.txt       # Python dependencies
├── utils.py               # Helper functions (company detection, date formatting)
├── routes/
│   ├── auth_bp.py         # Login/logout/token routes
│   ├── buyer_bp.py        # Buyer CRUD routes
│   ├── item_bp.py         # Item CRUD routes
│   ├── order_bp.py        # Order CRUD + stock management
│   ├── dashboard_bp.py    # Summary statistics
│   ├── report_bp.py       # STI PDF generation, reports
│   └── ledger_bp.py       # Ledger read-only endpoints
└── instance/
    ├── umarsons.db        # Umar Sons database (SQLite)
    └── makkah_packages.db # Makkah Packages database (SQLite)
```

### Frontend Organization
```
frontend/src/
├── pages/
│   ├── LoginPage.js          # 150 lines - Authentication
│   ├── DashboardPage.js      # 300 lines - Summary stats
│   ├── BuyersPage.js         # 550 lines - Buyer management + highlight
│   ├── ItemsPage.js          # 500 lines - Item management + highlight
│   ├── OrdersPage.js         # 698 lines - Order CRUD + generate options
│   ├── InvoicePage.js        # 279 lines - STI display/print
│   ├── InvoicePage.css       # Multi-page A4 layout, shared with Bill
│   ├── BillPage.js           # 270 lines - Bill display/print + tax modes
│   ├── LedgerPage.js         # 350 lines - Payment history (read-only)
│   └── ReportsPage.js        # 400 lines - Analytics & charts
├── components/
│   ├── Sidebar.js            # Navigation menu
│   ├── Toast.js              # Notifications
│   ├── ProtectedRoute.js     # Route protection
├── context/
│   ├── AuthContext.js        # User auth state
│   └── ToastContext.js       # Toast notifications state
├── services/
│   └── api.js                # 114 lines - Axios API client
└── utils/
    ├── dateUtils.js          # Date formatting
    ├── numberToWords.js      # Amount in words conversion
    └── exportUtils.js        # PDF export utilities
```

---

## DATABASE RELATIONSHIPS DIAGRAM

```
Companies (1)
    │
    ├─→ (1:N) Users
    ├─→ (1:N) Buyers
    ├─→ (1:N) Items
    └─→ (1:N) Orders
            │
            └─→ (1:N) OrderItems
                    │
                    └─→ (N:1) Items

Buyers (1)
    └─→ (1:N) Orders

Items (1)
    └─→ (1:N) OrderItems
```

---

## VALIDATION RULES

### Buyers Table
- `company_name`: Required, Must be unique
- `gst_number`: Required, Must be unique
- `ntn_number`: Required, Must be unique
- `address`: Required
- `contact_person`: Optional
- `email`: Optional
- `phone`: Optional
- `city`: Optional

### Items Table
- `code`: Required, Must be unique
- `name`: Required, Must be unique
- `unit_price`: Required, Must be > 0
- `quantity_in_stock`: Optional, Default = 0
- `unit`: Optional, Default = "PCS"
- `description`: Optional

### Orders
- `buyer_id`: Required, Must exist in Buyers table
- `items`: Required, At least 1 item
- `quantity`: Must be > 0 and ≤ available stock
- `order_date`: Optional, Default = today
- `tax_rate`: Optional, Default = 0
- `status`: Optional, Default = "pending"

---

## MULTI-TENANT DATABASE STRATEGY

### Configuration
```python
# Uses SQLAlchemy binds for multiple databases
SQLALCHEMY_BINDS = {
    'umarsons': 'sqlite:///instance/umarsons.db',
    'makkah_packages': 'sqlite:///instance/makkah_packages.db'
}
```

### Switching Logic
- User logs in with their company
- Company code stored in localStorage
- All API requests include `X-Company-Code` header
- Backend switches database context for that request
- All queries filtered by `company_id` as well

### Advantages
- Complete data isolation
- Easy backup per company
- Can run on different servers if needed
- Easy to add new companies

---

## NOTES & OBSERVATIONS

1. **Stock Management is Immediate**: Stock deducted when order created, not when confirmed
2. **Order Numbers are Unique Globally**: Each buyer has sequential IDs (ID1000, ID1001, etc.)
3. **No Cascading Deletes in UI**: Buyers can't be deleted if they have orders
4. **Tax Calculation is Flexible**: Tax rate set per order, can be 0%
5. **Ledger is Calculated Not Stored**: Payment history computed from Orders table
6. **Bills vs Invoices**: Both render similarly but Bills have tax mode options
7. **PDF Generation**: STI has backend route, Bills don't (frontend-only currently)
8. **Search is Client-Side**: All searching done in browser, not backend queries

---

## DATA DEPENDENCIES & TABLE LINKAGES

### What Gets Pulled From Where

#### **When Displaying Orders List**
```
OrdersPage loads:
├─ Orders table (all records for company)
│  └─ Fields: order_number, buyer_id, order_date, subtotal, tax_amount, total_amount, status
├─ Links to Buyers table
│  └─ Pulls: company_name (for display)
└─ For each order row shows: order_number, buyer_name, date, subtotal, tax, total, status
```

#### **When Viewing Order Details**
```
OrdersPage → click order:
├─ GET /api/orders/<id>
│  └─ Returns Order record with all fields
├─ Loads associated Buyer info
│  ├─ buyer_id → Buyers table
│  └─ Pulls: company_name, city, ntn_number, gst_number, phone, address
├─ Loads associated OrderItems
│  ├─ order_id → OrderItems table
│  └─ For each OrderItem:
│     ├─ item_id → Items table
│     └─ Pulls: item code, name, unit_price, description
└─ Calculates: subtotal, tax, total from OrderItems
```

#### **When Creating Order**
```
OrdersPage form load:
├─ Populate Buyers dropdown
│  └─ GET /api/buyers → All Buyers for this company
├─ Populate Items dropdown
│  └─ GET /api/items → All Items for this company
└─ When user adds item to order:
   └─ Pulls current item unit_price and stock quantity
```

#### **When Viewing Invoice (STI)**
```
InvoicePage loads:
├─ GET /api/orders/<id>
│  ├─ Order fields: order_number, order_date, tax_rate, status, notes
│  ├─ Buyer info: buyer_id → Buyers table
│  │  └─ Pulls: company_name, city, ntn_number, gst_number, phone
│  └─ OrderItems: order_id → OrderItems table
│     └─ For each item:
│        ├─ item_id → Items table
│        └─ Pulls: code, name, unit
├─ Company branding from localStorage/companyConfig
├─ Calculates display values:
│  ├─ subtotal = SUM(order_items.line_total)
│  ├─ tax = subtotal * order.tax_rate / 100
│  └─ total = subtotal + tax
└─ Renders multi-page layout
```

#### **When Viewing Bill**
```
BillPage loads:
├─ Same as InvoicePage (GET /api/orders/<id>)
├─ Plus URL parameter: ?tax=include or ?tax=exclude
└─ Conditional rendering:
   ├─ if tax=include: Show tax breakdown in summary
   └─ if tax=exclude: Hide tax breakdown, show only subtotal
```

#### **When Viewing Ledger**
```
LedgerPage loads:
├─ GET /api/buyers → All buyers for company
├─ For each buyer:
│  ├─ Query Orders where buyer_id = this_buyer
│  ├─ Calculate total_invoiced = SUM(order.total_amount)
│  ├─ Calculate total_payments = SUM(paid_orders.amount) [NOT YET IMPLEMENTED]
│  └─ Outstanding = total_invoiced - total_payments
└─ Display buyer ledger with calculated values
```

---

## FOREIGN KEY RELATIONSHIPS & DATA RETRIEVAL

### Company → Users (1:Many)
```
Relationship: company_id (FK in Users)
When accessed: 
  - User logs in: company_id stored in JWT token
  - All subsequent requests: backend filters by company_id
  - Frontend: localStorage.selectedCompanyId used for API headers
Data flow:
  Users.company_id → Companies.id
  Result: User only sees their company's data
```

### Company → Buyers (1:Many)
```
Relationship: company_id (FK in Buyers)
When accessed:
  - BuyersPage loads: GET /api/buyers (backend filters by company)
  - OrdersPage buyer dropdown: GET /api/buyers (filtered)
  - When viewing order: buyer_id → Buyers.id
Data flow:
  Buyers.company_id → Companies.id
  Result: Each company has separate buyer list
```

### Company → Items (1:Many)
```
Relationship: company_id (FK in Items)
When accessed:
  - ItemsPage loads: GET /api/items (backend filters by company)
  - OrdersPage item dropdown: GET /api/items (filtered)
  - When viewing order items: item_id → Items.id
Data flow:
  Items.company_id → Companies.id
  Result: Each company has separate product catalog
```

### Company → Orders (1:Many)
```
Relationship: company_id (FK in Orders)
When accessed:
  - OrdersPage loads: GET /api/orders (backend filters by company)
  - InvoicePage/BillPage loads specific order
Data flow:
  Orders.company_id → Companies.id
  Result: Each company has separate order history
```

### Buyer → Orders (1:Many)
```
Relationship: buyer_id (FK in Orders)
When accessed:
  - Create order: Select buyer_id
  - View order: Fetch Buyer via buyer_id
  - Ledger: Calculate totals for each buyer
Data flow:
  Orders.buyer_id → Buyers.id
  Result: Orders linked to buyers for tracking
```

### Order → OrderItems (1:Many)
```
Relationship: order_id (FK in OrderItems)
When accessed:
  - View order details: GET /api/orders/<id> includes items
  - Create order: Create OrderItem for each selected item
  - View invoice/bill: Load all OrderItems for order
Data flow:
  OrderItems.order_id → Orders.id
  Result: Multiple items per order
```

### OrderItems → Items (Many:1)
```
Relationship: item_id (FK in OrderItems)
When accessed:
  - View order details: For each OrderItem, fetch Item data
  - Stock management: Update Items.quantity_in_stock
Data flow:
  OrderItems.item_id → Items.id
  Result: Get item code, name, unit, description for line items
```

---

## DATA ENTRY & LOOKUP PATHS

### Path 1: Create Order
```
User → OrdersPage form
  ↓
Select Buyer (pulls from Buyers table)
  ↓
Select Items (pulls from Items table)
  ↓
Enter quantities & tax rate
  ↓
POST /api/orders
  Backend:
    - Validate buyer exists (Buyers table)
    - For each item: validate stock (Items table)
    - Calculate subtotal from (item quantity × unit_price)
    - Create Order record (Orders table)
    - Create OrderItem records (OrderItems table)
    - Deduct stock (Items table update)
```

### Path 2: View Order in Invoice
```
User → OrdersPage
  ↓
Click 📊 Bill button
  ↓
Modal: Select tax mode (include/exclude)
  ↓
Navigate to /invoice/<order_id>
  ↓
InvoicePage:
  - GET /api/orders/<id>
    - Returns Order + linked Buyer + linked OrderItems
    - For each OrderItem: includes linked Item data
  - Lookup company config (from order.company_name)
  - Render invoice with all data
```

### Path 3: Update Order Stock
```
When Order is Created:
  Item.quantity_in_stock -= order_item.quantity
  
When Order is Updated (change items):
  For old items: Item.quantity_in_stock += old_quantity
  For new items: Item.quantity_in_stock -= new_quantity
  
When Order is Deleted:
  Item.quantity_in_stock += order_item.quantity
```

### Path 4: Calculate Ledger Balance
```
LedgerPage:
  For each Buyer:
    total_invoiced = 0
    GET /api/orders where buyer_id = this_buyer
      For each order:
        total_invoiced += order.total_amount
    
    total_payments = 0 (NO PAYMENT RECORDS YET)
    
    outstanding = total_invoiced - total_payments
```

---

## DATA LINKAGE VISUAL MAP

```
┌─────────────┐
│  Companies  │
│  (umarsons, │
│  makkah_pkg)│
└──────┬──────┘
       │
       ├──────────────────────┬──────────────────────┬──────────────────────┐
       │                      │                      │                      │
       ▼                      ▼                      ▼                      ▼
   ┌────────┐           ┌────────┐            ┌────────┐            ┌────────┐
   │ Users  │           │ Buyers │            │ Items  │            │Orders  │
   │        │           │        │            │        │            │        │
   │ ● id   │           │ ● id   │            │ ● id   │            │ ● id   │
   │ ● name │   ◄───┐   │ ● name │   ◄───┐    │ ● code │   ◄───┐    │ ● no.  │
   │ ● role │       │   │ ● gst# │       │    │ ● name │       │    │ ● amt  │
   │ ● coid*├─┐     │   │ ● coid*├─┐     │    │ ● coid*├─┐     │    │ ● coid*├─┐
   └────────┘ │     │   └────────┘ │     │    └────────┘ │     │    └────┬───┘ │
              │     │              │     │               │     │         │     │
              │     │              │     │               │     │         │     │
              └─────┴──────────────┴─────┘               │     │         │     │
                    (coid = company_id)                  │     │         │     │
                                                         │     │         │     │
                                                         │     │         │     │
                                                    ┌────▼─────▼─────┐   │     │
                                                    │  OrderItems    │   │     │
                                                    │                │   │     │
                                                    │  ● order_id*───┼───┘     │
                                                    │  ● item_id*────┼─────────┘
                                                    │  ● quantity    │
                                                    │  ● line_total  │
                                                    └────────────────┘

Legend:
  * = Foreign Key (links to parent table)
  ◄─── = Data pulled from this table
```

---

## WHAT EACH PAGE RETRIEVES FROM DATABASE

### 1. **LoginPage**
- Retrieves: Users table (queries by username)
- Returns: user data + JWT token
- Updates: None
- Linked to: Companies table (via company_id)

### 2. **DashboardPage**
- Retrieves:
  - Orders table: SUM totals, count by status
  - Companies table: company info
- Returns: Summary statistics
- Updates: None
- Calculated from: Orders, Buyers count

### 3. **BuyersPage**
- Retrieves: Buyers table (all records for company)
- Returns: List of buyers
- Updates: Create/Update/Delete Buyers
- Related data: Companies (1:1 per buyer)

### 4. **ItemsPage**
- Retrieves: Items table (all records for company)
- Returns: List of items with stock levels
- Updates: Create/Update/Delete Items
- Related data: Companies (1:1 per item)

### 5. **OrdersPage**
- Retrieves:
  - Orders table (paginated)
  - Buyers table (for dropdown)
  - Items table (for dropdown)
- Returns: Order list + buyer/item options
- Updates: Create/Update/Delete Orders + OrderItems + Items stock
- Related data:
  - Buyers (1:1 per order)
  - Items (1:many per order via OrderItems)

### 6. **InvoicePage (STI)**
- Retrieves: 
  - Orders table: Full order record
  - Buyers table: Buyer linked to order
  - OrderItems table: All items in order
  - Items table: Item details (code, name)
- Returns: Formatted invoice
- Updates: None
- Linked by: order_id → OrderItems → Items

### 7. **BillPage**
- Retrieves: Same as InvoicePage
- Returns: Formatted bill (with/without tax)
- Updates: None
- Linked by: order_id → OrderItems → Items

### 8. **LedgerPage**
- Retrieves:
  - Buyers table: All buyers
  - Orders table: For each buyer
- Returns: Buyer ledger with balance
- Updates: None
- Calculations: SUM(order amounts) per buyer

### 9. **ReportsPage**
- Retrieves:
  - Orders table: All orders for analysis
  - Buyers table: For grouping
- Returns: Reports & charts
- Updates: None
- Calculated from: Orders data

---

## SPECIFIC DATA ENTRY & LOOKUP EXAMPLES

### Example 1: Creating an Order
```
Input from user:
  - Select Buyer: "Al-Abbas Textile Mills"
  - Select Item: "PC-1000" qty: 100
  - Tax Rate: 17%

Backend process:
  1. Buyer lookup: SELECT * FROM buyers WHERE company_name = "Al-Abbas Textile Mills"
     → Gets buyer_id = 1, company_id = 1
  
  2. Item lookup: SELECT * FROM items WHERE code = "PC-1000"
     → Gets item_id = 1, unit_price = 15.50, stock = 5000
  
  3. Validate stock: 5000 >= 100 ✓
  
  4. Calculate: line_total = 100 × 15.50 = 1550
                 subtotal = 1550
                 tax = 1550 × (17/100) = 263.50
                 total = 1550 + 263.50 = 1813.50
  
  5. Generate order_number:
     - Query: SELECT order_number FROM orders WHERE buyer_id = 1
     - Found: Al-Abbas_2026-02-02_ID1000, Al-Abbas_2026-02-02_ID1001
     - Next: Al-Abbas_2026-02-03_ID1002
  
  6. Insert into Orders table:
     INSERT INTO orders VALUES (
       order_number='Al-Abbas_2026-02-03_ID1002',
       buyer_id=1, company_id=1, subtotal=1550,
       tax_rate=17, tax_amount=263.50, total_amount=1813.50
     )
  
  7. Insert into OrderItems table:
     INSERT INTO order_items VALUES (
       order_id=15, item_id=1, quantity=100,
       unit_price=15.50, line_total=1550
     )
  
  8. Update Items stock:
     UPDATE items SET quantity_in_stock = 5000 - 100 = 4900
     WHERE id = 1
```

### Example 2: Viewing Order Invoice
```
User action: Click "📊 Bill" on order ID 15

Frontend:
  1. Modal appears: Select tax mode
     User chooses: "Including Tax"
  2. Navigate: /invoice/15?tax=include
  
Backend:
  1. GET /api/orders/15
     SELECT * FROM orders WHERE id = 15
     → Returns all order fields
  
  2. Join with Buyers:
     SELECT * FROM buyers WHERE id = 1
     → Returns buyer_name, city, gst#, ntn#, phone
  
  3. Join with OrderItems:
     SELECT * FROM order_items WHERE order_id = 15
     → Returns item list
  
  4. For each OrderItem, join with Items:
     SELECT * FROM items WHERE id = 1
     → Returns item code, name, unit
  
Frontend rendering:
  1. Load company config (from order.company_name = "UmarSons")
  2. Get branding: logo, watermark, address, phone
  3. Render invoice with:
     - Order number, date, buyer info
     - Itemized table
     - Subtotal = 1550
     - Tax = 263.50 (since tax mode = include)
     - Total = 1813.50
```

### Example 3: Updating Order (changing items)
```
User action: Edit order, remove item 1, add 50 units of PC-1001

Backend:
  1. Fetch old order items:
     SELECT * FROM order_items WHERE order_id = 15
     → item_id=1, quantity=100
  
  2. Restore old item stock:
     UPDATE items SET quantity_in_stock = 4900 + 100 = 5000
     WHERE id = 1
  
  3. Delete old OrderItems:
     DELETE FROM order_items WHERE order_id = 15
  
  4. Check new item stock:
     SELECT quantity_in_stock FROM items WHERE id = 2 (PC-1001)
     → stock = 3000, requested = 50 ✓
  
  5. Calculate new total:
     line_total = 50 × 22.00 = 1100
     subtotal = 1100
     tax = 1100 × 17/100 = 187
     total = 1287
  
  6. Insert new OrderItem:
     INSERT INTO order_items VALUES (
       order_id=15, item_id=2, quantity=50,
       unit_price=22.00, line_total=1100
     )
  
  7. Deduct new item stock:
     UPDATE items SET quantity_in_stock = 3000 - 50 = 2950
     WHERE id = 2
  
  8. Update Order totals:
     UPDATE orders SET subtotal=1100, tax_amount=187, total_amount=1287
     WHERE id = 15
```

---

## SUMMARY TABLE: WHERE DATA COMES FROM

| Frontend Component | Data Retrieved From | Foreign Key Link | Purpose |
|-------------------|-------------------|-----------------|---------|
| BuyersPage | Buyers table | company_id | Display buyer list |
| ItemsPage | Items table | company_id | Display product catalog |
| OrdersPage list | Orders table | company_id | Show all orders |
| OrdersPage form | Buyers, Items tables | company_id | Populate dropdowns |
| InvoicePage | Orders, OrderItems, Items, Buyers | order_id, item_id, buyer_id | Render invoice |
| BillPage | Orders, OrderItems, Items, Buyers | order_id, item_id, buyer_id | Render bill |
| LedgerPage | Orders, Buyers tables | buyer_id | Calculate balance |
| ReportsPage | Orders, Buyers, Items tables | Multiple FKs | Generate reports |
| DashboardPage | Orders, Buyers, Items tables | company_id | Show summary stats |





