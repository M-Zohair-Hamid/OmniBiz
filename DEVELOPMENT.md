# Development Guide - Project-CS-L

**Last Updated:** January 27, 2026  
**Current State:** Clean Base (Git commit: 0167fdff)

## 📋 Project Overview

Multi-company inventory management system for textile paper cones.

**Companies:**
- UmarSons (PC)
- Makkah Packages (QP)

**Technologies:**
- Backend: Flask 3.0 (Python)
- Frontend: React 18 (JavaScript)
- Database: SQLite (multi-database support)
- Authentication: JWT tokens

---

## 🗂️ Project Structure

```
Project-CS-L/
├── backend/
│   ├── app.py                    # Flask application entry point
│   ├── models.py                 # Database models (Order, Item, Buyer, etc.)
│   ├── utils.py                  # Utility functions
│   ├── requirements.txt           # Python dependencies
│   ├── routes/                   # Flask blueprints
│   │   ├── auth_bp.py           # Authentication routes
│   │   ├── buyer_bp.py          # Buyers management
│   │   ├── item_bp.py           # Items/inventory
│   │   ├── order_bp.py          # Orders management
│   │   ├── dashboard_bp.py      # Dashboard data
│   │   ├── ledger_bp.py         # Ledger reports
│   │   └── report_bp.py         # Analytics reports
│   ├── setup_*.py               # Database initialization scripts
│   └── instance/                # SQLite database files (local)
│       ├── umarsons.db
│       └── makkah_packages.db
│
├── frontend/
│   ├── public/
│   │   ├── index.html           # HTML entry point
│   │   └── favicon.ico
│   ├── src/
│   │   ├── index.js             # React entry point
│   │   ├── App.js               # Main app component
│   │   ├── components/          # Reusable components
│   │   │   ├── Sidebar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── Toast.js
│   │   ├── context/             # React Context (state management)
│   │   │   ├── AuthContext.js
│   │   │   └── ToastContext.js
│   │   ├── pages/               # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── BuyersPage.js
│   │   │   ├── ItemsPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── LedgerPage.js
│   │   │   └── ReportsPage.js
│   │   ├── services/            # API calls
│   │   │   └── api.js
│   │   └── utils/               # Utility functions
│   │       ├── dateUtils.js
│   │       └── exportUtils.js
│   ├── package.json             # Node.js dependencies
│   └── tailwind.config.js       # Tailwind CSS configuration
│
├── assets/
│   └── templates/               # Invoice templates
│       ├── US n MP.svg         # Main template from Canva
│       └── sample.html         # Example HTML template
│
├── start.ps1                   # PowerShell startup script
├── start.sh                    # Bash startup script
├── stop.ps1                    # PowerShell stop script
├── INSTALLER.bat               # Windows installer
├── INSTALLER.sh                # Linux/Mac installer
├── README.md                   # User documentation
└── DEVELOPMENT.md             # This file
```

---

## 🚀 Getting Started (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ (LTS)
- Git

### Setup

1. **Clone repository**
```bash
git clone <repo-url>
cd Project-CS-L
```

2. **Backend setup**
```bash
cd backend
pip install -r requirements.txt
python setup_umarsons.py      # Initialize UmarSons database
python setup_databases.py     # Initialize Makkah Packages database
python app.py                 # Start Flask (runs on http://localhost:5000)
```

3. **Frontend setup (new terminal)**
```bash
cd frontend
npm install                   # First time only
npm start                     # Start React (runs on http://localhost:3000)
```

4. **Access application**
- Open browser: http://localhost:3000
- Click "UmarSons" or "Makkah Packages" to login

---

## 📊 Database Schema

### Core Tables

**Companies**
```
id | name | code | address | gst_number | ntn
```

**Buyers**
```
id | company_id | company_name | contact_person | phone | email | address | created_at
```

**Items**
```
id | company_id | name | category | unit_price | stock | created_at
```

**Orders**
```
id | company_id | order_number | buyer_id | order_date | total_amount | status | tax_rate | notes
```

**OrderItems**
```
id | order_id | item_id | quantity | unit_price | line_total
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with company
- `POST /api/auth/logout` - Logout

### Buyers
- `GET /api/buyers` - List all buyers (paginated)
- `POST /api/buyers` - Create buyer
- `PUT /api/buyers/<id>` - Update buyer
- `DELETE /api/buyers/<id>` - Delete buyer

### Items
- `GET /api/items` - List all items (paginated)
- `POST /api/items` - Create item
- `PUT /api/items/<id>` - Update item
- `DELETE /api/items/<id>` - Delete item

### Orders
- `GET /api/orders` - List all orders (paginated)
- `GET /api/orders/<id>` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/<id>` - Update order
- `DELETE /api/orders/<id>` - Delete order

### Reports & Analytics
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/reports/ledger` - Ledger data
- `GET /api/reports/sales` - Sales analytics

---

## 🔄 Multi-Company Architecture

### Database Isolation
- Separate SQLite databases per company
- `umarsons.db` - UmarSons company data
- `makkah_packages.db` - Makkah Packages data

### Company Switching
1. User selects company on login
2. JWT token includes `company_id`
3. Backend middleware routes to correct database
4. All queries isolated to company database

### Implementation
See `backend/app.py` - `before_request()` function handles database switching.

---

## 🛠️ Development Tasks

### Adding New Feature
1. **Backend:**
   - Add database model if needed (models.py)
   - Create blueprint route file (routes/)
   - Register blueprint (app.py)

2. **Frontend:**
   - Create page component (src/pages/)
   - Add API calls (src/services/api.js)
   - Add route (App.js)

### Database Migrations
Currently handled manually:
1. Update models.py
2. Delete old database files (instance/*.db)
3. Run setup scripts to recreate

### Testing
```bash
# Backend - run from backend/ directory
python -m pytest

# Frontend - run from frontend/ directory
npm test
```

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process on port 5000 or 3000
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

### Database Errors
```bash
# Delete corrupted databases and recreate
cd backend
rm instance/*.db
python setup_umarsons.py
python setup_databases.py
```

### Frontend Not Showing
1. Check backend is running: http://localhost:5000/api/health
2. Check console for errors (F12)
3. Clear browser cache (Ctrl+Shift+Delete)

---

## 📝 Environment Variables

### Backend (.env)
```
JWT_SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🎨 UI/UX Guidelines

- **Color Scheme:** Blue/purple gradient
- **Components:** Glassmorphism design with transparency
- **Icons:** React Icons library
- **Styling:** Tailwind CSS utility classes
- **Responsive:** Mobile-first approach

---

## 📚 Next Steps

### Invoicing System
- **Path:** `assets/templates/` contains SVG template
- **Current:** Sample HTML template for reference
- **To Implement:**
  1. Finalize SVG template with labeled fields
  2. Create backend route for invoice generation
  3. Add frontend modal for preview/download
  4. Support PDF export

### Reports Enhancement
- Add more analytics visualizations
- Export to Excel/PDF
- Scheduled report generation

### Mobile App
- Consider React Native port
- Offline support
- Push notifications

---

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET_KEY` in production
- [ ] Enable HTTPS in production
- [ ] Validate all user inputs
- [ ] Implement rate limiting
- [ ] Add CORS restrictions
- [ ] Regular database backups
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (React escapes by default)

---

## 📞 Support & Resources

- **Backend Docs:** Flask documentation at https://flask.palletsprojects.com
- **Frontend Docs:** React docs at https://react.dev
- **Database:** SQLite docs at https://www.sqlite.org/docs.html

---

## 📋 Git Workflow

```bash
# Create feature branch
git checkout -b feature/invoice-system

# Make changes and commit
git add .
git commit -m "Add invoice generation feature"

# Push and create PR
git push origin feature/invoice-system
```

---

**Project Maintainer:** Development Team  
**Last Updated:** January 27, 2026
