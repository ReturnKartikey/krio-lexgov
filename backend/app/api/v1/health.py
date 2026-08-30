import time

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import HealthResponse
from app.core.config import get_settings
from app.core.database import get_db
from app.db.models import Entity, Record

router = APIRouter(tags=["Health"])
settings = get_settings()

START_TIME = time.monotonic()


@router.get("/health", response_model=HealthResponse)
async def get_health(db: AsyncSession = Depends(get_db)):
    """System health check verifying database and cache connectivity and basic statistics."""
    db_status = "healthy"
    total_records = 0
    total_entities = 0

    try:
        await db.execute(text("SELECT 1"))
        r_stmt = select(func.count(Record.id))
        e_stmt = select(func.count(Entity.id))
        total_records = (await db.execute(r_stmt)).scalar_one() or 0
        total_entities = (await db.execute(e_stmt)).scalar_one() or 0
    except Exception as e:
        db_status = f"unhealthy: {e}"

    redis_status = "disabled"
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await r.ping()
        redis_status = "healthy"
        await r.aclose()
    except Exception:
        redis_status = "unavailable"

    uptime = round(time.monotonic() - START_TIME, 2)

    overall_status = "healthy" if db_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.VERSION,
        database=db_status,
        redis=redis_status,
        total_records=total_records,
        total_entities=total_entities,
        uptime_seconds=uptime,
    )
