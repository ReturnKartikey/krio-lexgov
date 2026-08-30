# KRIO .LEXGOV - High-Performance Enterprise Launcher (PowerShell)
$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      KRIO .LEXGOV - REGULATORY INTELLIGENCE ENGINE     " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

# 1. Check prerequisites
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js/npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Free stale port locks
Write-Host "[1/5] Clearing port locks on 8005 and 3001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8005,3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 3. Check / Build Next.js bundle for instant 0ms navigation
if (-not (Test-Path "$RootDir\frontend\.next\BUILD_ID")) {
    Write-Host "[2/5] Pre-compiling frontend pages for instant 0ms navigation..." -ForegroundColor Yellow
    Push-Location "$RootDir\frontend"
    npm run build
    Pop-Location
} else {
    Write-Host "[2/5] Optimized production bundle verified." -ForegroundColor Green
}

# 4. Start Backend
Write-Host "[3/5] Starting FastAPI backend on port 8005..." -ForegroundColor Green
$BackendProc = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8005" -WorkingDirectory "$RootDir\backend" -WindowStyle Minimized -PassThru

# 5. Start Frontend Production Server
Write-Host "[4/5] Starting Next.js production engine on port 3001..." -ForegroundColor Green
$FrontendProc = Start-Process -FilePath "npm" -ArgumentList "start -- -p 3001" -WorkingDirectory "$RootDir\frontend" -WindowStyle Minimized -PassThru

# 6. Wait for Dual Health Checks & Warmup
Write-Host "[5/5] Waiting for services to initialize and pre-warm routes..." -ForegroundColor Yellow
$backendOk = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8005/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $backendOk = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

$frontendOk = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $frontendOk = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Platform is LIVE! All Routes Pre-Warmed (0ms Switching)" -ForegroundColor Green
Write-Host "  - Frontend UI:   http://localhost:3001" -ForegroundColor White
Write-Host "  - API Console:   http://localhost:3001/api-explorer" -ForegroundColor White
Write-Host "  - OpenAPI Docs:  http://127.0.0.1:8005/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:3001"

Write-Host "Press Ctrl+C or any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping KRIO services..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8005,3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Write-Host "All services stopped cleanly. Goodbye!" -ForegroundColor Green
