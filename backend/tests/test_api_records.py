import pytest


@pytest.mark.asyncio
async def test_list_records_endpoint(client):
    response = await client.get("/api/records?page=1&page_size=10")
    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert "meta" in json_data
    assert len(json_data["data"]) > 0
    assert json_data["meta"]["total"] > 0


@pytest.mark.asyncio
async def test_search_records_query(client):
    response = await client.get("/api/records?q=Reliance")
    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["data"]) > 0
    assert any("Reliance" in r["title"] for r in json_data["data"])


@pytest.mark.asyncio
async def test_filter_records_by_state(client):
    response = await client.get("/api/records?state=Maharashtra")
    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["data"]) > 0
    for r in json_data["data"]:
        assert r["state"] == "Maharashtra"


@pytest.mark.asyncio
async def test_get_record_detail(client):
    list_resp = await client.get("/api/records?page_size=1")
    rec_id = list_resp.json()["data"][0]["id"]

    detail_resp = await client.get(f"/api/records/{rec_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == rec_id
    assert "raw_metadata" in detail
    assert "source_url" in detail
    assert isinstance(detail["entities"], list)
