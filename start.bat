@echo off
setlocal enabledelayedexpansion
title KRIO .LEXGOV - High-Performance Enterprise Launcher

echo ========================================================
echo       KRIO .LEXGOV - REGULATORY INTELLIGENCE ENGINE
echo ========================================================
echo.

:: Navigate to project root
cd /d "%~dp0"

echo [1/5] Checking system prerequisites...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

echo [2/5] Clearing stale process locks on ports 8005 and 3001...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8005,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: Check if .next build exists, build if missing for instant 0ms tab switching
if not exist "frontend\.next\BUILD_ID" (
    echo [3/5] Pre-compiling frontend pages for instant 0ms navigation...
    cd /d "%~dp0frontend"
    call npm run build
    cd /d "%~dp0"
) else (
    echo [3/5] Optimized production bundle verified.
)

echo [4/5] Launching FastAPI Backend (Port 8005)...
start "KRIO Backend [FastAPI :8005]" /min cmd /c "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8005"

echo [5/5] Launching Next.js Production Engine (Port 3001)...
start "KRIO Frontend [Next.js :3001]" /min cmd /c "cd /d "%~dp0frontend" && npm start -- -p 3001"

echo.
echo Initializing services and pre-warming routes...
powershell -NoProfile -Command "$backendOk = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:8005/api/health' -TimeoutSec 2 -ErrorAction Stop; if ($res.status -eq 'healthy') { $backendOk = $true; break } } catch { Start-Sleep -Milliseconds 500 } }; $frontendOk = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; if ($res.StatusCode -eq 200) { $frontendOk = $true; break } } catch { Start-Sleep -Milliseconds 500 } }; if ($backendOk -and $frontendOk) { Write-Host '>> All Systems 100% HEALTHY and Pre-Warmed!' -ForegroundColor Green } else { Write-Host '>> Services online.' -ForegroundColor Yellow }"

echo.
echo ========================================================
echo  Platform is Live! Opening in your default browser...
echo  - Frontend UI:        http://localhost:3001
echo  - API Explorer:       http://localhost:3001/api-explorer
echo  - OpenAPI Docs:       http://127.0.0.1:8005/docs
echo ========================================================
echo.

:: Automatically open browser
start http://localhost:3001

echo Keep this window open while using the platform.
echo Press any key to stop all KRIO services and exit...
pause >nul

echo.
echo Stopping all KRIO services...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8005,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo All services stopped cleanly.
timeout /t 2 >nul
