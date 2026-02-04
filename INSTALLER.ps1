# PaperCone Business App - Complete Installer (PowerShell)
# Supports Windows with Python 3.11+ and Node.js 18+

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "PaperCone Business App - Complete Installer"

# Color functions for output
function Write-Header {
    param([string]$text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$text)
    Write-Host $text -ForegroundColor Yellow
}

function Write-Success {
    param([string]$text)
    Write-Host $text -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$text)
    Write-Host $text -ForegroundColor Red
}

# Main installer
Write-Host ""
Write-Header "PAPERCONE BUSINESS APP INSTALLER"

Write-Host "This installer will set up everything needed to run the application.`n" -ForegroundColor White
Write-Host "Installation steps:"
Write-Host "  [1] Check Python 3.11+ (install if missing)"
Write-Host "  [2] Check Node.js 18+ (install if missing)"
Write-Host "  [3] Create Python virtual environment"
Write-Host "  [4] Install backend dependencies"
Write-Host "  [5] Install frontend dependencies"
Write-Host "  [6] Initialize multi-company databases"
Write-Host "  [7] Create desktop shortcut`n"
Write-Host "Estimated time: 10-15 minutes`n"

Read-Host "Press Enter to begin installation..."
Clear-Host

# Get script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# STEP 1: Check Python Installation
Write-Header "[STEP 1/7] Checking Python Installation"

$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "ERROR: Python is not installed or not in PATH!"
    Write-Host ""
    Write-Host "Please install Python 3.11 or higher:"
    Write-Host "1. Visit: https://www.python.org/downloads/"
    Write-Host "2. Download Python 3.11+ installer"
    Write-Host "3. IMPORTANT: Check 'Add Python to PATH' during installation"
    Write-Host "4. After installation, run this installer again"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Success "Python: FOUND ($pythonVersion)"
}

# STEP 2: Check Node.js Installation
Write-Header "[STEP 2/7] Checking Node.js Installation"

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "ERROR: Node.js is not installed or not in PATH!"
    Write-Host ""
    Write-Host "Please install Node.js 18+ (LTS):"
    Write-Host "1. Visit: https://nodejs.org/"
    Write-Host "2. Download LTS version"
    Write-Host "3. Install with default settings"
    Write-Host "4. After installation, run this installer again"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Success "Node.js: FOUND ($nodeVersion)"
}

# STEP 3: Create Python Virtual Environment
Write-Header "[STEP 3/7] Creating Python Virtual Environment"

if (-not (Test-Path "backend\.venv")) {
    Write-Step "Creating virtual environment in backend\.venv..."
    python -m venv backend\.venv
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Virtual environment created successfully"
    } else {
        Write-Error-Custom "Failed to create virtual environment"
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Success "Virtual environment already exists"
}

# Activate virtual environment
Write-Step "Activating virtual environment..."
& ".\backend\.venv\Scripts\Activate.ps1"

# STEP 4: Install Backend Dependencies
Write-Header "[STEP 4/7] Installing Backend Dependencies"

Write-Step "Installing Python packages from requirements.txt..."
Set-Location backend
pip install --upgrade pip
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed successfully"
} else {
    Write-Error-Custom "Failed to install backend dependencies"
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}
Set-Location ..

# STEP 5: Install Frontend Dependencies
Write-Header "[STEP 5/7] Installing Frontend Dependencies"

Write-Step "Installing Node.js packages..."
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed successfully"
} else {
    Write-Error-Custom "Failed to install frontend dependencies"
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}
Set-Location ..

# STEP 6: Initialize Databases
Write-Header "[STEP 6/7] Initializing Multi-Company Databases"

Write-Step "Activating virtual environment..."
& ".\backend\.venv\Scripts\Activate.ps1"

Write-Step "Creating databases..."
Set-Location backend
python setup_databases.py
if ($LASTEXITCODE -eq 0) {
    Write-Success "Databases initialized successfully"
} else {
    Write-Error-Custom "Warning: Database initialization encountered an issue"
}

Write-Step "Seeding initial data..."
python seed_items.py
if ($LASTEXITCODE -eq 0) {
    Write-Success "Initial data seeded successfully"
}

Set-Location ..

# STEP 7: Create Desktop Shortcut
Write-Header "[STEP 7/7] Creating Desktop Shortcut"

$DesktopPath = [System.IO.Path]::Combine([Environment]::GetFolderPath("Desktop"), "PaperCone.lnk")
$StartScript = Join-Path $SCRIPT_DIR "start.ps1"

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($DesktopPath)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$StartScript`""
    $Shortcut.WorkingDirectory = $SCRIPT_DIR
    $Shortcut.Description = "PaperCone Business Application"
    $Shortcut.Save()
    Write-Success "Desktop shortcut created successfully"
} catch {
    Write-Error-Custom "Warning: Could not create desktop shortcut (non-critical)"
}

# Final message
Write-Header "INSTALLATION COMPLETE!"
Write-Host "Next steps:`n" -ForegroundColor Green
Write-Host "1. Run 'start.ps1' to start the application"
Write-Host "2. Or double-click the 'PaperCone' shortcut on your desktop"
Write-Host "3. Login with UmarSons or Makkah Packages`n"
Write-Host "Happy coding! 🚀`n" -ForegroundColor Green

Read-Host "Press Enter to exit"
