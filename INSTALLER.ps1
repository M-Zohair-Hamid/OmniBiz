<#
.SYNOPSIS
    PaperCone Business App installer. Run this from inside the project folder
    (the folder containing backend\ and frontend\).

.NOTES
    - Must be run as Administrator (needed for winget installs).
    - Requires Windows 10 1809+ / Windows 11 (winget preinstalled).
    - Safe to re-run: skips anything already installed/done.
#>

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host ""; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "   [FAIL] $msg" -ForegroundColor Red }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This installer needs Administrator rights (to install Python/Node if missing)." -ForegroundColor Red
    Write-Host "Right-click INSTALLER.ps1 -> Run with PowerShell as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host " PaperCone Business App Installer" -ForegroundColor Magenta
Write-Host " Project folder: $ProjectRoot" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

if (-not (Test-Path (Join-Path $ProjectRoot "backend")) -or -not (Test-Path (Join-Path $ProjectRoot "frontend"))) {
    Write-Err "Could not find 'backend' and 'frontend' folders here. Make sure this script sits inside the project folder."
    Read-Host "Press Enter to exit"
    exit 1
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# ---------------------------------------------------------------
# 1. winget itself
# ---------------------------------------------------------------

Write-Step "Checking winget (Windows Package Manager)"
$wingetOk = $null -ne (Get-Command winget -ErrorAction SilentlyContinue)
if (-not $wingetOk) {
    Write-Warn "winget not found. Attempting automatic install..."
    try {
        $progressPreference = 'SilentlyContinue'
        Install-PackageProvider -Name NuGet -Force -ErrorAction Stop | Out-Null
        Install-Module -Name Microsoft.WinGet.Client -Force -Repository PSGallery -ErrorAction Stop
        Repair-WinGetPackageManager -ErrorAction Stop
    } catch {
        Write-Err "Automatic winget install failed: $($_.Exception.Message)"
        Write-Err "Install 'App Installer' from the Microsoft Store manually, then re-run this script."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Refresh-Path
    $wingetOk = $null -ne (Get-Command winget -ErrorAction SilentlyContinue)
    if (-not $wingetOk) {
        Write-Err "winget still not found after install attempt. Close this window, open a NEW PowerShell (Admin), and re-run this script."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "winget installed"
} else {
    Write-Ok "winget available"
}

# ---------------------------------------------------------------
# 2. Python 3.11+
# ---------------------------------------------------------------

Write-Step "Checking Python"

function Get-PythonVersion {
    try {
        $v = (python -c "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')") 2>$null
        return $v
    } catch { return $null }
}

$pyVersion = Get-PythonVersion
if ($pyVersion -and ([version]$pyVersion -ge [version]"3.11")) {
    Write-Ok "Python $pyVersion found"
} else {
    if ($pyVersion) {
        Write-Warn "Python $pyVersion found, but 3.11+ is required. Installing Python 3.11..."
    } else {
        Write-Warn "Python not found. Installing Python 3.11..."
    }
    winget install --id Python.Python.3.11 -e --source winget --accept-source-agreements --accept-package-agreements
    Refresh-Path
    $pyVersion = Get-PythonVersion
    if (-not $pyVersion -or [version]$pyVersion -lt [version]"3.11") {
        Write-Err "Python install did not complete correctly. Close this window, open a NEW PowerShell (Admin), and re-run this script."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "Python $pyVersion installed"
}

# ---------------------------------------------------------------
# 3. Node.js LTS (18+)
# ---------------------------------------------------------------

Write-Step "Checking Node.js"

function Get-NodeMajor {
    try {
        $v = (node -v) 2>$null
        if ($v -match "v(\d+)\.") { return [int]$matches[1] }
        return $null
    } catch { return $null }
}

$nodeMajor = Get-NodeMajor
if ($nodeMajor -and $nodeMajor -ge 18) {
    Write-Ok "Node.js v$nodeMajor found"
} else {
    if ($nodeMajor) {
        Write-Warn "Node.js v$nodeMajor found, but 18+ is required. Installing Node LTS..."
    } else {
        Write-Warn "Node.js not found. Installing Node LTS..."
    }
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
    Refresh-Path
    $nodeMajor = Get-NodeMajor
    if (-not $nodeMajor -or $nodeMajor -lt 18) {
        Write-Err "Node install did not complete correctly. Close this window, open a NEW PowerShell (Admin), and re-run this script."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "Node.js v$nodeMajor installed"
}

# ---------------------------------------------------------------
# 4. Python virtual environment
# ---------------------------------------------------------------

Write-Step "Creating Python virtual environment"
$VenvDir = Join-Path $ProjectRoot '.venv'
$VenvPy = Join-Path $VenvDir 'Scripts\python.exe'

if (Test-Path $VenvPy) {
    Write-Ok "Virtual environment already exists"
} else {
    python -m venv $VenvDir
    if (-not (Test-Path $VenvPy)) {
        Write-Err "Failed to create virtual environment"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "Virtual environment created"
}

# ---------------------------------------------------------------
# 5. Backend dependencies
# ---------------------------------------------------------------

Write-Step "Installing backend dependencies"
$Requirements = Join-Path $ProjectRoot 'backend\requirements.txt'
if (-not (Test-Path $Requirements)) {
    Write-Err "backend\requirements.txt not found!"
    Read-Host "Press Enter to exit"
    exit 1
}
& $VenvPy -m pip install --upgrade pip --quiet
& $VenvPy -m pip install -r $Requirements
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to install backend dependencies."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Ok "Backend dependencies installed"

# ---------------------------------------------------------------
# 6. Frontend dependencies
# ---------------------------------------------------------------

Write-Step "Installing frontend dependencies (npm install)"
$FrontendDir = Join-Path $ProjectRoot 'frontend'
Push-Location $FrontendDir
if (Test-Path 'node_modules') {
    Write-Ok "Frontend dependencies already installed"
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install failed."
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "Frontend dependencies installed"
}
Pop-Location

# ---------------------------------------------------------------
# 7. Database
# ---------------------------------------------------------------

Write-Step "Preparing database"
$InstanceDir = Join-Path $ProjectRoot 'backend\instance'
if (-not (Test-Path $InstanceDir)) { New-Item -ItemType Directory -Path $InstanceDir | Out-Null }
$CompanyDb = Join-Path $InstanceDir 'company.db'
if (Test-Path $CompanyDb) {
    Write-Ok "Company database already exists"
} else {
    Write-Ok "Company database will be created on first start"
}

# ---------------------------------------------------------------
# 8. Desktop shortcuts
# ---------------------------------------------------------------

Write-Step "Creating desktop shortcuts"

$desktopPath = [Environment]::GetFolderPath("Desktop")
$powershellExe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$wshShell = New-Object -ComObject WScript.Shell

# Main app launcher - fully hidden (no console window)
$startPs1 = Join-Path $ProjectRoot "start.ps1"
$shortcutPath = Join-Path $desktopPath "PaperCone Business App.lnk"
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powershellExe
$shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $startPs1 + '"'
$shortcut.WorkingDirectory = $ProjectRoot
$shortcut.IconLocation = "shell32.dll,220"
$shortcut.Description = "Start PaperCone Business App"
$shortcut.Save()
Write-Ok "Desktop shortcut created: $shortcutPath"

# Options menu - visible console, interactive
$optionsPs1 = Join-Path $ProjectRoot "options.ps1"
if (Test-Path $optionsPs1) {
    $optionsShortcutPath = Join-Path $desktopPath "PaperCone Options.lnk"
    $optionsShortcut = $wshShell.CreateShortcut($optionsShortcutPath)
    $optionsShortcut.TargetPath = $powershellExe
    $optionsShortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $optionsPs1 + '"'
    $optionsShortcut.WorkingDirectory = $ProjectRoot
    $optionsShortcut.IconLocation = "shell32.dll,166"
    $optionsShortcut.Description = "PaperCone database options: reset, backup, restore, stop, refresh"
    $optionsShortcut.Save()
    Write-Ok "Desktop shortcut created: $optionsShortcutPath"
} else {
    Write-Warn "options.ps1 not found next to INSTALLER.ps1 - skipping Options shortcut."
}

# ---------------------------------------------------------------
# Done
# ---------------------------------------------------------------

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " Install complete." -ForegroundColor Green
Write-Host " Double-click 'PaperCone Business App' on the Desktop to start." -ForegroundColor Green
Write-Host " It opens quietly in the background and launches your browser automatically." -ForegroundColor Green
Write-Host ""
Write-Host " Use 'PaperCone Options' on the Desktop to reset, back up, restore," -ForegroundColor Green
Write-Host " stop, or refresh the app." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Read-Host "Press Enter to close"