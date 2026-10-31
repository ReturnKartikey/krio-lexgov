<p align="center">
  <a href="https://krio-rust.vercel.app">
    <img src="icon_logo.png" alt="Krio LexGov" width="64" height="64" />
  </a>
</p>

<h1 align="center">KRIO · LexGov</h1>

<p align="center">
  <strong>Regulatory Intelligence & Legal Enforcement Platform</strong><br />
  <sub>Crawl · Normalize · Index · Synthesize — public enforcement orders from Indian regulatory bodies</sub>
</p>

<p align="center">
  <a href="https://krio-rust.vercel.app"><img src="https://img.shields.io/badge/Live_App-krio--rust.vercel.app-000000?style=flat-square&logo=vercel&logoColor=white" alt="Live App" /></a>
  <a href="https://krio-lexgov-api.onrender.com/docs"><img src="https://img.shields.io/badge/API_Docs-Swagger-009688?style=flat-square&logo=fastapi&logoColor=white" alt="API Docs" /></a>
  <a href="https://hub.xerj.org/contributors/ReturnKartikey"><img src="https://hub.xerj.org/contributors/ReturnKartikey/badge.svg" alt="XERJ Corpus Hub Contributor" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="https://krio-rust.vercel.app"><img src="docs/screenshots/hero-landing.png" alt="Krio LexGov — Landing Page" width="100%" /></a>
</p>

---

## What is Krio LexGov?

Krio LexGov is an autonomous regulatory intelligence platform that systematically crawls, normalizes, indexes, and synthesizes public enforcement orders, settlement rulings, and adjudication proceedings published by the **Securities and Exchange Board of India (SEBI)**.

Every record carries **audit-grade provenance** — SHA-256 content hashes, verified source URLs, and full-text precision — so legal teams, compliance officers, and researchers can cite with confidence.

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/explorer-archive.png" alt="Explorer — Order Archive" width="100%" />
      <p align="center"><sub><strong>Explorer</strong> — Full-text search across 158+ enforcement orders with AI Brief and filtering</sub></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/analytics-dashboard.png" alt="Analytics Dashboard" width="100%" />
      <p align="center"><sub><strong>Analytics</strong> — Enforcement trends, penalty aggregation, and entity tracking over time</sub></p>
    </td>
  </tr>
</table>

---

## Key Capabilities

| Capability | Description |
| :--- | :--- |
| **Multi-Category Ingestion** | Automated scraping across Adjudication Orders, Chairperson/WTM Orders, and Settlement Orders via `httpx`, `BeautifulSoup4`, and `pypdf`. |
| **Cryptographic Provenance** | Raw PDF and HTML payloads are SHA-256 hashed upon retrieval for tamper-proof audit trails. |
| **Entity & Sanction Extraction** | Domain NLP extracts corporate noticees, individual respondents, violation statutes (PFUTP, LODR, PIT, CIS), and monetary penalty slabs. |
| **Sub-Millisecond Search** | PostgreSQL 16 GIN indexes (`search_vector` tsvector & `pg_trgm` trigram ops) with multi-token lexical query matching across titles, entities, and summaries. |
| **Automated Legal Synthesis** | Domain regulatory intelligence engine synthesizes multi-page orders into structured risk briefs, statutory mappings, precedent cases, and actionable compliance takeaways. |
| **Executive PDF Memos** | Client-side `jsPDF` generates audit-grade briefing memos with verified provenance blocks and formatted INR currencies. |
| **Quick Look Modal** | Keyboard-driven (`Space`, `Esc`, `Enter`) macOS Finder-style modal for instant order previews. |
| **Responsible Crawling** | Token bucket rate limiting, `robots.txt` compliance, and transparent bot identification. |

---

## Tech Stack

### Backend

- **Runtime:** Python 3.12+ (supports Python 3.11+)
- **Framework:** FastAPI — async endpoints, Pydantic v2 validation
- **Database:** PostgreSQL 16 (or SQLite with zero-config fallback), SQLAlchemy 2.0 (asyncpg / aiosqlite), Alembic migrations
- **Search:** PostgreSQL GIN Full-Text Search (`tsvector`), `pg_trgm` trigram index, multi-token lexical matching
- **Scheduler:** APScheduler — async background crawling & automated ingestion
- **Scraping:** `httpx` (HTTP/2), `BeautifulSoup4`, `pypdf`
- **Intelligence:** Domain Legal Synthesis & NLP Entity Extraction Engine

### Frontend

- **Framework:** Next.js 14 — App Router, Server Components, Dynamic SSR
- **Language:** TypeScript
- **Styling:** Tailwind CSS, custom design tokens, Lucide icons
- **Motion:** Framer Motion, Lenis smooth scroll, GSAP
- **Charts:** Recharts — area, bar, radar, and timeline visualizations
- **Export:** `jsPDF` for regulatory PDF memos
- **Testing:** Vitest + React Testing Library

---

## Architecture

```mermaid
flowchart TD
    subgraph Registry["SEBI Regulatory Portal"]
        AO["Adjudication Orders"]
        WTM["Chairperson / WTM Orders"]
        SETTLE["Settlement Orders"]
    end

    subgraph Ingestion["Ingestion Layer"]
        ADAPTER["SEBI Adapter<br/>Rate Limiter · robots.txt"]
        ETL["ETL Pipeline<br/>Discover → Fetch → Extract → Normalize → Upsert"]
    end

    subgraph Storage["PostgreSQL 16"]
        RECORDS[("records<br/>GIN tsvector · pg_trgm · SHA-256")]
        ENTITIES[("entities<br/>Risk Exposure · Cross-Links")]
        JOBS[("ingestion_runs<br/>Audit Trails")]
    end

    subgraph API["FastAPI Backend"]
        R_API["/api/records"]
        E_API["/api/entities"]
        A_API["/api/analytics"]
        J_API["/api/jobs"]
        AI_API["/api/ai/synthesize"]
    end

    subgraph UI["Next.js 14 Frontend"]
        EXPLORER["/explorer & /explorer/[id]"]
        ENTITIES_UI["/entities & /entities/[id]"]
        ANALYTICS["/analytics"]
        API_UI["/api-explorer"]
        JOBS_UI["/jobs"]
    end

    Registry --> ADAPTER --> ETL --> Storage
    Storage <--> API <--> UI
```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, database connectivity, and scheduler state |
| `GET` | `/api/records` | Search with full-text queries, penalty slabs, date ranges, jurisdiction, and sorting |
| `GET` | `/api/records/{id}` | Full regulatory dossier with entities, regulations, metadata, and SHA-256 hash |
| `GET` | `/api/records/{id}/preview` | Lightweight preview payload for instant modal inspection |
| `GET` | `/api/entities` | List tracked noticees with order count, total exposure, and risk classification |
| `GET` | `/api/entities/summary` | Aggregate exposure, entity count, and high-risk classification statistics |
| `GET` | `/api/entities/{id}` | Detailed entity dossier with risk score and chronological order timeline |
| `GET` | `/api/analytics/processing-stats` | Ingestion pipeline audit statistics, success rates, total penalties, and entity metrics |
| `GET` | `/api/analytics/trends` | Monthly enforcement volume, penalty velocity, and statutory breakdown |
| `GET` | `/api/analytics/duplicates` | Near-duplicate detection via multi-factor fuzzy similarity |
| `GET` | `/api/jobs` | Crawler run history, execution status, and audit metrics |
| `POST` | `/api/jobs/sync` | Trigger on-demand registry crawl (incremental or full) |
| `POST` | `/api/ai/synthesize` | Domain AI risk analysis, precedent matching, and statutory compliance brief |

> **Interactive docs:** [krio-lexgov-api.onrender.com/docs](https://krio-lexgov-api.onrender.com/docs)

---

## Quickstart

### Prerequisites

- Python 3.12+ (or 3.11+)
- Node.js 18+ and npm
- PostgreSQL 16+ (optional: SQLite fallback runs with zero setup)

### Docker Compose

```bash
git clone https://github.com/ReturnKartikey/krio-lexgov.git
cd krio-lexgov
cp .env.example .env
docker compose up --build
```

| Service | URL |
| :--- | :--- |
| Web App | `http://localhost:3000` |
| API | `http://localhost:8000` |
| Swagger | `http://localhost:8000/docs` |

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head            # Optional for PostgreSQL; SQLite auto-seeds on startup
uvicorn app.main:app --reload --port 8000

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

---

## Testing & CI

```bash
# Backend — tests, coverage, and linting
pytest backend/tests -v --cov=backend/app --cov-report=term-missing
ruff check backend/app --config backend/pyproject.toml

# Frontend — type check, unit tests, and production build
cd frontend
npm test
npx tsc --noEmit
npm run build
```

CI runs automatically on every pull request via GitHub Actions — lint, type check, test, and Docker image build must all pass before merge.

---

## Live Deployments

| Surface | URL |
| :--- | :--- |
| **Web Application** | [krio-rust.vercel.app](https://krio-rust.vercel.app) |
| **Explorer (Archive)** | [krio-rust.vercel.app/explorer](https://krio-rust.vercel.app/explorer) |
| **Entities Directory** | [krio-rust.vercel.app/entities](https://krio-rust.vercel.app/entities) |
| **Analytics & Trends** | [krio-rust.vercel.app/analytics](https://krio-rust.vercel.app/analytics) |
| **API Console** | [krio-rust.vercel.app/api-explorer](https://krio-rust.vercel.app/api-explorer) |
| **Ingestion Jobs** | [krio-rust.vercel.app/jobs](https://krio-rust.vercel.app/jobs) |
| **Swagger UI** | [krio-lexgov-api.onrender.com/docs](https://krio-lexgov-api.onrender.com/docs) |
| **OpenAPI Schema** | [krio-lexgov-api.onrender.com/api/openapi.json](https://krio-lexgov-api.onrender.com/api/openapi.json) |

---

## Compliance & Provenance

- **100% Public Data** — Indexes exclusively official, publicly published regulatory filings from `sebi.gov.in`.
- **Verified Source Links** — Every record maintains an HTTP 200 URL directly back to the SEBI portal.
- **Cryptographic Integrity** — SHA-256 digests allow independent verification against original publications.
- **Polite Crawling** — Adheres to `robots.txt`, enforces rate limiting, and transparently identifies the crawler.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
