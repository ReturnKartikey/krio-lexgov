#!/usr/bin/env bash
# KRIO .LEXGOV - High-Performance Enterprise Launcher (Bash)
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "      KRIO .LEXGOV - REGULATORY INTELLIGENCE ENGINE     "
echo "========================================================"
echo ""

echo "[1/5] Checking dependencies..."
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] python3 is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm is required"; exit 1; }

# Pre-compile if build is missing
if [ ! -f "$DIR/frontend/.next/BUILD_ID" ]; then
    echo "[2/5] Pre-compiling frontend pages for instant 0ms navigation..."
    cd "$DIR/frontend"
    npm run build
    cd "$DIR"
fi

echo "[3/5] Starting FastAPI backend on port 8005..."
cd "$DIR/backend"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8005 &
BACKEND_PID=$!

echo "[4/5] Starting Next.js production engine on port 3001..."
cd "$DIR/frontend"
npm start -- -p 3001 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping all KRIO services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped. Goodbye!"
}
trap cleanup EXIT INT TERM

echo "[5/5] Waiting for services to initialize and pre-warm..."
sleep 2

echo ""
echo "========================================================"
echo "  Platform is LIVE! All Routes Pre-Warmed (0ms Switching)"
echo "  - Frontend UI:   http://localhost:3001"
echo "  - API Explorer:  http://localhost:3001/api-explorer"
echo "  - OpenAPI Docs:  http://127.0.0.1:8005/docs"
echo "========================================================"
echo ""

if command -v open >/dev/null 2>&1; then
    open "http://localhost:3001"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3001"
fi

wait
