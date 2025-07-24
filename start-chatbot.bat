@echo off
echo.
echo ================================================
echo  🤖 Rental System Chatbot Testing Suite
echo ================================================
echo.

echo 1. Starting Flask Backend...
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

:: Navigate to backend directory
cd /d "%~dp0backend"

:: Check if virtual environment exists
if exist "venv" (
    echo ✅ Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo ⚠️ No virtual environment found. Using system Python...
)

:: Install requirements if needed
if exist "requirements.txt" (
    echo 📦 Installing/updating requirements...
    pip install -r requirements.txt >nul 2>&1
)

:: Start the Flask backend in background
echo 🚀 Starting Flask backend server...
start "Rental System Backend" /min python app.py

:: Wait a moment for server to start
timeout /t 5 /nobreak >nul

:: Navigate back and test chatbot
cd /d "%~dp0"

echo.
echo 2. Testing Chatbot API...
echo.

:: Run chatbot tests
python test_chatbot.py

echo.
echo 3. Opening Demo Pages...
echo.

:: Open demo page in browser
start "" "http://localhost:5000/health"
timeout /t 2 /nobreak >nul
start "" "fronted/chatbot-demo.html"
timeout /t 2 /nobreak >nul  
start "" "fronted/home.html"

echo.
echo ================================================
echo  🎉 Chatbot System Ready!
echo ================================================
echo.
echo 📱 Demo Pages Opened:
echo   • Chatbot Demo: fronted/chatbot-demo.html
echo   • Landing Page: fronted/home.html
echo   • Backend Health: http://localhost:5000/health
echo.
echo 💬 Try asking the chatbot:
echo   • "What features does this system have?"
echo   • "How do I register for an account?"
echo   • "Show me available properties"
echo   • "What are the pricing options?"
echo.
echo 🛑 To stop the backend server:
echo   • Close the "Rental System Backend" window
echo   • Or press Ctrl+C in the backend terminal
echo.

pause
