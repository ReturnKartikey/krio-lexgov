import pytest


@pytest.mark.asyncio
async def test_root_endpoint(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "version" in data
    assert data["docs"] == "/docs"


@pytest.mark.asyncio
async def test_docs_custom_endpoint(client):
    response = await client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "KRIO // OpenAPI" in response.text


@pytest.mark.asyncio
async def test_ai_synthesize_endpoint(client):
    payload = {
        "query": "Insider trading and penalty violations",
        "focus_entities": ["Debock Industries Limited"],
        "max_records": 5,
    }
    response = await client.post("/api/ai/synthesize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "headline" in data
    assert "executive_summary" in data
    assert "confidence_score" in data
    assert "risk_level" in data
    assert "order_count" in data
    assert isinstance(data["applicable_statutes"], list)
    assert isinstance(data["precedents"], list)


@pytest.mark.asyncio
async def test_ai_synthesize_empty_query(client):
    payload = {
        "query": "",
        "max_records": 3,
    }
    response = await client.post("/api/ai/synthesize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "executive_summary" in data
