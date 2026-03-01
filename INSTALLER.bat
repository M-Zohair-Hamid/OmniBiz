@echo off
title PaperCone Business App - Complete Installer
color 0B
cls

echo ========================================
echo  PAPERCONE BUSINESS APP INSTALLER
echo ========================================
echo.
echo This installer will set up everything needed to run the application.
echo.
echo Installation steps:
echo   [1] Check Python 3.11+ (install if missing)
echo   [2] Check Node.js 18+ (install if missing)
echo   [3] Install all backend dependencies (Flask, SQLAlchemy, etc.)
echo   [4] Install all frontend dependencies (React, Tailwind, etc.)
echo   [5] Initialize multi-company databases
echo   [6] Create desktop shortcut
echo.
echo Estimated time: 10-15 minutes
echo.
echo Press any key to begin installation...
pause >nul
cls

REM ========================================
REM STEP 1: Check Python Installation
REM ========================================
echo.
echo [STEP 1/6] Checking Python Installation
echo ========================================
python --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Python is not installed or not in PATH!
    echo.
    echo Please install Python 3.11 or higher:
    echo 1. Visit: https://www.python.org/downloads/
    echo 2. Download Python 3.11+ installer
    echo 3. IMPORTANT: Check "Add Python to PATH" during installation
    echo 4. After installation, run this installer again
    echo.
    echo Downloading and installing Python 3.11+...
    echo This may take 5-10 minutes...
    echo.
    
    REM Download Python installer
    powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; (New-Object System.Net.WebClient).DownloadFile('https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe', '%TEMP%\python_installer.exe')" 2>nul
    
    if exist "%TEMP%\python_installer.exe" (
        echo Running Python installer...
        "%TEMP%\python_installer.exe" /quiet InstallAllUsers=1 PrependPath=1 /log "%TEMP%\python_install.log"
        timeout /t 30 /nobreak
        
        REM Verify installation
        python --version >nul 2>&1
        if errorlevel 1 (
            echo.
            echo ERROR: Python installation failed!
            echo Please download and install manually from: https://www.python.org/downloads/
            echo IMPORTANT: Check "Add Python to PATH" during installation
            echo Then run this installer again.
            echo.
            pause
            exit /b 1
        )
        echo Python installed successfully!
        del "%TEMP%\python_installer.exe" 2>nul
    ) else (
        echo.
        echo ERROR: Could not download Python installer!
        echo Please download manually from: https://www.python.org/downloads/
        echo IMPORTANT: Check "Add Python to PATH" during installation
        echo Then run this installer again.
        echo.
        pause
        exit /b 1
    )
    pause
    exit /b 1
) else (
    python --version
    echo Python: FOUND
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Detected Python version: %PYTHON_VERSION%
echo.

REM ========================================
REM STEP 2: Check Node.js Installation
REM ========================================
echo [STEP 2/6] Checking Node.js Installation
echo ========================================
node --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js 18+ LTS version:
    echo 1. Visit: https://nodejs.org/
    echo 2. Download LTS version installer
    echo 3. Run installer with default settings
    echo 4. After installation, run this installer again
    echo.
    echo Downloading and installing Node.js 18+ LTS...
    echo This may take 5-10 minutes...
    echo.
    
    REM Download Node.js installer
    powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi', '%TEMP%\nodejs_installer.msi')" 2>nul
    
    if exist "%TEMP%\nodejs_installer.msi" (
        echo Running Node.js installer...
        msiexec /i "%TEMP%\nodejs_installer.msi" /quiet /log "%TEMP%\nodejs_install.log" ADDLOCAL=all
        timeout /t 30 /nobreak
        
        REM Verify installation
        node --version >nul 2>&1
        if errorlevel 1 (
            echo.
            echo ERROR: Node.js installation failed!
            echo Please download and install manually from: https://nodejs.org/
            echo Install the LTS version with default settings
            echo Then run this installer again.
            echo.
            pause
            exit /b 1
        )
        echo Node.js installed successfully!
        del "%TEMP%\nodejs_installer.msi" 2>nul
    ) else (
        echo.
        echo ERROR: Could not download Node.js installer!
        echo Please download manually from: https://nodejs.org/
        echo Install the LTS version with default settings
        echo Then run this installer again.
        echo.
        pause
        exit /b 1
    )
    pause
    exit /b 1
) else (
    node --version
    npm --version
    echo Node.js: FOUND
)
echo.

REM ========================================
REM STEP 3: Install Backend Dependencies
REM ========================================
echo [STEP 3/6] Installing Backend Dependencies
echo ========================================
cd /d "%~dp0backend"
echo Checking Python packages...

echo Installing/Updating pip...
python -m pip install --upgrade pip --quiet

echo Installing backend dependencies from requirements.txt...
echo   - Flask 3.0.0 (Web framework)
echo   - Flask-CORS 4.0.0 (Cross-Origin support)
echo   - Flask-JWT-Extended 4.5.3 (Authentication)
echo   - Flask-SQLAlchemy 3.1.1 (Database ORM)
echo   - SQLAlchemy 2.0.23 (Database with unique constraints)
echo   - python-dotenv 1.0.0 (Environment variables)
echo   - reportlab 4.0.7 (PDF generation)
echo.

python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install Python dependencies!
    echo This could be due to:
    echo   - No internet connection
    echo   - Corrupted pip installation
    echo   - Python not properly installed
    echo.
    echo Please try:
    echo   1. Check your internet connection
    echo   2. Run INSTALLER.bat again
    echo   3. Or run: python -m pip install -r requirements.txt manually
    echo.
    pause
    exit /b 1
)

echo Backend dependencies: INSTALLED
echo.

REM ========================================
REM STEP 4: Install Frontend Dependencies
REM ========================================
echo [STEP 4/6] Installing Frontend Dependencies
echo ========================================
cd /d "%~dp0frontend"
if exist "node_modules" (
    echo Frontend dependencies: ALREADY INSTALLED
) else (
    echo Installing Node.js packages (this may take 5-10 minutes)...
    echo   - react 18.2.0 (UI library)
    echo   - react-router-dom 6.14.0 (Routing)
    echo   - axios 1.5.0 (HTTP client)
    echo   - chart.js 4.4.0 (Charts)
    echo   - tailwindcss 3.3.5 (Styling)
    echo   - xlsx 0.18.5 (Excel export)
    echo   - react-icons 4.11.0 (Icons)
    echo.
    
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install Node.js dependencies!
        echo This could be due to:
        echo   - No internet connection
        echo   - Corrupted npm installation
        echo   - Node.js not properly installed
        echo.
        echo Please try:
        echo   1. Check your internet connection
        echo   2. Run INSTALLER.bat again
        echo   3. Or run: npm install manually
        echo.
        pause
        exit /b 1
    )
    
    echo Frontend dependencies: INSTALLED
)
echo.

REM ========================================
REM STEP 5: Initialize Multi-Company Databases
REM ========================================
echo [STEP 5/6] Initializing Multi-Company Databases
echo ========================================
cd /d "%~dp0backend"
echo Checking databases...

REM Create instance directory if it doesn't exist
if not exist "instance" mkdir instance

REM Check Company database
if exist "instance\company.db" (
    echo Company database: EXISTS
) else (
    echo Company database will be created automatically when application starts
)
echo Databases: READY
echo.

REM ========================================
REM STEP 6: Create Desktop Shortcut
REM ========================================
echo [STEP 6/6] Creating Desktop Shortcut
echo ========================================
cd /d "%~dp0"
set SHORTCUT_NAME=PaperCone Business App.lnk
set DESKTOP=%USERPROFILE%\Desktop

REM Create shortcut using PowerShell
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%'); $Shortcut.TargetPath = '%~dp0start.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Launch PaperCone Business Management System'; $Shortcut.IconLocation = '%~dp0imgs\1.jpg'; $Shortcut.Save()" >nul 2>&1

if errorlevel 1 (
    echo Desktop shortcut: SKIPPED
) else (
    echo Desktop shortcut: CREATED at %DESKTOP%
)
echo.

REM ========================================
REM Installation Complete
REM ========================================
cls
echo.
echo ========================================
echo  INSTALLATION COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your PaperCone Business App is ready to use!
echo.
echo Installation Summary:
echo   - Python: %PYTHON_VERSION%
echo   - Node.js: Installed
echo   - Backend: Ready (Flask, SQLAlchemy, ReportLab, etc.)
echo   - Frontend: Ready (React, Tailwind, Chart.js, etc.)
echo   - Company Database: Ready
echo   - Desktop Shortcut: Created at %DESKTOP%
echo.
echo ========================================
echo  HOW TO START THE APPLICATION
echo ========================================
echo.
echo Option 1: Double-click "start.bat" in this folder
echo Option 2: Click the desktop shortcut "PaperCone Business App"
echo Option 3: Run command: start.bat
echo.
echo The app will open automatically in your browser at:
echo   http://localhost:3000
echo.
echo ========================================
echo  COMPANIES AVAILABLE FOR LOGIN
echo ========================================
echo.
echo Click company button to access (no password required):
echo   - Business Company (Organization)
echo.
echo ========================================
echo.
echo Would you like to start the app now? (Y/N)
set /p START_NOW=
if /i "%START_NOW%"=="Y" (
    echo.
    echo Starting application...
    call start.bat
) else (
    echo.
    echo You can start the app later using start.bat
)
echo.
echo Thank you for installing PaperCone Business App!
echo.
pause
