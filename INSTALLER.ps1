# PaperCone Business App - Complete Installer (PowerShell)
# Installs and validates all project dependencies for Windows.

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'PaperCone Business App - Complete Installer'

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

function Write-Warn {
    param([string]$text)
    Write-Host $text -ForegroundColor DarkYellow
}

function Write-Error-Custom {
    param([string]$text)
    Write-Host $text -ForegroundColor Red
}

function Get-CommandOrNull {
    param([string]$name)
    try { return Get-Command $name -ErrorAction Stop } catch { return $null }
}

function Get-PythonRunner {
    $pythonCmd = Get-CommandOrNull 'python'
    if ($pythonCmd) {
        return @{ Exe = 'python'; PrefixArgs = @() }
    }

    $pyCmd = Get-CommandOrNull 'py'
    if ($pyCmd) {
        return @{ Exe = 'py'; PrefixArgs = @('-3') }
    }

    return $null
}

function Get-VersionFromText {
    param([string]$text)
    if ($text -match '(\d+)\.(\d+)\.(\d+)') {
        return [Version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
    }
    return $null
}

Write-Host ''
Write-Header 'PAPERCONE BUSINESS APP INSTALLER'
Write-Host 'This installer validates and installs everything required for this project.' -ForegroundColor White
Write-Host ''
Write-Host 'Installation steps:'
Write-Host '  [1] Validate Python 3.11+'
Write-Host '  [2] Validate Node.js 18+'
Write-Host '  [3] Create backend\.venv'
Write-Host '  [4] Install backend Python dependencies'
Write-Host '  [5] Install frontend npm dependencies'
Write-Host '  [6] Install root npm dependencies (if declared)'
Write-Host '  [7] Initialize databases and create shortcuts'
Write-Host ''

Read-Host 'Press Enter to begin installation...'
Clear-Host

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR 'backend'
$FRONTEND_DIR = Join-Path $SCRIPT_DIR 'frontend'
$VENV_DIR = Join-Path $BACKEND_DIR '.venv'
$VENV_PYTHON = Join-Path $VENV_DIR 'Scripts\python.exe'

Set-Location $SCRIPT_DIR

Write-Header '[STEP 1/7] Checking Python 3.11+'
$pythonRunner = Get-PythonRunner
if (-not $pythonRunner) {
    Write-Error-Custom 'ERROR: Python is not installed or not in PATH.'
    Write-Host 'Install Python 3.11+ from https://www.python.org/downloads/ and re-run INSTALLER.ps1'
    Read-Host 'Press Enter to exit'
    exit 1
}

$pythonVersionText = (& $pythonRunner.Exe @($pythonRunner.PrefixArgs + @('--version')) 2>&1 | Out-String).Trim()
$pythonVersion = Get-VersionFromText $pythonVersionText
if (-not $pythonVersion -or $pythonVersion -lt [Version]'3.11.0') {
    Write-Error-Custom "ERROR: Python 3.11+ is required. Found: $pythonVersionText"
    Read-Host 'Press Enter to exit'
    exit 1
}
Write-Success "Python OK: $pythonVersionText"

Write-Header '[STEP 2/7] Checking Node.js 18+'
$nodeCmd = Get-CommandOrNull 'node'
$npmCmd = Get-CommandOrNull 'npm'
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Error-Custom 'ERROR: Node.js/npm not found in PATH.'
    Write-Host 'Install Node.js 18+ LTS from https://nodejs.org/ and re-run INSTALLER.ps1'
    Read-Host 'Press Enter to exit'
    exit 1
}

$nodeVersionText = (node --version | Out-String).Trim()
$nodeVersion = Get-VersionFromText $nodeVersionText
if (-not $nodeVersion -or $nodeVersion -lt [Version]'18.0.0') {
    Write-Error-Custom "ERROR: Node.js 18+ is required. Found: $nodeVersionText"
    Read-Host 'Press Enter to exit'
    exit 1
}
Write-Success "Node.js OK: $nodeVersionText"
Write-Success "npm OK: $(npm --version)"

Write-Header '[STEP 3/7] Creating backend\.venv'
if (-not (Test-Path $VENV_DIR)) {
    Write-Step 'Creating virtual environment...'
    & $pythonRunner.Exe @($pythonRunner.PrefixArgs + @('-m', 'venv', $VENV_DIR))
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom 'Failed to create backend\.venv'
        Read-Host 'Press Enter to exit'
        exit 1
    }
    Write-Success 'Virtual environment created successfully'
} else {
    Write-Success 'Virtual environment already exists'
}

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Error-Custom "ERROR: venv python not found at $VENV_PYTHON"
    Read-Host 'Press Enter to exit'
    exit 1
}

Write-Header '[STEP 4/7] Installing backend Python dependencies'
Push-Location $BACKEND_DIR
& $VENV_PYTHON -m pip install --upgrade pip setuptools wheel
& $VENV_PYTHON -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error-Custom 'Failed to install backend dependencies'
    Read-Host 'Press Enter to exit'
    exit 1
}
Write-Success 'Backend dependencies installed'

Write-Step 'Verifying backend imports...'
& $VENV_PYTHON -c "import flask, flask_cors, flask_jwt_extended, flask_sqlalchemy, sqlalchemy, dotenv, reportlab; print('core imports ok')"
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error-Custom 'Core Python import verification failed'
    Read-Host 'Press Enter to exit'
    exit 1
}

& $VENV_PYTHON -c "import weasyprint; print('weasyprint ok')"
if ($LASTEXITCODE -ne 0) {
    Write-Warn 'Warning: WeasyPrint import failed. PDF generation may not work until its system runtime deps are installed.'
} else {
    Write-Success 'WeasyPrint verified'
}
Pop-Location

Write-Header '[STEP 5/7] Installing frontend npm dependencies'
Push-Location $FRONTEND_DIR
npm install
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error-Custom 'Failed to install frontend dependencies'
    Read-Host 'Press Enter to exit'
    exit 1
}
Pop-Location
Write-Success 'Frontend dependencies installed'

Write-Header '[STEP 6/7] Installing root npm dependencies (if any)'
$rootPackageJson = Join-Path $SCRIPT_DIR 'package.json'
if (Test-Path $rootPackageJson) {
    try {
        $rootPkg = Get-Content $rootPackageJson -Raw | ConvertFrom-Json
        $depCount = if ($rootPkg.dependencies) { ($rootPkg.dependencies.PSObject.Properties | Measure-Object).Count } else { 0 }
        if ($depCount -gt 0) {
            Push-Location $SCRIPT_DIR
            npm install
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-Error-Custom 'Failed to install root-level dependencies'
                Read-Host 'Press Enter to exit'
                exit 1
            }
            Pop-Location
            Write-Success 'Root-level dependencies installed'
        } else {
            Write-Success 'No root dependencies declared'
        }
    } catch {
        Write-Warn 'Could not parse root package.json. Skipping root npm install.'
    }
} else {
    Write-Success 'No root package.json found'
}

Write-Header '[STEP 7/7] Initializing databases and creating shortcuts'
Push-Location $BACKEND_DIR
Write-Step 'Bootstrapping company databases from app startup routine...'
& $VENV_PYTHON -c "import app; print('database bootstrap complete')"
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error-Custom 'Database bootstrap failed'
    Read-Host 'Press Enter to exit'
    exit 1
}

Write-Step 'Seeding/normalizing items...'
& $VENV_PYTHON seed_items.py
if ($LASTEXITCODE -ne 0) {
    Write-Warn 'Warning: seed_items.py reported an issue. Continuing.'
} else {
    Write-Success 'Item seeding completed'
}
Pop-Location

$desktop = [Environment]::GetFolderPath('Desktop')
$newStartScript = Join-Path $SCRIPT_DIR 'start-venv.ps1'
$legacyStartScript = Join-Path $SCRIPT_DIR 'start.ps1'

try {
    $wsh = New-Object -ComObject WScript.Shell

    $shortcutMain = $wsh.CreateShortcut((Join-Path $desktop 'PaperCone.lnk'))
    $shortcutMain.TargetPath = 'powershell.exe'
    $shortcutMain.Arguments = "-ExecutionPolicy Bypass -File `"$newStartScript`""
    $shortcutMain.WorkingDirectory = $SCRIPT_DIR
    $shortcutMain.Description = 'PaperCone Business Application (.venv)'
    $shortcutMain.Save()

    $shortcutLegacy = $wsh.CreateShortcut((Join-Path $desktop 'PaperCone-Legacy.lnk'))
    $shortcutLegacy.TargetPath = 'powershell.exe'
    $shortcutLegacy.Arguments = "-ExecutionPolicy Bypass -File `"$legacyStartScript`""
    $shortcutLegacy.WorkingDirectory = $SCRIPT_DIR
    $shortcutLegacy.Description = 'PaperCone Business Application (legacy launcher)'
    $shortcutLegacy.Save()

    Write-Success 'Desktop shortcuts created'
} catch {
    Write-Warn 'Could not create one or more desktop shortcuts (non-fatal)'
}

Write-Header 'INSTALLATION COMPLETE'
Write-Host 'Run one of the following:' -ForegroundColor Green
Write-Host '  1) .\start-venv.ps1   (recommended, always uses backend\.venv)'
Write-Host '  2) .\start.ps1        (legacy launcher)'
Write-Host ''
Write-Host 'Desktop shortcuts created:' -ForegroundColor Green
Write-Host '  • PaperCone.lnk (recommended .venv launcher)'
Write-Host '  • PaperCone-Legacy.lnk'
Write-Host ''

Read-Host 'Press Enter to exit'
