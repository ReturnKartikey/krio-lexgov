import hashlib
import pathlib
from datetime import UTC, date, datetime
from typing import Any

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.adapters.base import (
    RawDocumentPayload,
    RawRecordRef,
    SourceAdapter,
)
from app.adapters.registry import registry
from app.adapters.sebi_orders import SEBIOrdersAdapter
from app.core.database import Base
from app.db.models import Entity, IngestionRun, RawDocument, Record, RecordEntity, Source
from app.etl.pipeline import ETLPipeline

FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures"
HTML_FIXTURE_PATH = FIXTURES_DIR / "realistic_sebi_order.html"
PDF_FIXTURE_PATH = FIXTURES_DIR / "realistic_sebi_order.pdf"


class SEBIFixtureAdapter(SEBIOrdersAdapter):
    """
    Realistic SEBI Source Adapter reading authentic HTML/PDF order fixtures directly
    from disk without network mocks or synthetic stubs.
    """

    @property
    def adapter_key(self) -> str:
        return "sebi_live_fixtures"

    @property
    def name(self) -> str:
        return "SEBI Live Fixtures (Test Adapter)"

    async def discover(
        self,
        since: datetime | None = None,
        cursor: str | None = None,
        limit: int = 50,
    ) -> tuple[list[RawRecordRef], str | None]:
        refs = [
            RawRecordRef(
                external_id="SEBI-ZENITH-2024-11048",
                source_url="https://www.sebi.gov.in/enforcement/orders/apr-2024/zenith-birla-11048.html",
                title="Adjudication order in respect of Zenith Birla (India) Limited and Shri Arvind Shenoy in the matter of GDR issue manipulation",
                published_date=date(2024, 4, 2),
                metadata={
                    "record_type": "adjudication_order",
                    "fixture_file": str(HTML_FIXTURE_PATH),
                    "mime_type": "text/html",
                },
            ),
            RawRecordRef(
                external_id="SEBI-REL-INFRA-2024-1042",
                source_url="https://www.sebi.gov.in/enforcement/orders/mar-2024/adjudication-order-rel-infra-1042.pdf",
                title="Adjudication order in respect of Reliance Infrastructure Advisory Pvt Ltd and Shri Rajesh Agrawal in the matter of Illiquid Stock Options",
                published_date=date(2024, 3, 15),
                metadata={
                    "record_type": "adjudication_order",
                    "fixture_file": str(PDF_FIXTURE_PATH),
                    "mime_type": "application/pdf",
                },
            ),
        ]
        return refs[:limit], None

    async def fetch(self, ref: RawRecordRef) -> RawDocumentPayload:
        fixture_path = pathlib.Path(ref.metadata.get("fixture_file", ""))
        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture file not found: {fixture_path}")

        content_bytes = fixture_path.read_bytes()
        mime_type = ref.metadata.get("mime_type", "text/html")
        content_hash = hashlib.sha256(content_bytes).hexdigest()
        text_content = self._extract_text(content_bytes, mime_type)

        return RawDocumentPayload(
            source_ref=ref.source_url,
            content_bytes=content_bytes,
            content_hash=content_hash,
            mime_type=mime_type,
            http_status=200,
            text_content=text_content,
        )


class CorruptedFixtureAdapter(SEBIOrdersAdapter):
    """Adapter designed to test ingestion error resilience and partial run recovery."""

    @property
    def adapter_key(self) -> str:
        return "sebi_corrupted_fixture"

    @property
    def name(self) -> str:
        return "SEBI Corrupted Fixture Adapter"

    async def discover(
        self,
        since: datetime | None = None,
        cursor: str | None = None,
        limit: int = 50,
    ) -> tuple[list[RawRecordRef], str | None]:
        return [
            RawRecordRef(
                external_id="SEBI-CORRUPT-DOC-001",
                source_url="https://www.sebi.gov.in/enforcement/orders/invalid.bin",
                title="Malformed Unparsable Registry Record",
                published_date=date(2024, 1, 1),
                metadata={"fail_mode": True},
            )
        ], None

    async def fetch(self, ref: RawRecordRef) -> RawDocumentPayload:
        if ref.metadata.get("fail_mode"):
            raise ConnectionResetError("Registry connection reset during payload transfer")
        return await super().fetch(ref)


@pytest.fixture
async def isolated_db_session():
    """Create a completely pristine in-memory SQLite database session for ETL integration testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(autouse=True)
def register_test_adapters():
    """Register custom live fixture adapters into the registry."""
    fixture_adapter = SEBIFixtureAdapter()
    corrupt_adapter = CorruptedFixtureAdapter()
    registry.register(fixture_adapter)
    registry.register(corrupt_adapter)
    yield


@pytest.mark.asyncio
async def test_e2e_html_and_pdf_ingestion_pipeline(isolated_db_session: AsyncSession):
    """
    Test the complete discover -> fetch -> parse -> load -> link pipeline
    using authentic HTML and PDF SEBI order fixtures without network or DB mocking.
    """
    pipeline = ETLPipeline(adapter_key="sebi_live_fixtures")
    run = await pipeline.run(
        db=isolated_db_session,
        triggered_by="integration_test",
        limit=10,
        incremental=False,
    )

    # 1. Assert IngestionRun Status and Metrics
    assert run.status == "success"
    assert run.records_seen == 2
    assert run.records_added == 2
    assert run.records_updated == 0
    assert run.records_failed == 0

    # 2. Verify RawDocument Database Records & Hash Integrity
    raw_docs_result = await isolated_db_session.execute(select(RawDocument))
    raw_docs = raw_docs_result.scalars().all()
    assert len(raw_docs) == 2

    html_doc = next(d for d in raw_docs if d.mime_type == "text/html")
    assert html_doc.source_ref.endswith("zenith-birla-11048.html")
    assert html_doc.content_hash == hashlib.sha256(HTML_FIXTURE_PATH.read_bytes()).hexdigest()
    assert html_doc.http_status == 200
    assert "Zenith Birla" in html_doc.raw_content

    pdf_doc = next(d for d in raw_docs if d.mime_type == "application/pdf")
    assert pdf_doc.source_ref.endswith("adjudication-order-rel-infra-1042.pdf")
    assert pdf_doc.content_hash == hashlib.sha256(PDF_FIXTURE_PATH.read_bytes()).hexdigest()
    assert "Reliance Infrastructure" in pdf_doc.raw_content

    # 3. Verify Normalized Record Table Records
    records_result = await isolated_db_session.execute(
        select(Record).order_by(Record.published_date.desc())
    )
    records = records_result.scalars().all()
    assert len(records) == 2

    # Check HTML-derived record (Zenith Birla)
    zenith_rec = next(r for r in records if r.external_id == "SEBI-ZENITH-2024-11048")
    assert "Zenith Birla" in zenith_rec.title
    assert zenith_rec.record_type == "adjudication_order"
    assert zenith_rec.amount == 15000000.0  # ₹1.5 Crore parsed from fixture
    assert zenith_rec.state == "Maharashtra"
    assert zenith_rec.city == "Mumbai"
    assert zenith_rec.published_date == date(2024, 4, 2)
    assert any("Zenith Birla" in name for name in zenith_rec.entity_names)
    assert zenith_rec.raw_document_id == html_doc.id

    # Check PDF-derived record (Reliance Infra)
    rel_rec = next(r for r in records if r.external_id == "SEBI-REL-INFRA-2024-1042")
    assert "Reliance Infrastructure" in rel_rec.title
    assert rel_rec.amount == 2500000.0  # ₹25 Lakh parsed from PDF
    assert rel_rec.state == "Maharashtra"
    assert rel_rec.published_date == date(2024, 3, 15)
    assert rel_rec.raw_document_id == pdf_doc.id

    # 4. Verify Entity Table and Entity-Record Links
    entities_result = await isolated_db_session.execute(select(Entity))
    entities = entities_result.scalars().all()
    assert len(entities) >= 3

    # Check corporate entity
    zenith_entity = next(
        e for e in entities if "zenith birla" in e.normalized_name.lower()
    )
    assert zenith_entity.entity_type == "company"
    assert zenith_entity.record_count >= 1
    assert zenith_entity.total_penalty_amount == 15000000.0

    # Check individual respondent
    shenoy_entity = next(
        (e for e in entities if "arvind shenoy" in e.normalized_name.lower()), None
    )
    if shenoy_entity:
        assert shenoy_entity.entity_type == "individual"
        assert shenoy_entity.record_count >= 1

    # Check RecordEntity join table associations
    links_result = await isolated_db_session.execute(select(RecordEntity))
    links = links_result.scalars().all()
    assert len(links) >= 3

    zenith_links = [l for l in links if l.record_id == zenith_rec.id]
    assert len(zenith_links) >= 1
    assert any(l.entity_id == zenith_entity.id for l in zenith_links)


@pytest.mark.asyncio
async def test_e2e_pipeline_idempotency_and_no_duplication(isolated_db_session: AsyncSession):
    """
    Test that re-running the ingestion pipeline on existing fixtures is idempotent:
    it updates existing records without creating duplicates or inflating entity counters.
    """
    pipeline = ETLPipeline(adapter_key="sebi_live_fixtures")

    # Run 1: Initial Ingestion
    run_1 = await pipeline.run(
        db=isolated_db_session,
        triggered_by="initial_run",
        limit=10,
        incremental=False,
    )
    assert run_1.status == "success"
    assert run_1.records_added == 2
    assert run_1.records_updated == 0

    count_records_1 = (
        await isolated_db_session.execute(select(func.count(Record.id)))
    ).scalar_one()
    count_entities_1 = (
        await isolated_db_session.execute(select(func.count(Entity.id)))
    ).scalar_one()
    assert count_records_1 == 2

    # Query initial entity penalty sum
    zenith_entity_1 = (
        await isolated_db_session.execute(
            select(Entity).where(Entity.normalized_name.ilike("%zenith%"))
        )
    ).scalars().first()
    assert zenith_entity_1 is not None
    initial_penalty = zenith_entity_1.total_penalty_amount
    initial_count = zenith_entity_1.record_count

    # Run 2: Second Ingestion of identical dataset
    run_2 = await pipeline.run(
        db=isolated_db_session,
        triggered_by="repeat_run",
        limit=10,
        incremental=False,
    )
    assert run_2.status == "success"
    assert run_2.records_added == 0
    assert run_2.records_updated == 2  # Idempotently recognized and updated

    # Total record count in DB must remain exactly 2
    count_records_2 = (
        await isolated_db_session.execute(select(func.count(Record.id)))
    ).scalar_one()
    count_entities_2 = (
        await isolated_db_session.execute(select(func.count(Entity.id)))
    ).scalar_one()
    assert count_records_2 == count_records_1
    assert count_entities_2 == count_entities_1

    # Entity metrics must not have doubled
    await isolated_db_session.refresh(zenith_entity_1)
    assert zenith_entity_1.record_count == initial_count
    assert zenith_entity_1.total_penalty_amount == initial_penalty


@pytest.mark.asyncio
async def test_e2e_pipeline_corrupted_document_handling(isolated_db_session: AsyncSession):
    """
    Test that corrupted, inaccessible, or unparsable payloads are gracefully isolated:
    the run logs errors, increments records_failed, and does not crash the database session.
    """
    pipeline = ETLPipeline(adapter_key="sebi_corrupted_fixture")
    run = await pipeline.run(
        db=isolated_db_session,
        triggered_by="error_test",
        limit=10,
        incremental=False,
    )

    # Pipeline gracefully completes with partial or failed status
    assert run.status in ("partial", "failed")
    assert run.records_seen == 1
    assert run.records_failed == 1
    assert run.records_added == 0

    # Database state is clean
    records_count = (
        await isolated_db_session.execute(select(func.count(Record.id)))
    ).scalar_one()
    assert records_count == 0
