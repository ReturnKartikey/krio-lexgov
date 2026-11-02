import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import logger
from app.core.swagger import get_custom_swagger_html
from app.scheduler.runner import (
    bootstrap_initial_data_if_empty,
    shutdown_scheduler,
    start_scheduler,
)

settings = get_settings()


_background_tasks: set[asyncio.Task] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # Run initial seed check asynchronously with anchored task reference
    if settings.AUTO_SEED_FALLBACK:
        task = asyncio.create_task(bootstrap_initial_data_if_empty())
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)

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
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

# GZip Compression Middleware for ultra-fast API payloads
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    detail = str(exc) if settings.DEBUG else "An internal server error occurred."
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_custom_swagger_html(openapi_url=f"{settings.API_V1_STR}/openapi.json")



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
