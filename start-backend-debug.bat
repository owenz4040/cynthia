@echo off
echo ========================================
echo Starting Rental House Booking Backend
echo ========================================

cd /d "%~dp0backend"

echo Checking Python installation...
python --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/updating dependencies...
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting Flask server...
python app.py

pause
