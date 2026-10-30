@echo off
title PhishGuard AI - Launch System
echo ====================================================
echo   PhishGuard AI - Automated Phishing Website Detection
echo   Full-Stack MERN + Machine Learning Architecture
echo ====================================================
echo.

echo Starting MongoDB service or fallback...
net start MongoDB >nul 2>&1

echo Starting Backend Server on port 8000...
start "PhishGuard AI Backend" cmd /k "cd /d "%~dp0..\backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server on port 5173...
start "PhishGuard AI Frontend" cmd /k "cd /d "%~dp0..\frontend" && npm run dev"

echo.
echo All services launched!
echo - Web Application: http://localhost:5173
echo - Backend API:     http://localhost:8000
echo - API Health:      http://localhost:8000/api/health
echo ====================================================
pause
