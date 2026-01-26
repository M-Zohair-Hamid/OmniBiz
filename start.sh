#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DB_DIR="$BACKEND/instance"
mkdir -p "$DB_DIR"

echo ""
echo "╔════════════════════════════════════╗"
echo "║      Multi-Company Application      ║"
echo "╚════════════════════════════════════╝"
echo ""
echo "Select a company to start:"
echo "  1) UmarSons (PC)"
echo "  2) Makkah Packages (QP)"
read -p "Enter choice (1 or 2): " company_choice

case $company_choice in
  1)
    selected_company="UmarSons"
    company_code="PC"
    ;;
  2)
    selected_company="Makkah Packages"
    company_code="QP"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "Starting: $selected_company (Code: $company_code)"
echo ""

PYTHON="${PYTHON:-}"
if [[ -z "$PYTHON" ]]; then
  if [[ -x "$ROOT/.venv/bin/python" ]]; then
    PYTHON="$ROOT/.venv/bin/python"
  else
    PYTHON="python3"
  fi
fi

echo "=== Checking databases ==="
if [[ ! -f "$DB_DIR/umarsons.db" ]]; then
  echo "Creating UmarSons database..."
  (cd "$BACKEND" && "$PYTHON" setup_umarsons.py)
fi

if [[ ! -f "$DB_DIR/makkah_packages.db" ]]; then
  echo "Creating Makkah Packages database..."
  (cd "$BACKEND" && "$PYTHON" setup_databases.py)
fi
echo ""

echo "=== Starting services ==="
echo "Backend (Flask @5000)"
(cd "$BACKEND" && FLASK_APP=app.py "$PYTHON" -m flask run --host=0.0.0.0 --port=5000) &
BACKEND_PID=$!

echo "Frontend (React @3000)"
(cd "$FRONTEND" && npm install && npm start) &
FRONTEND_PID=$!

echo ""
echo "╔════════════════════════════════════╗"
echo "║    Services Starting...             ║"
echo "║                                    ║"
echo "║  Company: $selected_company" | head -c 40
echo "║  Backend: http://localhost:5000    ║"
echo "║  Frontend: http://localhost:3000   ║"
echo "║                                    ║"
echo "║  Press Ctrl+C to stop all          ║"
echo "╚════════════════════════════════════╝"
echo ""

wait $BACKEND_PID $FRONTEND_PID
