# System Architecture — OpenGov Intelligence Explorer (LexGov)

## 1. Overview & System Topology

OpenGov Intelligence Explorer is a portfolio-grade regulatory data engineering platform designed to continuously ingest, normalize, index, and analyze public Indian government records.

```mermaid
flowchart TD
    subgraph External["Public Government Registries"]
        SEBI["SEBI Public Order Portal<br/>(Adjudication & Enforcement)"]
        RERA["Future Registries<br/>(e.g., MahaRERA, NCLT)"]
    end

    subgraph Adapters["Source Adapter Layer"]
        SA["Base: SourceAdapter Interface"]
        SO["SEBIOrdersAdapter<br/>- Rate Limiter (Token Bucket)<br/>- Robots.txt Compliance<br/>- PyPDF / BeautifulSoup"]
        SA --> SO
    end

    subgraph ETL["ETL & Normalization Engine"]
        DISC["1. Discovery (Cursor-aware)"]
        FETCH["2. Fetch & Dedupe (SHA-256)"]
        EXTRACT["3. Entity & Penalty Extractor (NLP/Regex)"]
        LOAD["4. Safe Transactional Upsert"]
    end

    subgraph Storage["PostgreSQL 16 & Redis"]
        PG[("PostgreSQL 16<br/>- GIN tsvector Search Index<br/>- pg_trgm Trigram Indexes<br/>- Relational Entity Graphs")]
        RD[("Redis 7<br/>- Rate Limit State<br/>- Crawler Job Broker")]
    end

    subgraph Backend["FastAPI Async REST Layer"]
        REC_API["/api/records (FTS & Filters)"]
        ENT_API["/api/entities (Dossiers & Links)"]
        ANL_API["/api/analytics (Trends & Duplicates)"]
        JOB_API["/api/jobs (Audit Logs & Trigger)"]
    end

    subgraph Frontend["Next.js 14 Web Application"]
        LANDING["Landing (Editorial Dark Aesthetic)"]
        EXPLORER["/explorer (Search & Highlight)"]
        DOSSIER["/explorer/[id] (Provenance & Audit)"]
        ANALYTICS["/analytics (Recharts Data Viz)"]
        JOBS["/jobs (Run Monitor)"]
        CONSOLE["/api-explorer (Interactive Playground)"]
    end

    SEBI --> SO
    RERA -.-> SA
    SO --> DISC --> FETCH --> EXTRACT --> LOAD --> PG
    SO <--> RD
    PG <--> Backend
    Backend <--> Frontend
```

---

## 2. Pluggable Source Adapter Pattern

Every registry integration implements the abstract `SourceAdapter` base class located in [`backend/app/adapters/base.py`](file:///c:/Users/Karti/Desktop/Brivo/backend/app/adapters/base.py):

```python
class SourceAdapter(ABC):
    @abstractmethod
    async def discover(self, since: datetime | None, cursor: str | None) -> tuple[list[RawRecordRef], str | None]:
        """Discovers new/updated items from listing endpoints with pagination."""
        pass

    @abstractmethod
    async def fetch(self, ref: RawRecordRef) -> RawDocumentPayload:
        """Fetches raw HTML/PDF payload, computing SHA-256 digest."""
        pass

    @abstractmethod
    async def parse(self, raw: RawDocumentPayload, ref: RawRecordRef) -> NormalizedRecord:
        """Normalizes source fields and runs entity/penalty extraction."""
        pass
```

---

## 3. Database Schema & Search Indexing Strategy

PostgreSQL 16 acts as the unified operational and analytical database with specialized indexes:

### Core Tables
1. `sources`: Registry configuration and adapter keys.
2. `raw_documents`: Immutable raw snapshots with SHA-256 cryptographic hashes for full data provenance.
3. `records`: Standardized core schema with generated `search_vector tsvector` column.
4. `entities`: Tracked corporate entities, noticees, and intermediaries with cumulative penalties.
5. `record_entities`: Many-to-many relationship tracking roles (`noticee`, `respondent`, `intermediary`).
6. `ingestion_runs`: Execution audit trail tracking `records_seen`, `records_added`, `records_updated`, `records_failed`, and error transcripts.
7. `crawl_state`: Persistent pagination cursor and last synchronization timestamps.

### Indexing Engine
- **Full-Text Vector Search**: Generated column `search_vector tsvector` indexed with **GIN**, enabling sub-millisecond lexical queries across order titles, summaries, and jurisdictions.
- **Trigram Similarity (`pg_trgm`)**: GIN trigram indexes on `records.title` and `entities.normalized_name` supporting fuzzy auto-complete, typo-tolerance, and duplicate detection.
- **B-Tree Indexes**: Indexed on `published_date`, `state`, `amount`, and `status` for rapid multi-faceted filtering.

---

## 4. Near-Duplicate Detection Algorithm

The engine detects near-duplicate records and related multi-respondent proceedings using a hybrid heuristic:

$$\text{Similarity Score} = \max(\text{TrigramSimilarity}(\text{title}_A, \text{title}_B), \text{Jaccard}(\text{Entities}_A, \text{Entities}_B))$$

Clustering occurs when:
1. **Title Levenshtein/Trigram similarity** exceeds threshold ($> 0.70$).
2. **Entity Overlap**: Both records share normalized noticee entities and matching penalty amounts ($\pm 5\%$).
3. **Temporal Proximity**: Orders issued within a 30-day window across regional benches.

Detected clusters are exposed via `GET /api/analytics/duplicates` and visualized in the analytics dashboard.
