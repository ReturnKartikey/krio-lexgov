import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import logger
from app.scheduler.runner import (
    bootstrap_initial_data_if_empty,
    shutdown_scheduler,
    start_scheduler,
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


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KRIO // OpenAPI Specification 3.1</title>
  <link rel="icon" type="image/png" href="https://raw.githubusercontent.com/ReturnKartikey/krio-lexgov/main/frontend/public/icon_logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    :root {
      --brivo-navy: #1a2333;
      --brivo-void: #0b1020;
      --brivo-cyan: #00c2d1;
      --brivo-mist: #d9f5f8;
      --brivo-slate: #98a2b3;
      --brivo-paper: #faf8fc;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      background-color: #faf8fc;
      background-size: 48px 48px;
      background-image: 
        linear-gradient(to right, rgba(26, 35, 51, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(26, 35, 51, 0.035) 1px, transparent 1px);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a2333;
      -webkit-font-smoothing: antialiased;
    }

    /* Custom Editorial Top Navigation */
    .krio-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(26, 35, 51, 0.10);
      padding: 12px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.03);
    }
    
    .krio-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #1a2333;
    }
    
    .krio-logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.12);
    }
    
    .krio-brand-text {
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.02em;
    }
    
    .krio-brand-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #98a2b3;
      font-weight: 500;
    }
    
    .krio-nav-links {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .krio-nav-btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-decoration: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
    
    .krio-nav-btn-secondary {
      background: #ffffff;
      color: #1a2333;
      border: 1px solid rgba(26, 35, 51, 0.12);
      box-shadow: 0 1px 2px rgba(11, 16, 32, 0.04);
    }
    .krio-nav-btn-secondary:hover {
      background: #faf8fc;
      border-color: #00c2d1;
      color: #0e7490;
    }
    
    .krio-nav-btn-primary {
      background: #1a2333;
      color: #faf8fc;
      border: 1px solid #1a2333;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.15);
    }
    .krio-nav-btn-primary:hover {
      background: #0b1020;
    }

    /* Swagger UI Container Resets */
    .swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 24px 80px 24px;
      font-family: 'Inter', sans-serif;
    }

    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .info {
      margin: 12px 0 36px 0;
      background: #ffffff;
      border: 1px solid rgba(26, 35, 51, 0.08);
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 2px 8px rgba(11, 16, 32, 0.03);
    }

    .swagger-ui .info .title {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 28px;
      letter-spacing: -0.03em;
      color: #1a2333;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .swagger-ui .info .title small {
      background: #d9f5f8;
      color: #0e7490;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 9999px;
      border: 1px solid rgba(0, 194, 209, 0.35);
      vertical-align: middle;
    }

    .swagger-ui .info p {
      font-size: 13.5px;
      line-height: 1.7;
      color: #475467;
      font-family: 'Inter', sans-serif;
      margin-top: 12px;
    }

    /* Custom Filter / Search Input */
    .swagger-ui .filter-wrapper {
      padding: 0 0 24px 0;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(26, 35, 51, 0.08);
    }

    .swagger-ui .filter-wrapper .operation-filter-input {
      width: 100%;
      padding: 12px 20px 12px 42px;
      background-color: #ffffff;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2398a2b3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 14px center;
      border: 1px solid rgba(26, 35, 51, 0.15);
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #1a2333;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.04);
      outline: none;
      transition: all 0.2s ease;
    }

    .swagger-ui .filter-wrapper .operation-filter-input:focus {
      border-color: #00c2d1;
      box-shadow: 0 0 0 3px rgba(0, 194, 209, 0.18), 0 2px 8px rgba(11, 16, 32, 0.06);
    }

    .swagger-ui .filter-wrapper .operation-filter-input::placeholder {
      color: #98a2b3;
    }

    /* Scheme & Server bar */
    .swagger-ui .scheme-container {
      background: #ffffff;
      border: 1px solid rgba(26, 35, 51, 0.08);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.03);
      padding: 14px 20px;
      margin-bottom: 24px;
    }

    /* Operation Tags */
    .swagger-ui .opblock-tag {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 17px;
      color: #1a2333;
      border-bottom: 1px solid rgba(26, 35, 51, 0.08);
      padding-bottom: 10px;
      margin-top: 32px;
    }

    .swagger-ui .opblock-tag small {
      font-size: 12px;
      color: #98a2b3;
      font-weight: 400;
      margin-left: 8px;
    }

    /* Operation Cards */
    .swagger-ui .opblock {
      background: #ffffff;
      border: 1px solid rgba(26, 35, 51, 0.09);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(11, 16, 32, 0.02);
      margin: 0 0 12px 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    .swagger-ui .opblock:hover {
      border-color: rgba(26, 35, 51, 0.22);
      box-shadow: 0 4px 16px -2px rgba(11, 16, 32, 0.06);
      transform: translateY(-1px);
    }

    .swagger-ui .opblock .opblock-summary {
      padding: 12px 18px;
    }

    .swagger-ui .opblock .opblock-summary-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #1a2333;
    }

    .swagger-ui .opblock .opblock-summary-description {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #667085;
    }

    /* Method Badges */
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      padding: 5px 12px;
      min-width: 60px;
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #d9f5f8;
      color: #0e7490;
      border: 1px solid #67e8f9;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      padding: 5px 12px;
      min-width: 60px;
    }

    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #ffe4e6;
      color: #be123c;
      border: 1px solid #fecdd3;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      padding: 5px 12px;
      min-width: 60px;
    }

    .swagger-ui .opblock.opblock-put .opblock-summary-method,
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      padding: 5px 12px;
      min-width: 60px;
    }

    /* Inner Body & Forms */
    .swagger-ui .opblock-body {
      background: #ffffff;
      border-top: 1px solid rgba(26, 35, 51, 0.08);
      padding: 20px;
    }

    .swagger-ui .opblock-section-header {
      background: #faf8fc;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid rgba(26, 35, 51, 0.06);
    }

    .swagger-ui .opblock-section-header h4 {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #98a2b3;
    }

    /* Buttons */
    .swagger-ui .btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 500;
      border-radius: 9999px;
      padding: 6px 16px;
      transition: all 0.2s ease;
      box-shadow: none;
    }

    .swagger-ui .btn.execute {
      background: #1a2333;
      color: #faf8fc;
      border: 1px solid #1a2333;
    }

    .swagger-ui .btn.execute:hover {
      background: #0b1020;
    }

    .swagger-ui .btn.try-out__btn {
      border: 1px solid rgba(26, 35, 51, 0.15);
      background: #faf8fc;
      color: #1a2333;
    }

    .swagger-ui .btn.try-out__btn:hover {
      background: #ffffff;
      border-color: #00c2d1;
    }

    /* Tables & Inputs */
    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      color: #98a2b3;
      border-bottom: 1px solid rgba(26, 35, 51, 0.10);
    }

    .swagger-ui input[type=text],
    .swagger-ui select,
    .swagger-ui textarea {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      border: 1px solid rgba(26, 35, 51, 0.15);
      border-radius: 8px;
      background: #faf8fc;
      padding: 8px 12px;
      color: #1a2333;
      outline: none;
    }

    .swagger-ui input[type=text]:focus,
    .swagger-ui select:focus,
    .swagger-ui textarea:focus {
      border-color: #1a2333;
      box-shadow: 0 0 0 2px rgba(0, 194, 209, 0.2);
    }

    /* Code Blocks & Response Highlight */
    .swagger-ui .highlight-code {
      background: #0b1020 !important;
      border-radius: 10px;
      padding: 12px;
    }

    .swagger-ui .microlight {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 12px !important;
      color: #faf8fc !important;
    }

    .swagger-ui .model-box {
      background: #faf8fc;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid rgba(26, 35, 51, 0.08);
    }

    .swagger-ui section.models {
      background: #ffffff;
      border: 1px solid rgba(26, 35, 51, 0.08);
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(11, 16, 32, 0.03);
      margin-top: 36px;
    }

    .swagger-ui section.models h4 {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      color: #1a2333;
      font-size: 16px;
      padding: 16px 20px;
    }
  </style>
</head>
<body>
  <header class="krio-header">
    <a href="https://krio-rust.vercel.app" class="krio-brand" target="_blank" rel="noopener noreferrer">
      <div class="krio-logo-badge">
        <img src="https://raw.githubusercontent.com/ReturnKartikey/krio-lexgov/main/frontend/public/icon_logo.png" alt="KRIO Emblem" style="width: 32px; height: 32px; object-fit: contain;" />
      </div>
      <div>
        <span class="krio-brand-text">KRIO</span>
        <span class="krio-brand-sub">.LEXGOV</span>
      </div>
    </a>
    <div class="krio-nav-links">
      <a href="https://krio-rust.vercel.app/api-explorer" target="_blank" rel="noopener noreferrer" class="krio-nav-btn krio-nav-btn-secondary">Interactive Console</a>
      <a href="/api/openapi.json" target="_blank" class="krio-nav-btn krio-nav-btn-primary">OpenAPI JSON</a>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)


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
