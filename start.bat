@echo off
echo ================================================
echo  Student Performance Prediction System
echo ================================================
echo.
echo Starting Flask Backend...
echo.
cd /d "%~dp0backend"
start "Flask Backend" cmd /k "python app.py"
echo Backend starting on http://localhost:5000
echo.
timeout /t 5 /nobreak > nul
echo Starting React Frontend...
cd /d "%~dp0frontend"
start "React Frontend" cmd /k "npm run dev"
echo Frontend starting on http://localhost:5173
echo.
echo ================================================
echo  Both servers are starting...
echo  Open http://localhost:5173 in your browser
echo  
echo  First time? Go to http://localhost:5173/register-faculty
echo  to create a Faculty account.
echo ================================================
