# Developer Guide: Adding a New Source Registry Adapter

This document explains how to add a new public government registry adapter (e.g. State RERA project directory, NCLT orders, or MCA filings) without modifying core ETL, database, or API logic.

---

## 1. Create the Adapter File

Create a new file in `backend/app/adapters/`, for example `backend/app/adapters/rera_projects.py`:

```python
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.adapters.base import (
    SourceAdapter,
    RawRecordRef,
    RawDocumentPayload,
    NormalizedRecord,
    ExtractedEntityItem,
)
from app.core.config import get_settings
from app.core.rate_limiter import rate_limiter

settings = get_settings()

class RERAProjectsAdapter(SourceAdapter):
    @property
    def adapter_key(self) -> str:
        return "maharera_registered_projects"

    @property
    def name(self) -> str:
        return "MahaRERA Registered Real Estate Projects"

    @property
    def base_url(self) -> str:
        return "https://maharera.mahaonline.gov.in"

    @property
    def description(self) -> str:
        return "Public directory of registered real estate projects, developers, and litigation status in Maharashtra."

    async def discover(
        self,
        since: Optional[datetime] = None,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> Tuple[List[RawRecordRef], Optional[str]]:
        page = int(cursor) if cursor else 1
        refs = []
        # Implement pagination and discovery from public directory
        # ...
        return refs, str(page + 1)

    async def fetch(self, ref: RawRecordRef) -> RawDocumentPayload:
        await rate_limiter.acquire(1.0)
        async with httpx.AsyncClient() as client:
            resp = await client.get(ref.source_url)
            content_bytes = resp.content
            content_hash = hashlib.sha256(content_bytes).hexdigest()
            return RawDocumentPayload(
                source_ref=ref.source_url,
                content_bytes=content_bytes,
                content_hash=content_hash,
                mime_type="text/html",
            )

    async def parse(
        self, raw: RawDocumentPayload, ref: RawRecordRef
    ) -> NormalizedRecord:
        # Extract developer name, project name, location, and registration number
        return NormalizedRecord(
            external_id=ref.external_id,
            record_type="rera_project",
            title=ref.title,
            summary=ref.metadata.get("description"),
            entity_names=[ref.metadata.get("developer_name")],
            jurisdiction="Maharashtra Real Estate Regulatory Authority",
            state="Maharashtra",
            city=ref.metadata.get("city"),
            amount=ref.metadata.get("project_cost"),
            status="registered",
            published_date=ref.published_date,
            source_url=ref.source_url,
            raw_metadata=ref.metadata,
        )
```

---

## 2. Register the Adapter

Open `backend/app/adapters/registry.py` and register the new instance:

```python
from app.adapters.rera_projects import RERAProjectsAdapter

class AdapterRegistry:
    def __init__(self):
        self._adapters: Dict[str, SourceAdapter] = {}
        self.register(SEBIOrdersAdapter())
        self.register(RERAProjectsAdapter()) # <-- Add here
```

---

## 3. Trigger Ingestion

Once registered, the new source will automatically:
1. Be available via the manual sync endpoint `POST /api/jobs/sync`:
   ```bash
   curl -X POST "http://localhost:8000/api/jobs/sync" \
     -H "Content-Type: application/json" \
     -d '{"adapter_key": "maharera_registered_projects", "limit": 50}'
   ```
2. Be indexed in PostgreSQL with full-text `tsvector` and `pg_trgm` search automatically.
3. Show up in the Explorer and Analytics dashboards.
