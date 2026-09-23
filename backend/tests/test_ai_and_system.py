import pytest

from app.api.v1.ai import clean_summary_text


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


# Tests for clean_summary_text utility function


def test_clean_summary_text_none_or_empty():
    title = "ABC Limited"
    assert clean_summary_text(None, title) == f"SEBI Adjudication Order concerning {title}."
    assert clean_summary_text("", title) == f"SEBI Adjudication Order concerning {title}."


def test_clean_summary_text_breadcrumbs_removal():
    title = "XYZ Pvt Ltd"
    raw_text = (
        "SEBI | Home » Enforcement » Orders » Adjudication Orders ▼ "
        "Adjudication order in respect of XYZ Pvt Ltd for fraudulent trading activities."
    )
    result = clean_summary_text(raw_text, title)
    assert "Home » Enforcement" not in result
    assert result == "Adjudication order in respect of XYZ Pvt Ltd for fraudulent trading activities."


def test_clean_summary_text_title_prefix_removal():
    title = "XYZ (India) Ltd [2023]"
    raw_text = "XYZ (India) Ltd [2023] Adjudication order establishing violation of PFUTP regulations."
    result = clean_summary_text(raw_text, title)
    assert result == "Adjudication order establishing violation of PFUTP regulations."


def test_clean_summary_text_whitespace_normalization():
    title = "Test Entity"
    raw_text = "  Adjudication   order  \n\n in the matter of   PFUTP regulation violations and penalties.  "
    result = clean_summary_text(raw_text, title)
    assert result == "Adjudication order in the matter of PFUTP regulation violations and penalties."


def test_clean_summary_text_short_text_fallback():
    title = "Short Entity"
    raw_text = "Too short text"
    result = clean_summary_text(raw_text, title)
    expected = f"SEBI Adjudication Order in the matter of {title} establishing regulatory liability and evidentiary findings."
    assert result == expected


def test_clean_summary_text_long_text_truncation():
    title = "Company XYZ"
    long_summary = (
        "Adjudication order passed against the noticees for violations of SEBI PFUTP Regulations "
        "involving manipulative, fraudulent, and unfair trade practices in the capital markets. "
        "The Adjudicating Officer imposed cumulative monetary penalties on all respondents after detailed investigation and hearings."
    )
    assert len(long_summary) > 220
    result = clean_summary_text(long_summary, title)
    assert len(result) == 220
    assert result.endswith("...")
    assert result == long_summary[:217] + "..."


def test_clean_summary_text_normal_length():
    title = "Standard Company"
    summary = "Adjudication order establishing monetary penalties for disclosure default under LODR Regulations."
    result = clean_summary_text(summary, title)
    assert result == summary
