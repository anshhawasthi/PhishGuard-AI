# PhishGuard AI - Unified Windows PowerShell Launcher
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  PhishGuard AI - Automated Phishing Website Detection" -ForegroundColor White
Write-Host "  Full-Stack MERN + Machine Learning Architecture" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Attempt MongoDB service start
Start-Service -Name MongoDB -ErrorAction SilentlyContinue

# 2. Start Backend
$backendDir = Join-Path $PSScriptRoot "..\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev"

Start-Sleep -Seconds 3

# 3. Start Frontend
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

Write-Host "`nSystem Services Initialized!" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Health Check: http://localhost:8000/api/health" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
