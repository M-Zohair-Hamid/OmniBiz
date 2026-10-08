# Starts the backend (Flask) and frontend (React) hidden, waits for the
# backend to respond, then opens the browser. Uses $PSScriptRoot so it keeps
# working even if the whole project folder gets moved/copied to another PC.

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$Backend = Join-Path $ProjectRoot 'backend'
$Frontend = Join-Path $ProjectRoot 'frontend'
$DbDir = Join-Path $Backend 'instance'
$VenvDir = Join-Path $ProjectRoot '.venv'
$VenvPython = Join-Path $VenvDir 'Scripts\python.exe'
$LogDir = Join-Path $ProjectRoot 'logs'

$backendPort = 5000
$frontendPort = 3000
$url = "http://localhost:$frontendPort/?clear=true"

function Show-Error($msg) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($msg, "PaperCone", 'OK', 'Error') | Out-Null
}

if (-not (Test-Path $VenvPython)) {
    Show-Error "Virtual environment not found.`nRun INSTALLER.ps1 first."
    exit 1
}

if (-not (Test-Path $DbDir)) { New-Item -ItemType Directory -Path $DbDir | Out-Null }
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$backendLog = Join-Path $LogDir 'backend.log'
$backendErrLog = Join-Path $LogDir 'backend-error.log'
$frontendLog = Join-Path $LogDir 'frontend.log'
$frontendErrLog = Join-Path $LogDir 'frontend-error.log'

# --- Create company database on first run ---
$CompanyDb = Join-Path $DbDir 'company.db'
if (-not (Test-Path $CompanyDb)) {
    Push-Location $Backend
    & $VenvPython -c "from models import db, init_db; from app import app; app.app_context().push(); init_db('company')" *> (Join-Path $LogDir 'db-init.log')
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Database setup failed. See logs\db-init.log for details."
        exit 1
    }
}

# --- Install frontend deps on first run (hidden, blocking - browser can't open before this) ---
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    $npmInstallLog = Join-Path $LogDir 'npm-install.log'
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm install > `"$npmInstallLog`" 2>&1" -WorkingDirectory $Frontend -WindowStyle Hidden -Wait
}

# --- Start backend hidden, with output captured to log files ---
$backendProc = Start-Process -FilePath $VenvPython -ArgumentList "app.py" -WorkingDirectory $Backend -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrLog

# --- Wait for backend to actually respond before starting frontend / opening browser ---
$maxTries = 40
$backendReady = $false
for ($i = 0; $i -lt $maxTries; $i++) {
    Start-Sleep -Milliseconds 500

    if ($backendProc.HasExited) {
        Show-Error "Backend (Flask) crashed on startup.`nCheck logs\backend-error.log for the reason.`n`nCommon causes: missing dependency, port 5000 already in use, or a code error in app.py."
        exit 1
    }

    # Port-based check: is anything listening on 5000 yet? Any HTTP response
    # (even a 404) proves Flask is up - we don't assume a specific route exists.
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $backendPort)
        if ($tcp.Connected) { $backendReady = $true; $tcp.Close(); break }
    } catch {
        # Not up yet, keep waiting.
    }
}

if (-not $backendReady) {
    Show-Error "Backend (Flask) did not respond on port $backendPort after 20 seconds.`nCheck logs\backend.log and logs\backend-error.log for details."
    exit 1
}

# --- Start frontend hidden, with output captured to log files ---
$env:BROWSER = 'none'
$frontendCmdLog = Join-Path $LogDir 'frontend-cmd.log'
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start > `"$frontendCmdLog`" 2>&1" -WorkingDirectory $Frontend -WindowStyle Hidden

# --- Wait for frontend to respond too, then open browser ---
$maxTries = 60
$frontendReady = $false
for ($i = 0; $i -lt $maxTries; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $frontendPort)
        if ($tcp.Connected) { $frontendReady = $true; $tcp.Close(); break }
    } catch {
        # Not up yet, keep waiting.
    }
}

if (-not $frontendReady) {
    Show-Error "Frontend (React) did not respond on port $frontendPort after 30 seconds.`nCheck logs\frontend-cmd.log for details.`nBackend is still running on port $backendPort."
    exit 1
}

Start-Process $url