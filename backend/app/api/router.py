from fastapi import APIRouter
from app.api.v1.records import router as records_router
from app.api.v1.entities import router as entities_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.health import router as health_router
from app.api.v1.ai import router as ai_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(records_router)
api_router.include_router(entities_router)
api_router.include_router(analytics_router)
api_router.include_router(jobs_router)
api_router.include_router(ai_router)
