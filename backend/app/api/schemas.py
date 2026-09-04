import uuid
from datetime import date, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class EnvelopeResponse(BaseModel, Generic[T]):
    data: T
    meta: PaginationMeta | None = None


class RawDocumentSimple(BaseModel):
    id: uuid.UUID
    source_ref: str
    content_hash: str
    fetched_at: datetime
    http_status: int
    mime_type: str

    model_config = ConfigDict(from_attributes=True)


class EntitySimple(BaseModel):
    id: uuid.UUID
    name: str
    normalized_name: str
    entity_type: str
    record_count: int
    total_penalty_amount: float
    role: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RecordListItem(BaseModel):
    id: uuid.UUID
    source_id: uuid.UUID
    external_id: str
    record_type: str
    title: str
    summary: str | None = None
    entity_names: list[str] = []
    jurisdiction: str | None = None
    state: str | None = None
    city: str | None = None
    amount: float | None = None
    status: str
    published_date: date | None = None
    source_url: str
    ingested_at: datetime

    @field_validator("entity_names", mode="before")
    @classmethod
    def parse_entity_names(cls, v):
        if isinstance(v, list):
            return [str(x) for x in v if x]
        if isinstance(v, str):
            import csv
            import io
            import json

            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            if v.startswith("{") and v.endswith("}"):
                try:
                    reader = csv.reader(io.StringIO(v[1:-1]))
                    for row in reader:
                        return [r.strip('"') for r in row if r.strip('"')]
                except Exception:
                    pass
            return [v]
        return []

    @field_validator("amount", mode="before")
    @classmethod
    def parse_amount(cls, v):
        if v is None:
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None

    model_config = ConfigDict(from_attributes=True)


class RecordDetailItem(RecordListItem):
    raw_metadata: dict[str, Any] = {}
    raw_document: RawDocumentSimple | None = None
    entities: list[EntitySimple] = []

    @field_validator("raw_metadata", mode="before")
    @classmethod
    def parse_raw_metadata(cls, v):
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except Exception:
                return {}
        if v is None:
            return {}
        return v

    model_config = ConfigDict(from_attributes=True)


class EntityDetailItem(BaseModel):
    id: uuid.UUID
    name: str
    normalized_name: str
    entity_type: str
    first_seen: datetime
    last_seen: datetime
    record_count: int
    total_penalty_amount: float
    recent_records: list[RecordListItem] = []

    model_config = ConfigDict(from_attributes=True)


# Analytics Schemas
class DailyCount(BaseModel):
    date: str
    count: int
    total_penalty: float


class TrendMetric(BaseModel):
    label: str
    current_value: float
    previous_value: float
    percentage_change: float
    trend_direction: str  # up, down, flat


class TrendsResponse(BaseModel):
    interval: str
    total_orders_trend: TrendMetric
    total_penalties_trend: TrendMetric
    active_entities_trend: TrendMetric
    time_series: list[dict[str, Any]]


class EntityFrequencyItem(BaseModel):
    id: uuid.UUID
    name: str
    entity_type: str
    record_count: int
    total_penalty: float


class GeoDistributionItem(BaseModel):
    state: str
    record_count: int
    total_penalty: float
    top_cities: list[str]


class ProcessingStatsResponse(BaseModel):
    total_runs: int
    success_rate_percent: float
    average_duration_seconds: float
    total_records_ingested: int
    last_run_at: datetime | None = None
    recent_runs: list[dict[str, Any]] = []


class DuplicateItemResponse(BaseModel):
    primary_record_id: str
    primary_title: str
    duplicate_record_id: str
    duplicate_title: str
    similarity_score: float
    reason: str
    entity_overlap: list[str]
    amount_difference: float | None = None


# Job Schemas
class IngestionRunItem(BaseModel):
    id: uuid.UUID
    source_id: uuid.UUID
    started_at: datetime
    finished_at: datetime | None = None
    status: str
    records_seen: int
    records_added: int
    records_updated: int
    records_failed: int
    duration_seconds: float | None = None
    error_log: str | None = None
    triggered_by: str

    model_config = ConfigDict(from_attributes=True)


class SyncJobRequest(BaseModel):
    adapter_key: str = "sebi_adjudication_orders"
    limit: int = Field(default=50, ge=1, le=500)
    incremental: bool = True


class SyncJobResponse(BaseModel):
    message: str
    run_id: uuid.UUID
    status: str
    records_seen: int
    records_added: int
    records_updated: int
    records_failed: int
    duration_seconds: float | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    total_records: int
    total_entities: int
    uptime_seconds: float
