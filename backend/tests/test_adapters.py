import pytest

from app.adapters.base import RawDocumentPayload, RawRecordRef
from app.adapters.sebi_orders import SEBIOrdersAdapter


@pytest.mark.asyncio
async def test_sebi_adapter_metadata():
    adapter = SEBIOrdersAdapter()
    assert adapter.adapter_key == "sebi_adjudication_orders"
    assert "SEBI" in adapter.name
    assert "sebi.gov.in" in adapter.base_url
    assert len(adapter.description) > 10


@pytest.mark.asyncio
async def test_sebi_adapter_discovery():
    adapter = SEBIOrdersAdapter()
    refs, next_cursor = await adapter.discover(limit=5)
    assert len(refs) > 0
    first_ref = refs[0]
    assert isinstance(first_ref, RawRecordRef)
    assert first_ref.external_id
    assert first_ref.source_url.startswith("http")
    assert first_ref.title


@pytest.mark.asyncio
async def test_sebi_adapter_fetch_and_parse():
    adapter = SEBIOrdersAdapter()
    refs, _ = await adapter.discover(limit=1)
    ref = refs[0]

    raw_payload = await adapter.fetch(ref)
    assert isinstance(raw_payload, RawDocumentPayload)
    assert len(raw_payload.content_bytes) > 0
    assert len(raw_payload.content_hash) == 64  # SHA256 hex length

    normalized = await adapter.parse(raw_payload, ref)
    assert normalized.external_id == ref.external_id
    assert normalized.title == ref.title
    assert normalized.status == "published"
    assert len(normalized.entities) > 0


def test_ssrf_url_validation():
    from app.core.security import is_safe_registry_url

    # Malicious / SSRF URLs that must be blocked
    assert is_safe_registry_url("http://169.254.169.254/latest/meta-data/") is False
    assert is_safe_registry_url("file:///etc/passwd") is False
    assert is_safe_registry_url("gopher://127.0.0.1:6379/") is False
    assert is_safe_registry_url("http://evil-hacker.com/exploit.pdf") is False
    assert is_safe_registry_url("javascript:alert(1)") is False
    assert is_safe_registry_url("") is False
    assert is_safe_registry_url(None) is False

    # Legitimate registry URLs that must be allowed
    assert is_safe_registry_url("https://www.sebi.gov.in/enforcement/orders/mar-2024/order.pdf") is True
    assert is_safe_registry_url("https://sebi.gov.in/order.html") is True
    assert is_safe_registry_url("https://www.bseindia.com/downloads/order.pdf") is True

