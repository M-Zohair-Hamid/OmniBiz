#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DB_DIR="$BACKEND/instance"

echo ""
echo "============================================="
echo "  Multi-Company Inventory Management System"
echo "  Version: 1.0"
echo "============================================="
echo ""

if [[ ! -d "$DB_DIR" ]]; then
  echo "Creating instance directory..."
  mkdir -p "$DB_DIR"
fi

echo "=== Environment Check ==="

# Auto-activate venv if it exists
if [[ -d "$ROOT/venv" ]]; then
  echo "Activating virtual environment..."
  source "$ROOT/venv/bin/activate"
  echo "[OK] Virtual environment activated"
fi

PYTHON="${PYTHON:-}"
if [[ -z "$PYTHON" ]]; then
  if [[ -x "$ROOT/venv/bin/python" ]]; then
    PYTHON="$ROOT/venv/bin/python"
  elif [[ -x "$ROOT/.venv/bin/python" ]]; then
    PYTHON="$ROOT/.venv/bin/python"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON="python"
  else
    echo "[ERROR] Python not found. Please install Python 3.11+ and add to PATH."
    exit 1
  fi
fi
echo "[OK] Python: $PYTHON"

echo ""
echo "=== Database Setup ==="
COMPANY_DB="$DB_DIR/company.db"

if [[ ! -f "$COMPANY_DB" ]]; then
  echo "Initializing company database..."
  (cd "$BACKEND" && "$PYTHON" -c "from models import db, init_db; from app import app; app.app_context().push(); init_db('company')") || { echo "[ERROR] Failed to create company database"; exit 1; }
  echo "[OK] Company database created"
else
  echo "[OK] Company database exists"
fi

echo ""
echo "=== Cleaning Cache ==="
find "$BACKEND" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
echo "[OK] Python cache cleared"

echo ""
echo "=== Starting Backend (Flask @5000) ==="
(cd "$BACKEND" && "$PYTHON" app.py) &
BACKEND_PID=$!
echo "[OK] Backend server starting..."
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
echo "[OK] Frontend server starting..."
echo "Waiting for React server to initialize..."
sleep 8

echo "Opening browser with fresh session..."
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3000/?clear=true" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:3000/?clear=true" >/dev/null 2>&1 || true
else
  echo "Could not auto-open browser. Please navigate to http://localhost:3000/?clear=true manually"
fi

echo ""
echo "============================================="
echo "  System Status"
echo "============================================="
echo ""
echo "Companies Configured:"
echo "  • Business Company (ORG) -> $COMPANY_DB"
echo ""
echo "Active Services:"
echo "  • Backend API  -> http://localhost:5000"
echo "  • Frontend UI  -> http://localhost:3000"
echo ""
echo "Features Available:"
echo "  ✓ Dashboard"
echo "  ✓ Buyers Management"
echo "  ✓ Items and Inventory"
echo "  ✓ Orders (with auto inventory deduction)"
echo "  ✓ Ledger"
echo "  ✓ Reports"
echo ""
echo "Press Enter to stop all services and exit..."

cleanup() {
  echo ""
  echo "Stopping services..."
  kill "$BACKEND_PID" >/dev/null 2>&1 || true
  kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  pkill -f "python" >/dev/null 2>&1 || true
  pkill -f "node" >/dev/null 2>&1 || true
  echo "All services stopped."
}

trap cleanup EXIT
read -r _
