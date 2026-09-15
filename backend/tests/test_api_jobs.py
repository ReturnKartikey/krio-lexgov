import pytest


@pytest.mark.asyncio
async def test_jobs_list_and_sync(client):
    # 1. Trigger manual sync
    sync_resp = await client.post(
        "/api/jobs/sync",
        json={"adapter_key": "sebi_adjudication_orders", "limit": 5, "incremental": False},
    )
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert "run_id" in sync_data
    assert sync_data["status"] in ("success", "partial", "queued")

    # 2. List jobs
    list_resp = await client.get("/api/jobs")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert len(list_data["data"]) > 0

    # 3. Get job detail
    job_id = sync_data["run_id"]
    detail_resp = await client.get(f"/api/jobs/{job_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == job_id


@pytest.mark.asyncio
async def test_entities_endpoints(client):
    list_resp = await client.get("/api/entities?page_size=5")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data["data"]) > 0

    ent_id = data["data"][0]["id"]
    detail_resp = await client.get(f"/api/entities/{ent_id}")
    assert detail_resp.status_code == 200
    ent_detail = detail_resp.json()
    assert ent_detail["id"] == ent_id
    assert "recent_records" in ent_detail


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["database"] == "healthy"
    assert data["total_records"] > 0


@pytest.mark.asyncio
async def test_stuck_job_auto_timeout(client, db_session):
    import uuid
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import select

    from app.db.models import IngestionRun, Source

    # Retrieve seeded source
    src_res = await db_session.execute(select(Source))
    src = src_res.scalars().first()
    assert src is not None

    # Create an old orphaned job stuck in 'running' from 2 hours ago
    old_job = IngestionRun(
        id=uuid.uuid4(),
        source_id=src.id,
        started_at=datetime.now(UTC) - timedelta(hours=2),
        status="running",
        triggered_by="initial_bootstrap",
        records_seen=75,
        records_updated=40,
    )
    db_session.add(old_job)
    await db_session.commit()

    # Calling list /api/jobs triggers the auto-timeout cleanup
    resp = await client.get("/api/jobs")
    assert resp.status_code == 200

    # Verify the job status is automatically updated to timed_out
    detail_resp = await client.get(f"/api/jobs/{old_job.id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["status"] == "timed_out"
    assert detail["duration_seconds"] == 3600.0
    assert "timeout" in detail["error_log"].lower()

