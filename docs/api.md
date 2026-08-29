# API Specification & Reference Guide

Base URL: `http://localhost:8000/api`

Interactive OpenAPI Swagger UI is available at `http://localhost:8000/docs`.

---

## 1. Records Endpoints

### `GET /records`
Search and filter regulatory orders.

#### Query Parameters:
- `q` (*string*, optional): Full-text query searched against `title`, `summary`, `jurisdiction`, and `entity_names`.
- `state` (*string*, optional): Filter by state jurisdiction (e.g. `Maharashtra`, `Delhi`).
- `record_type` (*string*, optional): Filter by record type (e.g. `adjudication_order`).
- `status` (*string*, optional): Order status (`published`, `active`).
- `entity` (*string*, optional): Extracted entity name.
- `date_from` (*date*, optional): YYYY-MM-DD.
- `date_to` (*date*, optional): YYYY-MM-DD.
- `min_amount` / `max_amount` (*float*, optional): Penalty amount filters.
- `sort_by` (*string*, default: `published_date`): `published_date`, `amount`, `ingested_at`, `title`.
- `sort_order` (*string*, default: `desc`): `asc`, `desc`.
- `page` (*int*, default: 1): Page number.
- `page_size` (*int*, default: 10): Items per page.

#### Example Request:
```bash
curl -X GET "http://localhost:8000/api/records?q=Reliance&state=Maharashtra&page=1&page_size=2"
```

#### Example Response:
```json
{
  "data": [
    {
      "id": "c1f72782-9426-444a-a035-7ff96180572e",
      "source_id": "893c52e4-9844-4fa9-b883-7c385a4f7831",
      "external_id": "ORDER/AO/BM/2024-25/1042",
      "record_type": "adjudication_order",
      "title": "Adjudication order in respect of Reliance Infrastructure Advisory Pvt Ltd and Noticees in the matter of Illiquid Stock Options",
      "summary": "Adjudication proceedings initiated under Section 15-I of the SEBI Act...",
      "entity_names": ["Reliance Infrastructure Advisory Pvt Ltd", "Shri Rajesh Agrawal", "Apex Securities LLP"],
      "jurisdiction": "Head Office, Mumbai Bench",
      "state": "Maharashtra",
      "city": "Mumbai",
      "amount": 2500000.0,
      "status": "published",
      "published_date": "2024-03-15",
      "source_url": "https://www.sebi.gov.in/enforcement/orders/mar-2024/adjudication-order-rel-infra-1042.pdf",
      "ingested_at": "2024-08-29T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "page_size": 2,
    "total_pages": 1
  }
}
```

---

### `GET /records/{id}`
Retrieve complete normalized record details, cryptographic raw snapshot hash, and linked entity graph.

#### Example Request:
```bash
curl -X GET "http://localhost:8000/api/records/c1f72782-9426-444a-a035-7ff96180572e"
```

---

## 2. Entities Endpoints

### `GET /entities`
List and search tracked entities by name, penalty volume, or case frequency.

```bash
curl -X GET "http://localhost:8000/api/entities?sort_by=total_penalty_amount&page_size=5"
```

### `GET /entities/{id}`
Retrieve full entity dossier with linked orders and historical penalty totals.

```bash
curl -X GET "http://localhost:8000/api/entities/e49129e1-e1f4-4113-82ef-d34bb6a9d944"
```

---

## 3. Analytics Endpoints

### `GET /analytics/records-per-day`
Time-series of daily order counts and penalty aggregates.

```bash
curl -X GET "http://localhost:8000/api/analytics/records-per-day?days=90"
```

### `GET /analytics/trends`
Rolling period-over-period velocity changes and percentage trends (`week` or `month`).

```bash
curl -X GET "http://localhost:8000/api/analytics/trends?interval=month"
```

### `GET /analytics/geo-distribution`
State-level enforcement counts and top bench cities.

```bash
curl -X GET "http://localhost:8000/api/analytics/geo-distribution"
```

### `GET /analytics/duplicates`
Fuzzy matching near-duplicate cluster detection.

```bash
curl -X GET "http://localhost:8000/api/analytics/duplicates?threshold=0.60"
```

---

## 4. Ingestion Jobs Endpoints

### `GET /jobs`
List crawler execution runs with status and record audit counts.

### `POST /jobs/sync`
Trigger manual synchronization.

#### Request Body:
```json
{
  "adapter_key": "sebi_adjudication_orders",
  "limit": 50,
  "incremental": true
}
```
