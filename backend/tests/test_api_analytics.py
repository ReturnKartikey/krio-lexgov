import pytest


@pytest.mark.asyncio
async def test_analytics_records_per_day(client):
    response = await client.get("/api/analytics/records-per-day?days=365")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "date" in data[0]
    assert "count" in data[0]
    assert "total_penalty" in data[0]


@pytest.mark.asyncio
async def test_analytics_trends(client):
    response = await client.get("/api/analytics/trends?interval=month")
    assert response.status_code == 200
    data = response.json()
    assert "total_orders_trend" in data
    assert "total_penalties_trend" in data
    assert "active_entities_trend" in data
    assert "time_series" in data


@pytest.mark.asyncio
async def test_analytics_entity_frequency(client):
    response = await client.get("/api/analytics/entity-frequency?top=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["record_count"] >= 1


@pytest.mark.asyncio
async def test_analytics_geo_distribution(client):
    response = await client.get("/api/analytics/geo-distribution")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "state" in data[0]
    assert "top_cities" in data[0]


@pytest.mark.asyncio
async def test_analytics_processing_stats(client):
    response = await client.get("/api/analytics/processing-stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_runs" in data
    assert "success_rate_percent" in data


@pytest.mark.asyncio
async def test_analytics_duplicates(client):
    response = await client.get("/api/analytics/duplicates?threshold=0.5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
