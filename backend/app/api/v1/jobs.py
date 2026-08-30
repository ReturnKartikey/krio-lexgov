import math
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    EnvelopeResponse,
    IngestionRunItem,
    PaginationMeta,
    SyncJobRequest,
    SyncJobResponse,
)
from app.core.database import AsyncSessionLocal, get_db
from app.db.models import IngestionRun
from app.etl.pipeline import ETLPipeline

router = APIRouter(prefix="/jobs", tags=["Ingestion Jobs"])


@router.get("", response_model=EnvelopeResponse[list[IngestionRunItem]])
async def list_jobs(
    status: str | None = Query(None, description="Filter by status (queued, running, success, partial, failed)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List historical and active registry crawler ingestion runs."""
    stmt = select(IngestionRun)
    count_stmt = select(func.count(IngestionRun.id))

    if status and status.strip():
        stmt = stmt.where(IngestionRun.status == status.strip().lower())
        count_stmt = count_stmt.where(IngestionRun.status == status.strip().lower())

    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one() or 0

    stmt = stmt.order_by(desc(IngestionRun.started_at))
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    runs = result.scalars().all()

    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1

    return EnvelopeResponse(
        data=[IngestionRunItem.model_validate(r) for r in runs],
        meta=PaginationMeta(
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{job_id}", response_model=IngestionRunItem)
async def get_job_detail(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed execution audit, record counts, and error log for a specific job."""
    stmt = select(IngestionRun).where(IngestionRun.id == job_id)
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Ingestion job not found")

    return IngestionRunItem.model_validate(run)


async def execute_background_sync(adapter_key: str, limit: int, incremental: bool):
    """Execute ETL run in background with fresh database session."""
    async with AsyncSessionLocal() as session:
        try:
            pipeline = ETLPipeline(adapter_key=adapter_key)
            await pipeline.run(
                db=session,
                triggered_by="manual_api",
                limit=limit,
                incremental=incremental,
            )
        except Exception:
            pass


@router.post("/sync", response_model=SyncJobResponse)
async def trigger_sync(
    payload: SyncJobRequest = SyncJobRequest(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger manual incremental or full synchronization from the public registry.
    Executes ETL pipeline and records ingestion audit trail.
    """
    try:
        pipeline = ETLPipeline(adapter_key=payload.adapter_key)
        run_record = await pipeline.run(
            db=db,
            triggered_by="manual_api",
            limit=payload.limit,
            incremental=payload.incremental,
        )

        return SyncJobResponse(
            message=f"Sync completed with status: {run_record.status}",
            run_id=run_record.id,
            status=run_record.status,
            records_seen=run_record.records_seen,
            records_added=run_record.records_added,
            records_updated=run_record.records_updated,
            records_failed=run_record.records_failed,
            duration_seconds=float(run_record.duration_seconds) if run_record.duration_seconds else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute ingestion sync: {str(e)}")
