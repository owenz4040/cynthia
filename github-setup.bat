@echo off
echo ================================
echo  GitHub Setup for Rental System
echo ================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit: Rental House Booking System with AI Chatbot"

echo.
echo ========================================
echo  NEXT STEPS (Manual):
echo ========================================
echo.
echo 1. Go to https://github.com and create a new repository
echo 2. Name it: rental-house-system (or your preferred name)
echo 3. DON'T initialize with README (you already have one)
echo 4. Copy the repository URL
echo.
echo 5. Run these commands (replace YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/rental-house-system.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 6. Go to https://render.com to deploy
echo 7. Follow the DEPLOYMENT.md guide
echo.
echo ========================================
echo Repository is ready for GitHub upload!
echo ========================================
pause
