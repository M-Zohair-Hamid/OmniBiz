$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$DbDir = Join-Path $Backend 'instance'
$VenvPython = Join-Path $Backend '.venv\Scripts\python.exe'

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Multi-Company Inventory Management System" -ForegroundColor Cyan
Write-Host "  .venv Runtime Launcher" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] backend\.venv was not found." -ForegroundColor Red
    Write-Host "Run .\INSTALLER.ps1 first to install all dependencies." -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm not found. Please install Node.js 18+ and re-run installer." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DbDir)) {
    Write-Host "Creating instance directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DbDir | Out-Null
}

Write-Host "=== Environment Check ===" -ForegroundColor Cyan
Write-Host "[OK] Python (.venv): $VenvPython" -ForegroundColor Green
Write-Host "[OK] npm: $(npm --version)" -ForegroundColor Green

Write-Host "`n=== Database Bootstrap ===" -ForegroundColor Cyan
$umarDb = Join-Path $DbDir 'umarsons.db'
$makkahDb = Join-Path $DbDir 'makkah_packages.db'

if (-not (Test-Path $umarDb) -or -not (Test-Path $makkahDb)) {
    Write-Host "Initializing company databases via backend bootstrap..." -ForegroundColor Yellow
    Push-Location $Backend
    & $VenvPython -c "import app; print('Database bootstrap complete')"
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "[ERROR] Failed to initialize databases." -ForegroundColor Red
        exit 1
    }
    Pop-Location
} else {
    Write-Host "[OK] Company databases already exist" -ForegroundColor Green
}

Write-Host "`n=== Cleaning Cache ===" -ForegroundColor Cyan
Get-ChildItem -Path $Backend -Filter "__pycache__" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Python cache cleared" -ForegroundColor Green

Write-Host "`n=== Starting Backend (Flask @5000) ===" -ForegroundColor Cyan
$backendCommand = "`"$VenvPython`" app.py"
$backendProc = Start-Process -NoNewWindow -WorkingDirectory $Backend -FilePath cmd.exe -ArgumentList "/c", $backendCommand -PassThru
Write-Host "[OK] Backend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 4

Write-Host "`n=== Starting Frontend (React @3000) ===" -ForegroundColor Cyan
$env:BROWSER = 'none'
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Write-Host "Installing frontend dependencies (first time)..." -ForegroundColor Yellow
    $frontendCommand = "npm install && npm start"
} else {
    $frontendCommand = "npm start"
}
$frontendProc = Start-Process -NoNewWindow -WorkingDirectory $Frontend -FilePath cmd.exe -ArgumentList "/c", $frontendCommand -PassThru
Write-Host "[OK] Frontend server starting..." -ForegroundColor Green
Write-Host "Waiting for React server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Opening browser with fresh session..." -ForegroundColor Yellow
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
Write-Host "  - UmarSons (PC)        -> $umarDb" -ForegroundColor Green
Write-Host "  - Makkah Packages (MP) -> $makkahDb" -ForegroundColor Green
Write-Host ""
Write-Host "Active Services:" -ForegroundColor White
Write-Host "  - Backend API  -> http://localhost:5000" -ForegroundColor Green
Write-Host "  - Frontend UI  -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to stop services and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

Write-Host "`nStopping services..." -ForegroundColor Yellow
try {
    if ($backendProc -and -not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
} catch {}
try {
    if ($frontendProc -and -not $frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
} catch {}
Write-Host "All services stopped." -ForegroundColor Green
