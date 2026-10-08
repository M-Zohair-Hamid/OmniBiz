#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DB_DIR="$BACKEND/instance"
VENV_DIR="$ROOT/.venv"
VENV_PY="$VENV_DIR/bin/python"

echo ""
echo "============================================="
echo "  Business Management System"
echo "  Version: 1.0"
echo "============================================="
echo ""

# --- Check Python3 exists (needed to create venv if missing) ---
if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] python3 not found. Install Python 3.11+ first."
    exit 1
fi

# --- Ensure venv exists ---
echo "=== Environment Check ==="
if [[ ! -x "$VENV_PY" ]]; then
    echo "Virtual environment not found. Creating .venv ..."
    python3 -m venv "$VENV_DIR"
    if [[ ! -x "$VENV_PY" ]]; then
        echo "[ERROR] Failed to create virtual environment."
        exit 1
    fi
    echo "[OK] Virtual environment created"

    echo "Installing backend dependencies (first run)..."
    if [[ -f "$BACKEND/requirements.txt" ]]; then
        "$VENV_PY" -m pip install --upgrade pip --quiet
        "$VENV_PY" -m pip install -r "$BACKEND/requirements.txt"
        if [[ $? -ne 0 ]]; then
            echo "[ERROR] Failed to install backend dependencies."
            exit 1
        fi
        echo "[OK] Backend dependencies installed"
    else
        echo "[WARN] requirements.txt not found in backend/, skipping dependency install"
    fi
else
    echo "[OK] Virtual environment found"
fi
echo "[OK] Python (.venv): $VENV_PY"

# --- Ensure instance dir exists ---
if [[ ! -d "$DB_DIR" ]]; then
    echo "Creating instance directory..."
    mkdir -p "$DB_DIR"
fi

echo ""
echo "=== Database Setup ==="
COMPANY_DB="$DB_DIR/company.db"

if [[ ! -f "$COMPANY_DB" ]]; then
    echo "Initializing company database..."
    (cd "$BACKEND" && "$VENV_PY" -c "from models import db, init_db; from app import app; app.app_context().push(); init_db('company')")
    if [[ $? -ne 0 ]]; then
        echo "[ERROR] Failed to create company database"
        exit 1
    fi
    echo "[OK] Company database created"
else
    echo "[OK] Company database exists"
fi

echo ""
echo "=== Cleaning Cache ==="
find "$BACKEND" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null
echo "[OK] Python cache cleared"

echo ""
echo "=== Starting Backend (Flask @5000) ==="
(cd "$BACKEND" && "$VENV_PY" app.py) &
BACKEND_PID=$!
echo "[OK] Backend server starting... (PID $BACKEND_PID)"
sleep 4

echo ""
echo "=== Starting Frontend (React @3000) ==="
if [[ ! -d "$FRONTEND/node_modules" ]]; then
    echo "Installing frontend dependencies (first time)..."
    (cd "$FRONTEND" && BROWSER=none npm install && BROWSER=none npm start) &
else
    (cd "$FRONTEND" && BROWSER=none npm start) &
fi
FRONTEND_PID=$!
echo "[OK] Frontend server starting... (PID $FRONTEND_PID)"
echo "Waiting for React server to initialize..."
sleep 8

echo "Opening browser with fresh session..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000/?clear=true" >/dev/null 2>&1
elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000/?clear=true" >/dev/null 2>&1
else
    echo "Could not auto-open browser. Please navigate to http://localhost:3000/?clear=true manually"
fi

echo ""
echo "============================================="
echo "  System Status"
echo "============================================="
echo ""
echo "Companies Configured:"
echo "  - Business Company (ORG) -> $COMPANY_DB"
echo ""
echo "Active Services:"
echo "  - Backend API  -> http://localhost:5000"
echo "  - Frontend UI  -> http://localhost:3000"
echo ""
echo "Features Available:"
echo "  - Dashboard"
echo "  - Buyers Management"
echo "  - Items and Inventory"
echo "  - Orders (with auto inventory deduction)"
echo "  - Ledger"
echo "  - Reports"
echo ""
echo "Press Enter to stop all services and exit..."

cleanup() {
    echo ""
    echo "Stopping services..."
    kill "$BACKEND_PID" >/dev/null 2>&1
    kill "$FRONTEND_PID" >/dev/null 2>&1
    wait "$BACKEND_PID" 2>/dev/null
    wait "$FRONTEND_PID" 2>/dev/null
    echo "All services stopped."
}

trap cleanup EXIT
read -r _