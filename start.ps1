

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$DbDir = Join-Path $Backend 'instance'

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Multi-Company Inventory Management System" -ForegroundColor Cyan
Write-Host "  Version: 1.0" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Ensure instance directory exists
if (-not (Test-Path $DbDir)) {
    Write-Host "Creating instance directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DbDir | Out-Null
}

Write-Host "=== Environment Check ===" -ForegroundColor Cyan
# Virtual environment activation (if exists)
$VenvPath = Join-Path $Root 'venv'
if (Test-Path $VenvPath) {
    $ActivateScript = Join-Path $VenvPath 'Scripts/Activate.ps1'
    if (Test-Path $ActivateScript) {
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        . $ActivateScript
        Write-Host "[OK] Virtual environment activated" -ForegroundColor Green
    }
}

# Python detection logic
$PYTHON = $null
if ($env:PYTHON) {
    $PYTHON = $env:PYTHON
} elseif (Test-Path (Join-Path $VenvPath 'Scripts/python.exe')) {
    $PYTHON = (Join-Path $VenvPath 'Scripts/python.exe')
} elseif (Test-Path (Join-Path $Root '.venv/Scripts/python.exe')) {
    $PYTHON = (Join-Path $Root '.venv/Scripts/python.exe')
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PYTHON = 'python'
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $PYTHON = 'python3'
} else {
    Write-Host "[ERROR] Python not found. Please install Python 3.11+ and add to PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python: $PYTHON" -ForegroundColor Green

Write-Host "`n=== Database Setup ===" -ForegroundColor Cyan
$CompanyDb = Join-Path $DbDir 'company.db'
if (-not (Test-Path $CompanyDb)) {
    Write-Host "Initializing company database..." -ForegroundColor Yellow
    Push-Location $Backend
    & $PYTHON -c "from models import db, init_db; from app import app; app.app_context().push(); init_db('company')"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Company database created" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create company database" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "[OK] Company database exists" -ForegroundColor Green
}

Write-Host "`n=== Cleaning Cache ===" -ForegroundColor Cyan
Get-ChildItem -Path $Backend -Filter "__pycache__" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Python cache cleared" -ForegroundColor Green

Write-Host "`n=== Starting Backend (Flask @5000) ===" -ForegroundColor Cyan
$BackendProc = Start-Process -PassThru -NoNewWindow -WorkingDirectory $Backend -FilePath $PYTHON -ArgumentList "app.py"
Write-Host "[OK] Backend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 4

Write-Host "`n=== Starting Frontend (React @3000) ===" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Write-Host "Installing frontend dependencies (first time)..." -ForegroundColor Yellow
    $env:BROWSER = 'none'
    $FrontendProc = Start-Process -PassThru -NoNewWindow -WorkingDirectory $Frontend -FilePath cmd.exe -ArgumentList "/c", "npm install && npm start"
} else {
    $env:BROWSER = 'none'
    $FrontendProc = Start-Process -PassThru -NoNewWindow -WorkingDirectory $Frontend -FilePath cmd.exe -ArgumentList "/c", "npm start"
}
Write-Host "[OK] Frontend server starting..." -ForegroundColor Green
Write-Host "Waiting for React server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Opening browser with fresh session..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    Start-Process "http://localhost:3000/?clear=true"
} catch {
    Write-Host "Could not auto-open browser. Please navigate to http://localhost:3000/?clear=true manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  System Status" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Companies Configured:" -ForegroundColor White
Write-Host "  • Business Company (ORG) -> $CompanyDb" -ForegroundColor Green
Write-Host ""
Write-Host "Active Services:" -ForegroundColor White
Write-Host "  • Backend API  -> http://localhost:5000" -ForegroundColor Green
Write-Host "  • Frontend UI  -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Features Available:" -ForegroundColor White
Write-Host "  ✓ Dashboard" -ForegroundColor Green
Write-Host "  ✓ Buyers Management" -ForegroundColor Green
Write-Host "  ✓ Items and Inventory" -ForegroundColor Green
Write-Host "  ✓ Orders (with auto inventory deduction)" -ForegroundColor Green
Write-Host "  ✓ Ledger" -ForegroundColor Green
Write-Host "  ✓ Reports" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to stop all services and exit..." -ForegroundColor Yellow
[void][System.Console]::ReadLine()

# Cleanup on exit
Write-Host "`nStopping services..." -ForegroundColor Yellow
if ($BackendProc -and !$BackendProc.HasExited) { $BackendProc | Stop-Process -Force -ErrorAction SilentlyContinue }
if ($FrontendProc -and !$FrontendProc.HasExited) { $FrontendProc | Stop-Process -Force -ErrorAction SilentlyContinue }
Get-Process | Where-Object { $_.ProcessName -like '*python*' } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "All services stopped." -ForegroundColor Green
Write-Host "`nStopping services..." -ForegroundColor Yellow
