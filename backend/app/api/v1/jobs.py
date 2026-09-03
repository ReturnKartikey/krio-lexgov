import math
import uuid
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.sebi_orders import SAMPLE_SEBI_DATA
from app.api.schemas import (
    EnvelopeResponse,
    IngestionRunItem,
    PaginationMeta,
    SyncJobRequest,
    SyncJobResponse,
)
from app.core.database import AsyncSessionLocal, get_db
from app.db.models import IngestionRun, Record, RecordEntity
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

    if isinstance(status, str) and status.strip():
        stmt = stmt.where(IngestionRun.status == status.strip().lower())
        count_stmt = count_stmt.where(IngestionRun.status == status.strip().lower())

    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one() or 0

    p_num = page if isinstance(page, int) else 1
    p_size = page_size if isinstance(page_size, int) else 20

    stmt = stmt.order_by(desc(IngestionRun.started_at))
    offset = (p_num - 1) * p_size
    stmt = stmt.offset(offset).limit(p_size)

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
            legacy_ids = [
                "SEBI-FINVEST-AO-2026",
                "SEBI-BROKING-AO-2026",
                "SEBI-WAAREE-AUG-2026",
                "SEBI-SANWARIA-2026",
                "SEBI-PENALTY-2026",
                "SEBI-RADHIKA-2026",
                "SEBI-FORTIS-AO-2026",
                "SEBI-CORPORATE-2026",
                "SEBI-INSIDER-2026",
                "SEBI-RECOVERY-2026",
                "SEBI-ZENITH-2026",
                "SEBI-WINSOME-2026",
            ]
            for leg_id in legacy_ids:
                rec_stmt = select(Record).where(Record.external_id == leg_id)
                rec_res = await session.execute(rec_stmt)
                rec = rec_res.scalar_one_or_none()
                if rec:
                    await session.execute(delete(RecordEntity).where(RecordEntity.record_id == rec.id))
                    await session.execute(delete(Record).where(Record.id == rec.id))

            # Update all seed records to exact static ISO published dates and verified PDF penalty amounts
            for item in SAMPLE_SEBI_DATA:
                await session.execute(
                    update(Record)
                    .where(Record.external_id == item["external_id"])
                    .values(
                        published_date=date.fromisoformat(item["published_date"]),
                        amount=item["amount"],
                        source_url=item["source_url"],
                        title=item["title"],
                        summary=item["summary"],
                        state=item.get("state", "Maharashtra"),
                        jurisdiction=item.get("jurisdiction", "Head Office, Mumbai"),
                    )
                )
            await session.commit()

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
    Executes ETL pipeline asynchronously in background to prevent HTTP gateway timeouts.
    """
    try:
        from app.core.config import get_settings
        settings = get_settings()

        if settings.ENVIRONMENT == "test":
            pipeline = ETLPipeline(adapter_key=payload.adapter_key)
            run = await pipeline.run(
                db=db,
                triggered_by="manual_api",
                limit=payload.limit,
                incremental=payload.incremental,
            )
            return SyncJobResponse(
                message=f"Ingestion sync completed for adapter: {payload.adapter_key}",
                run_id=run.id,
                status=run.status,
                records_seen=run.records_seen,
                records_added=run.records_added,
                records_updated=run.records_updated,
                records_failed=run.records_failed,
                duration_seconds=run.duration_seconds,
            )

        run_id = uuid.uuid4()
        background_tasks.add_task(
            execute_background_sync,
            payload.adapter_key,
            payload.limit,
            payload.incremental,
        )

        return SyncJobResponse(
            message=f"Ingestion sync initiated in background for adapter: {payload.adapter_key}",
            run_id=run_id,
            status="queued",
            records_seen=0,
            records_added=0,
            records_updated=0,
            records_failed=0,
            duration_seconds=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate ingestion sync: {str(e)}")
