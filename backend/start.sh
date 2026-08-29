#!/bin/sh
set -e

echo "Running database migrations with Alembic..."
alembic upgrade head

echo "Starting OpenGov FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
