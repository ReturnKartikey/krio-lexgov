import time
import traceback
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.base import SourceAdapter
from app.adapters.registry import registry
from app.core.logging import logger
from app.db.models import (
    CrawlState,
    Entity,
    IngestionRun,
    RawDocument,
    Record,
    RecordEntity,
    Source,
)


class ETLPipeline:
    """Orchestrates discover -> fetch -> parse -> load -> index for any source adapter."""

    def __init__(self, adapter_key: str = "sebi_adjudication_orders"):
        self.adapter_key = adapter_key
        self.adapter: SourceAdapter | None = registry.get(adapter_key)
        if not self.adapter:
            raise ValueError(f"No source adapter registered for key: {adapter_key}")

    async def run(
        self,
        db: AsyncSession,
        triggered_by: str = "scheduler",
        limit: int = 50,
        incremental: bool = True,
    ) -> IngestionRun:
        """Execute a full or incremental ingestion pipeline run."""
        start_time = time.monotonic()
        logger.info(
            f"Starting ETL Ingestion run for adapter [{self.adapter_key}] triggered by [{triggered_by}]"
        )

        # 1. Ensure Source exists
        stmt = select(Source).where(
            or_(
                Source.adapter_key == self.adapter_key,
                Source.adapter_key == self.adapter.adapter_key,
                Source.name == self.adapter.name,
            )
        )
        result = await db.execute(stmt)
        source = result.scalars().first()

        if not source:
            source = Source(
                id=uuid.uuid4(),
                name=self.adapter.name,
                base_url=self.adapter.base_url,
                adapter_key=self.adapter.adapter_key,
                description=self.adapter.description,
            )
            db.add(source)
            await db.flush()
        else:
            source.adapter_key = self.adapter.adapter_key
            await db.flush()

        # 2. Retrieve Crawl State
        stmt_state = select(CrawlState).where(CrawlState.source_id == source.id)
        res_state = await db.execute(stmt_state)
        crawl_state = res_state.scalar_one_or_none()

        if not crawl_state:
            crawl_state = CrawlState(
                id=uuid.uuid4(),
                source_id=source.id,
                total_runs=0,
            )
            db.add(crawl_state)
            await db.flush()

        # 3. Create Ingestion Run record
        ingestion_run = IngestionRun(
            id=uuid.uuid4(),
            source_id=source.id,
            started_at=datetime.now(UTC),
            status="running",
            triggered_by=triggered_by,
            records_seen=0,
            records_added=0,
            records_updated=0,
            records_failed=0,
        )
        db.add(ingestion_run)
        await db.commit()

        errors = []
        cursor = crawl_state.last_cursor if incremental else None

        try:
            # 4. Discovery Phase
            refs, next_cursor = await self.adapter.discover(
                since=crawl_state.last_run_at if incremental else None,
                cursor=cursor,
                limit=limit,
            )
            ingestion_run.records_seen = len(refs)

            for ref in refs:
                try:
                    # 5. Fetch Phase
                    raw_doc_payload = await self.adapter.fetch(ref)

                    # Store or check raw document
                    stmt_raw = select(RawDocument).where(
                        RawDocument.source_id == source.id,
                        RawDocument.content_hash == raw_doc_payload.content_hash,
                    )
                    res_raw = await db.execute(stmt_raw)
                    raw_doc = res_raw.scalar_one_or_none()

                    if not raw_doc:
                        raw_doc = RawDocument(
                            id=uuid.uuid4(),
                            source_id=source.id,
                            source_ref=raw_doc_payload.source_ref,
                            content_hash=raw_doc_payload.content_hash,
                            fetched_at=datetime.now(UTC),
                            http_status=raw_doc_payload.http_status,
                            mime_type=raw_doc_payload.mime_type,
                            raw_content=raw_doc_payload.text_content,
                        )
                        db.add(raw_doc)
                        await db.flush()

                    # 6. Parse / Normalize Phase
                    normalized = await self.adapter.parse(raw_doc_payload, ref)

                    # 7. Upsert Record
                    stmt_rec = select(Record).where(
                        Record.source_id == source.id,
                        Record.external_id == normalized.external_id,
                    )
                    res_rec = await db.execute(stmt_rec)
                    existing_record = res_rec.scalar_one_or_none()

                    if existing_record:
                        existing_record.title = normalized.title
                        existing_record.summary = normalized.summary
                        existing_record.entity_names = normalized.entity_names
                        existing_record.jurisdiction = normalized.jurisdiction
                        existing_record.state = normalized.state
                        existing_record.city = normalized.city
                        existing_record.amount = normalized.amount
                        existing_record.published_date = normalized.published_date
                        existing_record.source_url = normalized.source_url
                        existing_record.raw_metadata = normalized.raw_metadata
                        existing_record.raw_document_id = raw_doc.id
                        existing_record.updated_at = datetime.now(UTC)
                        record_obj = existing_record
                        ingestion_run.records_updated += 1
                    else:
                        record_obj = Record(
                            id=uuid.uuid4(),
                            source_id=source.id,
                            raw_document_id=raw_doc.id,
                            external_id=normalized.external_id,
                            record_type=normalized.record_type,
                            title=normalized.title,
                            summary=normalized.summary,
                            entity_names=normalized.entity_names,
                            jurisdiction=normalized.jurisdiction,
                            state=normalized.state,
                            city=normalized.city,
                            amount=normalized.amount,
                            status=normalized.status,
                            published_date=normalized.published_date,
                            source_url=normalized.source_url,
                            raw_metadata=normalized.raw_metadata,
                        )
                        db.add(record_obj)
                        await db.flush()
                        ingestion_run.records_added += 1

                    # 8. Upsert Entities & Record Links
                    for ent_item in normalized.entities:
                        if not ent_item.normalized_name:
                            continue

                        stmt_ent = select(Entity).where(
                            Entity.normalized_name == ent_item.normalized_name
                        )
                        res_ent = await db.execute(stmt_ent)
                        existing_ent = res_ent.scalar_one_or_none()

                        if existing_ent:
                            existing_ent.last_seen = datetime.now(UTC)
                            entity_obj = existing_ent
                        else:
                            entity_obj = Entity(
                                id=uuid.uuid4(),
                                name=ent_item.name,
                                normalized_name=ent_item.normalized_name,
                                entity_type=ent_item.entity_type,
                                first_seen=datetime.now(UTC),
                                last_seen=datetime.now(UTC),
                                record_count=1,
                                total_penalty_amount=0.0,
                            )
                            db.add(entity_obj)
                            await db.flush()

                        # Link record <-> entity
                        stmt_link = select(RecordEntity).where(
                            RecordEntity.record_id == record_obj.id,
                            RecordEntity.entity_id == entity_obj.id,
                        )
                        res_link = await db.execute(stmt_link)
                        if not res_link.scalar_one_or_none():
                            link = RecordEntity(
                                id=uuid.uuid4(),
                                record_id=record_obj.id,
                                entity_id=entity_obj.id,
                                role=ent_item.role,
                            )
                            db.add(link)
                            await db.flush()

                        # Deterministically recalculate stats for this entity from linked records
                        stmt_stats = (
                            select(
                                func.count(func.distinct(RecordEntity.record_id)),
                                func.coalesce(func.sum(Record.amount), 0.0),
                            )
                            .select_from(RecordEntity)
                            .join(Record, RecordEntity.record_id == Record.id)
                            .where(RecordEntity.entity_id == entity_obj.id)
                        )
                        stats_res = await db.execute(stmt_stats)
                        cnt, total_pen = stats_res.one()
                        entity_obj.record_count = cnt
                        entity_obj.total_penalty_amount = float(total_pen or 0.0)

                    await db.commit()

                except Exception as rec_err:
                    await db.rollback()
                    ingestion_run.records_failed += 1
                    err_msg = f"Error processing record {getattr(ref, 'external_id', 'unknown')}: {rec_err}"
                    logger.error(err_msg, exc_info=True)
                    errors.append(err_msg)

            # Update crawl state
            crawl_state.last_cursor = next_cursor
            crawl_state.last_run_at = datetime.now(UTC)
            crawl_state.total_runs += 1

            # Finalize run status
            status = "success"
            if ingestion_run.records_failed > 0:
                status = (
                    "partial"
                    if ingestion_run.records_added + ingestion_run.records_updated > 0
                    else "failed"
                )

            duration = round(time.monotonic() - start_time, 2)
            ingestion_run.status = status
            ingestion_run.finished_at = datetime.now(UTC)
            ingestion_run.duration_seconds = duration
            ingestion_run.error_log = "\n".join(errors) if errors else None
            await db.commit()

            logger.info(
                f"ETL Run finished with status [{status}] in {duration}s: "
                f"Seen={ingestion_run.records_seen}, Added={ingestion_run.records_added}, "
                f"Updated={ingestion_run.records_updated}, Failed={ingestion_run.records_failed}"
            )
            return ingestion_run

        except Exception as e:
            await db.rollback()
            duration = round(time.monotonic() - start_time, 2)
            ingestion_run.status = "failed"
            ingestion_run.finished_at = datetime.now(UTC)
            ingestion_run.duration_seconds = duration
            ingestion_run.error_log = f"Pipeline execution failed: {e}\n{traceback.format_exc()}"
            await db.commit()
            logger.error(f"ETL pipeline fatal error: {e}", exc_info=True)
            return ingestion_run
