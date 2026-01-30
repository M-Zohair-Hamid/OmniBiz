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

# Python check
Write-Host "=== Environment Check ===" -ForegroundColor Cyan
$py = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $py = 'python' }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $py = 'py' }
else {
    Write-Host "[ERROR] Python not found. Please install Python 3.11+ and add to PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python: $py" -ForegroundColor Green

# Database initialization
Write-Host "`n=== Database Setup ===" -ForegroundColor Cyan
$umarDb = Join-Path $DbDir 'umarsons.db'
$makkahDb = Join-Path $DbDir 'makkah_packages.db'

if (-not (Test-Path $umarDb)) {
    Write-Host "Initializing UmarSons database..." -ForegroundColor Yellow
    Push-Location $Backend
    & $py setup_umarsons.py
    if ($LASTEXITCODE -eq 0) { 
        Write-Host "[OK] UmarSons database created" -ForegroundColor Green 
    } else {
        Write-Host "[ERROR] Failed to create UmarSons database" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "[OK] UmarSons database exists" -ForegroundColor Green
}

if (-not (Test-Path $makkahDb)) {
    Write-Host "Initializing Makkah Packages database..." -ForegroundColor Yellow
    Push-Location $Backend
    & $py setup_databases.py
    if ($LASTEXITCODE -eq 0) { 
        Write-Host "[OK] Makkah Packages database created" -ForegroundColor Green 
    } else {
        Write-Host "[ERROR] Failed to create Makkah Packages database" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "[OK] Makkah Packages database exists" -ForegroundColor Green
}

# Clean Python cache
Write-Host "`n=== Cleaning Cache ===" -ForegroundColor Cyan
Get-ChildItem -Path $Backend -Filter "__pycache__" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Python cache cleared" -ForegroundColor Green

# Start backend
Write-Host "`n=== Starting Backend (Flask @5000) ===" -ForegroundColor Cyan
Start-Process -WindowStyle Hidden -WorkingDirectory $Backend -FilePath cmd.exe -ArgumentList "/c", "$py app.py"
Write-Host "[OK] Backend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Start frontend
Write-Host "`n=== Starting Frontend (React @3000) ===" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Write-Host "Installing frontend dependencies (first time)..." -ForegroundColor Yellow
    Start-Process -WindowStyle Hidden -WorkingDirectory $Frontend -FilePath cmd.exe -ArgumentList "/c", "npm install && npm start"
} else {
    Start-Process -WindowStyle Hidden -WorkingDirectory $Frontend -FilePath cmd.exe -ArgumentList "/c", "npm start"
}
Write-Host "[OK] Frontend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 5

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  System Status" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Companies Configured:" -ForegroundColor White
Write-Host "  • UmarSons (PC)       -> $umarDb" -ForegroundColor Green
Write-Host "  • Makkah Packages (QP) -> $makkahDb" -ForegroundColor Green
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
Write-Host "Press any key to stop all services and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

# Cleanup on exit
Write-Host "`nStopping services..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "All services stopped." -ForegroundColor Green
