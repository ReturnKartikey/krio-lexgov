#!/bin/sh
set -e

echo "Checking database connectivity..."
python -c "
import os, time, psycopg
url = os.environ.get('SYNC_DATABASE_URL', '')
if url:
    for i in range(30):
        try:
            conn = psycopg.connect(url, connect_timeout=3)
            conn.close()
            print('PostgreSQL connection verified.')
            break
        except Exception as e:
            print(f'Waiting for PostgreSQL ({i+1}/30)...')
            time.sleep(1)
" || true

echo "Running database migrations with Alembic..."
alembic upgrade head || echo "Alembic migration notice: tables will be verified on application startup."

echo "Starting OpenGov FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
