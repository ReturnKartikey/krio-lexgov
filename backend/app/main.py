import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import logger
from app.api.router import api_router
from app.scheduler.runner import (
    start_scheduler,
    shutdown_scheduler,
    bootstrap_initial_data_if_empty,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    
    # Run initial seed check asynchronously
    if settings.AUTO_SEED_FALLBACK:
        asyncio.create_task(bootstrap_initial_data_if_empty())

    if settings.ENABLE_SCHEDULER_ON_STARTUP:
        start_scheduler()

    yield

    # Shutdown actions
    shutdown_scheduler()
    logger.info("Application shutdown completed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Portfolio-grade Public Regulatory Intelligence Platform for Indian Government Registries.\n\n"
        "Features:\n"
        "- Full-text indexing and PostgreSQL Trigram fuzzy search on SEBI Adjudication Orders\n"
        "- Pluggable Source Adapter ETL architecture\n"
        "- Entity extraction, penalty tracking, and multi-entity role graphs\n"
        "- Near-duplicate order detection using text similarity and entity overlap\n"
        "- Ingestion audit trail with traceable raw snapshots and hashes"
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please refer to server logs."},
    )


# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "records": f"{settings.API_V1_STR}/records",
        "analytics": f"{settings.API_V1_STR}/analytics/trends",
    }
