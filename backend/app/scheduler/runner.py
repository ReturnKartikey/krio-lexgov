from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import func, select

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.logging import logger
from app.db.models import Record
from app.etl.pipeline import ETLPipeline

settings = get_settings()
scheduler = AsyncIOScheduler()


async def scheduled_crawl_job():
    """Periodic background crawler job."""
    logger.info("Executing scheduled incremental crawl job...")
    async with AsyncSessionLocal() as session:
        try:
            pipeline = ETLPipeline(adapter_key="sebi_adjudication_orders")
            run = await pipeline.run(
                db=session,
                triggered_by="scheduler",
                limit=50,
                incremental=True,
            )
            logger.info(f"Scheduled crawl finished: status={run.status}, added={run.records_added}")
        except Exception as e:
            logger.error(f"Scheduled crawl failed: {e}", exc_info=True)


async def bootstrap_initial_data_if_empty():
    """On startup, if records table is empty, run initial seed ingestion automatically."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            stmt = select(func.count(Record.id))
            res = await session.execute(stmt)
            count = res.scalar_one() or 0
            if count == 0:
                logger.info("Database is empty. Running initial bootstrap ingestion...")
                pipeline = ETLPipeline(adapter_key="sebi_adjudication_orders")
                await pipeline.run(
                    db=session,
                    triggered_by="startup_bootstrap",
                    limit=50,
                    incremental=False,
                )
                logger.info("Initial bootstrap ingestion completed.")
            else:
                logger.info(f"Database already contains {count} records. Skipping initial bootstrap.")
    except Exception as e:
        logger.warning(f"Bootstrap check notice (will retry on manual sync or migration): {e}")


def start_scheduler():
    """Start background APScheduler."""
    if not scheduler.running:
        trigger = IntervalTrigger(hours=settings.SCHEDULE_INTERVAL_HOURS)
        scheduler.add_job(
            scheduled_crawl_job,
            trigger=trigger,
            id="sebi_incremental_crawl",
            name="SEBI Orders Periodic Sync",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(f"APScheduler started. Job will trigger every {settings.SCHEDULE_INTERVAL_HOURS} hours.")


def shutdown_scheduler():
    """Shutdown background APScheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
