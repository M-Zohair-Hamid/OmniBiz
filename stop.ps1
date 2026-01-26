$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Multi-Company Application Shutdown" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Kill processes on port 5000 (Flask backend)
Write-Host "Stopping backend (Flask @5000)" -ForegroundColor Yellow
$flaskProcess = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*flask*" }
if ($flaskProcess) {
    $flaskProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Backend stopped." -ForegroundColor Green
} else {
    Write-Host "Backend not running." -ForegroundColor Gray
}

# Kill processes on port 3000 (React frontend)
Write-Host "Stopping frontend (React @3000)" -ForegroundColor Yellow
$nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    $nodeProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Frontend stopped." -ForegroundColor Green
} else {
    Write-Host "Frontend not running." -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green
Write-Host ""
