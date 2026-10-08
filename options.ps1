<#
.SYNOPSIS
    PaperCone Options - database & app maintenance menu.
    Launched from the "PaperCone Options" desktop shortcut created by the
    installer, or can be run directly from inside the project folder.

.NOTES
    - Works against the SQLite database at backend\instance\company.db.
    - Safe to re-run any number of times.
#>

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host ""; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "   [FAIL] $msg" -ForegroundColor Red }

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$Backend = Join-Path $ProjectRoot 'backend'
$Frontend = Join-Path $ProjectRoot 'frontend'
$VenvPy = Join-Path $ProjectRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $Backend) -or -not (Test-Path $Frontend)) {
    Write-Err "Could not find 'backend' and 'frontend' folders here. Make sure options.ps1 sits inside the project folder."
    Read-Host "Press Enter to exit"
    exit 1
}

$dbPath = Join-Path $Backend 'instance\company.db'
$backupDir = Join-Path $Backend 'instance\backups'

function Stop-PaperConeServers {
    # Backend (Flask, port 5000) and frontend (React, port 3000) - kill
    # whatever owns each port. That's the real signal, not process name,
    # since npm/react spawn child node processes that vary by OS/version.
    $killed = $false

    foreach ($port in 5000, 3000) {
        try {
            $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            foreach ($c in $conns) {
                try {
                    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
                    $killed = $true
                } catch {}
            }
        } catch {
            # Get-NetTCPConnection unavailable (older Windows) - fall through.
        }
    }

    # Fallback / belt-and-suspenders: sweep python.exe running our app.py
    # and node.exe running react-scripts, in case ports moved.
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*app.py*" } |
        ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $killed = $true } catch {} }

    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*react-scripts*" -or $_.CommandLine -like "*npm*start*" } |
        ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $killed = $true } catch {} }

    return $killed
}

function Invoke-StopApp {
    Write-Step "Stop PaperCone"
    $wasRunning = Stop-PaperConeServers
    if ($wasRunning) {
        Write-Ok "Backend and/or frontend stopped."
    } else {
        Write-Warn "Nothing was found running on ports 5000/3000."
    }
}

function Invoke-RefreshProject {
    Write-Step "Refresh project (developers only)"
    Write-Warn "This reinstalls backend + frontend dependencies. It does not touch your data."
    $confirm = Read-Host "Type YES to continue"
    if ($confirm -ne "YES") { Write-Warn "Refresh cancelled."; return }

    Stop-PaperConeServers

    if (-not (Test-Path $VenvPy)) {
        Write-Err "Virtual environment not found. Run INSTALLER.ps1 first."
        return
    }

    try {
        Write-Step "Reinstalling backend dependencies"
        & $VenvPy -m pip install --upgrade pip --quiet
        & $VenvPy -m pip install -r (Join-Path $Backend 'requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw "pip install failed." }
        Write-Ok "Backend dependencies up to date"

        Write-Step "Clearing Python cache"
        Get-ChildItem -Path $Backend -Filter "__pycache__" -Recurse -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Ok "Python cache cleared"

        Write-Step "Reinstalling frontend dependencies (npm install)"
        Push-Location $Frontend
        npm install
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm install failed." }
        Pop-Location
        Write-Ok "Frontend dependencies up to date"

        Write-Ok "Project refresh complete."
    } catch {
        Write-Err "Refresh failed: $($_.Exception.Message)"
    }
}

function Invoke-FixBuildPermissions {
    Write-Step "Fix build/run permissions (Windows Defender exclusion)"
    Write-Warn "This adds a Windows Defender exclusion for the project folder. It fixes"
    Write-Warn "'Access denied' / EPERM errors from Python (backend) or Node (frontend,"
    Write-Warn "e.g. 'npm install'/'npm start') caused by real-time scanning locking files."
    Write-Host ""

    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Err "This requires Administrator rights."
        Write-Err "Close this window, right-click 'PaperCone Options' -> Run as Administrator, then try again."
        return
    }

    try {
        Add-MpPreference -ExclusionPath $ProjectRoot -ErrorAction Stop
        Write-Ok "Defender exclusion added for: $ProjectRoot"
        Write-Ok "This covers both the backend (Python) and frontend (Node) folders."
    } catch {
        Write-Err "Could not add Defender exclusion: $($_.Exception.Message)"
        Write-Warn "If this PC uses a different antivirus (not Windows Defender), add an exclusion"
        Write-Warn "for this folder manually in that antivirus's settings instead."
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Magenta
    Write-Host " PaperCone Options" -ForegroundColor Magenta
    Write-Host " Project folder: $ProjectRoot" -ForegroundColor Magenta
    Write-Host "==================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  1) Reset database   (wipes all data, starts fresh/empty)"
    Write-Host "  2) Backup database  (save a copy of the current database)"
    Write-Host "  3) Restore database (replace current database from a backup)"
    Write-Host "  4) Stop PaperCone   (kill backend + frontend if running)"
    Write-Host "  5) Refresh project  (developers only: reinstall dependencies)"
    Write-Host "  6) Fix run permissions (Defender exclusion, run as Admin)"
    Write-Host "  7) Exit"
    Write-Host ""
}

function Invoke-ResetDatabase {
    Write-Step "Reset database"
    Write-Warn "This will PERMANENTLY erase ALL data (buyers, items, orders, ledger)"
    Write-Warn "and start with an empty database."
    Write-Host ""
    $confirm1 = Read-Host "Type YES to continue"
    if ($confirm1 -ne "YES") { Write-Warn "Reset cancelled."; return }
    $confirm2 = Read-Host "This cannot be undone unless you have a backup. Type RESET to confirm"
    if ($confirm2 -ne "RESET") { Write-Warn "Reset cancelled."; return }

    Stop-PaperConeServers

    try {
        if (Test-Path $dbPath) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            $safetyName = "before-reset_" + (Get-Date -Format "yyyy-MM-dd_HHmmss") + ".db"
            Copy-Item $dbPath (Join-Path $backupDir $safetyName) -Force
            Write-Ok "Safety backup saved as $safetyName (in case this was a mistake)"
        }

        Remove-Item $dbPath -Force -ErrorAction SilentlyContinue

        if (-not (Test-Path $VenvPy)) {
            Write-Err "Virtual environment not found. Run INSTALLER.ps1 first."
            return
        }

        Push-Location $Backend
        & $VenvPy -c "from models import db, init_db; from app import app; app.app_context().push(); init_db('company')"
        Pop-Location
        if ($LASTEXITCODE -ne 0) { throw "Database init failed." }
        Write-Ok "Database reset complete"
    } catch {
        Write-Err "Reset failed: $($_.Exception.Message)"
    }
}

function Invoke-BackupDatabase {
    Write-Step "Backup database"
    if (-not (Test-Path $dbPath)) { Write-Err "No database found at $dbPath. Nothing to back up."; return }

    try {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        $name = "backup_" + (Get-Date -Format "yyyy-MM-dd_HHmmss") + ".db"
        $destPath = Join-Path $backupDir $name
        Copy-Item $dbPath $destPath -Force
        Write-Ok "Backup saved: $destPath"
    } catch {
        Write-Err "Backup failed: $($_.Exception.Message)"
    }
}

function Invoke-RestoreDatabase {
    Write-Step "Restore database"

    if (-not (Test-Path $backupDir) -or -not (Get-ChildItem $backupDir -Filter "*.db" -ErrorAction SilentlyContinue)) {
        Write-Err "No backups found in $backupDir. Create one with 'Backup database' first."
        return
    }

    $backups = Get-ChildItem $backupDir -Filter "*.db" | Sort-Object LastWriteTime -Descending

    Write-Host ""
    Write-Host "Available backups:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $b = $backups[$i]
        Write-Host ("  {0}) {1}   ({2})" -f ($i + 1), $b.Name, $b.LastWriteTime)
    }
    Write-Host ""

    $choice = Read-Host "Enter the number of the backup to restore (or 0 to cancel)"
    if ($choice -notmatch '^\d+$' -or [int]$choice -lt 1 -or [int]$choice -gt $backups.Count) {
        Write-Warn "Restore cancelled."
        return
    }

    $chosen = $backups[[int]$choice - 1]

    Write-Warn "This will REPLACE the current database with '$($chosen.Name)'."
    Write-Warn "Any data added since that backup was made will be lost."
    $confirm = Read-Host "Type YES to continue"
    if ($confirm -ne "YES") { Write-Warn "Restore cancelled."; return }

    Stop-PaperConeServers

    try {
        if (Test-Path $dbPath) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            $safetyName = "before-restore_" + (Get-Date -Format "yyyy-MM-dd_HHmmss") + ".db"
            Copy-Item $dbPath (Join-Path $backupDir $safetyName) -Force
            Write-Ok "Safety backup of current database saved as $safetyName"
        }

        Copy-Item $chosen.FullName $dbPath -Force
        Write-Ok "Database restored from $($chosen.Name)"
    } catch {
        Write-Err "Restore failed: $($_.Exception.Message)"
    }
}

# ---------------------------------------------------------------
# Menu loop
# ---------------------------------------------------------------

$exit = $false
while (-not $exit) {
    Show-Menu
    $selection = Read-Host "Choose an option (1-7)"
    switch ($selection) {
        "1" { Invoke-ResetDatabase }
        "2" { Invoke-BackupDatabase }
        "3" { Invoke-RestoreDatabase }
        "4" { Invoke-StopApp }
        "5" { Invoke-RefreshProject }
        "6" { Invoke-FixBuildPermissions }
        "7" { $exit = $true }
        default { Write-Warn "Please enter a number from 1 to 7." }
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green