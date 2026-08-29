import pytest
from sqlalchemy import select, func
from app.etl.pipeline import ETLPipeline
from app.etl.deduplication import detect_near_duplicates
from app.db.models import Record, Entity, RawDocument, IngestionRun


@pytest.mark.asyncio
async def test_etl_pipeline_run(db_session):
    pipeline = ETLPipeline(adapter_key="sebi_adjudication_orders")
    run = await pipeline.run(db=db_session, triggered_by="unit_test", limit=5, incremental=False)

    assert run.status in ("success", "partial")
    assert run.records_seen > 0
    assert (run.records_added + run.records_updated) > 0

    # Verify records in database
    rec_count = (await db_session.execute(select(func.count(Record.id)))).scalar_one()
    assert rec_count > 0

    # Verify entities extracted
    ent_count = (await db_session.execute(select(func.count(Entity.id)))).scalar_one()
    assert ent_count > 0


def test_near_duplicate_detection():
    sample_records = [
        {
            "id": "rec-1",
            "title": "Adjudication order in respect of Reliance Infrastructure Advisory Pvt Ltd in the matter of Illiquid Stock Options",
            "entity_names": ["Reliance Infrastructure Advisory Pvt Ltd", "Rajesh Agrawal"],
            "amount": 2500000.0,
            "published_date": "2024-03-15",
        },
        {
            "id": "rec-2",
            "title": "Order in respect of Reliance Infrastructure Advisory Private Limited for Illiquid Stock Options",
            "entity_names": ["Reliance Infrastructure Advisory Private Limited"],
            "amount": 2500000.0,
            "published_date": "2024-03-16",
        },
        {
            "id": "rec-3",
            "title": "Adjudication order regarding Karvy Stock Broking Limited for misappropriation",
            "entity_names": ["Karvy Stock Broking Limited"],
            "amount": 210000000.0,
            "published_date": "2024-05-10",
        },
    ]

    duplicates = detect_near_duplicates(sample_records, similarity_threshold=0.60)
    assert len(duplicates) >= 1
    assert duplicates[0].similarity_score > 0.60
    assert "Reliance Infrastructure" in duplicates[0].primary_title
