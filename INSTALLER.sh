#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e " PAPERCONE BUSINESS APP INSTALLER${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "This installer will set up everything needed to run the application."
echo ""
echo "Installation steps:"
echo "  [1] Check Python 3.11+ installation"
echo "  [2] Check Node.js 18+ installation"
echo "  [3] Create Python virtual environment (.venv)"
echo "  [4] Install backend dependencies (Flask, SQLAlchemy, etc.)"
echo "  [5] Install frontend dependencies (React, Tailwind, etc.)"
echo "  [6] Initialize multi-company databases"
echo ""
echo "Estimated time: 10-15 minutes"
echo ""
read -p "Press Enter to begin installation..."
clear

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ========================================
# STEP 1: Check Python Installation
# ========================================
echo -e "${BLUE}[STEP 1/6] Checking Python Installation${NC}"
echo "========================================"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python3 is not installed!${NC}"
    echo ""
    echo "Please install Python 3.11 or higher:"
    echo "  Ubuntu/Debian: sudo apt-get install python3 python3-venv python3-pip"
    echo "  Fedora: sudo dnf install python3 python3-venv python3-pip"
    echo "  Arch: sudo pacman -S python"
    echo ""
    exit 1
else
    python3 --version
    echo -e "${GREEN}Python: FOUND${NC}"
fi
echo ""

# ========================================
# STEP 2: Check Node.js Installation
# ========================================
echo -e "${BLUE}[STEP 2/6] Checking Node.js Installation${NC}"
echo "========================================"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js 18+ LTS:"
    echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  Fedora: sudo dnf install nodejs npm"
    echo "  Arch: sudo pacman -S nodejs npm"
    echo "  Or visit: https://nodejs.org/"
    echo ""
    exit 1
else
    node --version
    npm --version
    echo -e "${GREEN}Node.js: FOUND${NC}"
fi
echo ""

# ========================================
# STEP 3: Create Python Virtual Environment
# ========================================
echo -e "${BLUE}[STEP 3/6] Setting Up Python Virtual Environment${NC}"
echo "========================================"
if [ -d "$SCRIPT_DIR/.venv" ]; then
    echo "Virtual environment already exists"
    echo -e "${GREEN}.venv: ALREADY EXISTS${NC}"
else
    echo "Creating virtual environment (.venv)..."
    python3 -m venv "$SCRIPT_DIR/.venv"
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to create virtual environment!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Virtual environment: CREATED${NC}"
fi
echo ""

# Activate virtual environment
source "$SCRIPT_DIR/.venv/bin/activate"

# ========================================
# STEP 4: Install Backend Dependencies
# ========================================
echo -e "${BLUE}[STEP 4/6] Installing Backend Dependencies${NC}"
echo "========================================"
cd "$SCRIPT_DIR/backend"
echo "Installing/Updating pip..."
pip install --upgrade pip --quiet

echo "Installing backend dependencies from requirements.txt..."
echo "  - Flask 3.0.0 (Web framework)"
echo "  - Flask-CORS 4.0.0 (Cross-Origin support)"
echo "  - Flask-JWT-Extended 4.5.3 (Authentication)"
echo "  - Flask-SQLAlchemy 3.1.1 (Database ORM)"
echo "  - SQLAlchemy 2.0.23 (Database with unique constraints)"
echo "  - python-dotenv 1.0.0 (Environment variables)"
echo "  - reportlab 4.0.7 (PDF generation)"
echo ""

pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}ERROR: Failed to install Python dependencies!${NC}"
    echo "Please check your internet connection and try again."
    exit 1
else
    echo -e "${GREEN}Backend dependencies: INSTALLED${NC}"
fi
echo ""

# ========================================
# STEP 5: Install Frontend Dependencies
# ========================================
echo -e "${BLUE}[STEP 5/6] Installing Frontend Dependencies${NC}"
echo "========================================"
cd "$SCRIPT_DIR/frontend"
echo "Checking Node.js packages..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}Frontend dependencies: ALREADY INSTALLED${NC}"
else
    echo "Installing Node.js packages (this may take 5-10 minutes)..."
    echo "  - react 18.2.0 (UI library)"
    echo "  - react-router-dom 6.14.0 (Routing)"
    echo "  - axios 1.5.0 (HTTP client)"
    echo "  - chart.js 4.4.0 (Charts)"
    echo "  - tailwindcss 3.3.5 (Styling)"
    echo "  - xlsx 0.18.5 (Excel export)"
    echo "  - react-icons 4.11.0 (Icons)"
    echo ""

    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}ERROR: Failed to install Node.js dependencies!${NC}"
        echo "Please check your internet connection and try again."
        exit 1
    else
        echo -e "${GREEN}Frontend dependencies: INSTALLED${NC}"
    fi
fi
echo ""

# ========================================
# STEP 6: Initialize Multi-Company Databases
# ========================================
echo -e "${BLUE}[STEP 6/6] Preparing Database${NC}"
echo "========================================"
cd "$SCRIPT_DIR/backend"
echo "Checking database..."
source "$SCRIPT_DIR/.venv/bin/activate"

mkdir -p instance

if [ -f "instance/company.db" ]; then
    echo "Company database: EXISTS"
else
    echo "Company database will be created automatically when application starts"
fi

echo -e "${GREEN}Database: READY${NC}"
echo ""

# ========================================
# Installation Complete
# ========================================
clear
echo ""
echo -e "${BLUE}========================================"
echo -e " INSTALLATION COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Your PaperCone Business App is ready to use!"
echo ""
echo "Installation Summary:"
echo "  - Python: $(python3 --version | cut -d' ' -f2)"
echo "  - Node.js: $(node --version)"
echo "  - Backend: Ready (Flask, SQLAlchemy, ReportLab, etc.)"
echo "  - Frontend: Ready (React, Tailwind, Chart.js, etc.)"
echo "  - Company Database: Ready"
echo "  - Virtual Environment: Created at ./.venv"
echo ""
echo -e "${BLUE}========================================"
echo -e " HOW TO START THE APPLICATION${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Run the start script:"
echo "  ./start.sh"
echo ""
echo "Or make it executable and run:"
echo "  chmod +x start.sh"
echo "  ./start.sh"
echo ""
echo "COMPANIES AVAILABLE FOR LOGIN:"
echo "  - Business Company (Organization)"
echo ""
echo "The app will open automatically in your browser at:"
echo "  http://localhost:3000"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Would you like to start the app now? (Y/N)"
read -p "Enter choice: " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting application..."
    cd "$SCRIPT_DIR"
    chmod +x start.sh
    ./start.sh
else
    echo ""
    echo "You can start the app later using ./start.sh"
fi
echo ""
echo "Thank you for installing PaperCone Business App!"
echo ""
