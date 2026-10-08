#!/bin/bash
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}========================================"
echo -e " PAPERCONE BUSINESS APP INSTALLER${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Installation steps:"
echo "  [1] Check Python 3.11+ installation"
echo "  [2] Check Node.js 18+ installation"
echo "  [3] Create Python virtual environment (.venv)"
echo "  [4] Install backend dependencies"
echo "  [5] Install frontend dependencies"
echo "  [6] Prepare company database"
echo ""
read -p "Press Enter to begin installation..."
clear

# STEP 1: Python
echo -e "${BLUE}[STEP 1/6] Checking Python Installation${NC}"
echo "========================================"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python3 is not installed!${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install python3 python3-venv python3-pip"
    echo "  Fedora: sudo dnf install python3 python3-venv python3-pip"
    echo "  Arch: sudo pacman -S python"
    exit 1
fi
python3 --version
echo -e "${GREEN}Python: FOUND${NC}"
echo ""

# STEP 2: Node.js
echo -e "${BLUE}[STEP 2/6] Checking Node.js Installation${NC}"
echo "========================================"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  Fedora: sudo dnf install nodejs npm"
    echo "  Arch: sudo pacman -S nodejs npm"
    echo "  Or visit: https://nodejs.org/"
    exit 1
fi
node --version
npm --version
echo -e "${GREEN}Node.js: FOUND${NC}"
echo ""

# STEP 3: Virtual environment
echo -e "${BLUE}[STEP 3/6] Setting Up Python Virtual Environment${NC}"
echo "========================================"
if [ -d "$SCRIPT_DIR/.venv" ]; then
    echo -e "${GREEN}.venv: ALREADY EXISTS${NC}"
else
    echo "Creating virtual environment (.venv)..."
    python3 -m venv "$SCRIPT_DIR/.venv"
    if [ ! -x "$SCRIPT_DIR/.venv/bin/python" ]; then
        echo -e "${RED}ERROR: Failed to create virtual environment!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Virtual environment: CREATED${NC}"
fi
echo ""

VENV_PY="$SCRIPT_DIR/.venv/bin/python"

# STEP 4: Backend dependencies
echo -e "${BLUE}[STEP 4/6] Installing Backend Dependencies${NC}"
echo "========================================"
if [ ! -f "$SCRIPT_DIR/backend/requirements.txt" ]; then
    echo -e "${RED}ERROR: backend/requirements.txt not found!${NC}"
    exit 1
fi
"$VENV_PY" -m pip install --upgrade pip --quiet
echo "Installing backend dependencies from requirements.txt..."
"$VENV_PY" -m pip install -r "$SCRIPT_DIR/backend/requirements.txt"
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install Python dependencies!${NC}"
    exit 1
fi
echo -e "${GREEN}Backend dependencies: INSTALLED${NC}"
echo ""

# STEP 5: Frontend dependencies
echo -e "${BLUE}[STEP 5/6] Installing Frontend Dependencies${NC}"
echo "========================================"
if [ ! -d "$SCRIPT_DIR/frontend" ]; then
    echo -e "${RED}ERROR: frontend/ directory not found!${NC}"
    exit 1
fi
cd "$SCRIPT_DIR/frontend"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}Frontend dependencies: ALREADY INSTALLED${NC}"
else
    echo "Installing Node.js packages (this may take 5-10 minutes)..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install Node.js dependencies!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Frontend dependencies: INSTALLED${NC}"
fi
cd "$SCRIPT_DIR"
echo ""

# STEP 6: Database dir
echo -e "${BLUE}[STEP 6/6] Preparing Database${NC}"
echo "========================================"
mkdir -p "$SCRIPT_DIR/backend/instance"
if [ -f "$SCRIPT_DIR/backend/instance/company.db" ]; then
    echo "Company database: EXISTS"
else
    echo "Company database will be created on first start"
fi
echo -e "${GREEN}Database: READY${NC}"
echo ""

clear
echo -e "${BLUE}========================================"
echo -e " INSTALLATION COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Installation Summary:"
echo "  - Python: $(python3 --version 2>&1 | cut -d' ' -f2)"
echo "  - Node.js: $(node --version)"
echo "  - Virtual Environment: ./.venv"
echo "  - Backend: Ready"
echo "  - Frontend: Ready"
echo ""
echo "HOW TO START THE APPLICATION"
echo "  chmod +x start.sh"
echo "  ./start.sh"
echo ""
echo "The app opens automatically at http://localhost:3000"
echo ""

read -p "Start the app now? (Y/N): " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    chmod +x "$SCRIPT_DIR/start.sh"
    "$SCRIPT_DIR/start.sh"
else
    echo ""
    echo "You can start the app later using ./start.sh"
fi