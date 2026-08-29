import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Date,
    Numeric,
    Integer,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY, TSVECTOR
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SafeUUID(TypeDecorator):
    """Platform-independent GUID/UUID type."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except (ValueError, AttributeError):
            return value


class SafeJSON(TypeDecorator):
    """Platform-independent JSON type."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        import json
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        import json
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value


class SafeArray(TypeDecorator):
    """Platform-independent String Array type."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(ARRAY(String))
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        import json
        if value is None:
            return [] if dialect.name == "postgresql" else "[]"
        if isinstance(value, str):
            value = [value]
        if dialect.name == "postgresql":
            return list(value)
        return json.dumps(list(value))

    def process_result_value(self, value, dialect):
        import json
        if value is None:
            return []
        if isinstance(value, list):
            if len(value) > 1 and all(isinstance(x, str) and len(x) == 1 for x in value):
                joined = "".join(value)
                if joined.startswith("{") and joined.endswith("}"):
                    import csv
                    import io
                    try:
                        reader = csv.reader(io.StringIO(joined[1:-1]))
                        for row in reader:
                            return [r.strip('"') for r in row if r.strip('"')]
                    except Exception:
                        pass
                try:
                    parsed = json.loads(joined)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
            return value
        if isinstance(value, str):
            if value.startswith("{") and value.endswith("}"):
                import csv
                import io
                try:
                    reader = csv.reader(io.StringIO(value[1:-1]))
                    for row in reader:
                        return [r.strip('"') for r in row if r.strip('"')]
                except Exception:
                    pass
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [value]
        return value


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    base_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    adapter_key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    raw_documents: Mapped[List["RawDocument"]] = relationship("RawDocument", back_populates="source", cascade="all, delete-orphan")
    records: Mapped[List["Record"]] = relationship("Record", back_populates="source", cascade="all, delete-orphan")
    ingestion_runs: Mapped[List["IngestionRun"]] = relationship("IngestionRun", back_populates="source", cascade="all, delete-orphan")
    crawl_state: Mapped[Optional["CrawlState"]] = relationship("CrawlState", back_populates="source", uselist=False, cascade="all, delete-orphan")


class RawDocument(Base):
    __tablename__ = "raw_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_ref: Mapped[str] = mapped_column(String(1024), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    storage_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    http_status: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), default="text/html", nullable=False)
    raw_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    source: Mapped["Source"] = relationship("Source", back_populates="raw_documents")
    record: Mapped[Optional["Record"]] = relationship("Record", back_populates="raw_document", uselist=False)

    __table_args__ = (
        Index("ix_raw_documents_hash_source", "source_id", "content_hash"),
    )


class Record(Base):
    __tablename__ = "records"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    raw_document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        SafeUUID, ForeignKey("raw_documents.id", ondelete="SET NULL"), nullable=True, index=True
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    record_type: Mapped[str] = mapped_column(String(100), default="order", nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    entity_names: Mapped[List[str]] = mapped_column(SafeArray, default=list, nullable=False)
    jurisdiction: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(100), default="active", nullable=False, index=True)
    published_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )
    raw_metadata: Mapped[Dict[str, Any]] = mapped_column(SafeJSON, default=dict, nullable=False)

    # Relationships
    source: Mapped["Source"] = relationship("Source", back_populates="records")
    raw_document: Mapped[Optional["RawDocument"]] = relationship("RawDocument", back_populates="record")
    record_entities: Mapped[List["RecordEntity"]] = relationship(
        "RecordEntity", back_populates="record", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_records_source_ext_id", "source_id", "external_id", unique=True),
        Index("ix_records_pub_date_state", "published_date", "state"),
    )


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), default="company", nullable=False, index=True)  # company, individual, intermediary
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_penalty_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0, nullable=False)

    # Relationships
    record_links: Mapped[List["RecordEntity"]] = relationship(
        "RecordEntity", back_populates="entity", cascade="all, delete-orphan"
    )


class RecordEntity(Base):
    __tablename__ = "record_entities"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    record_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(100), default="noticee", nullable=False)  # noticee, respondent, intermediary, regulator

    # Relationships
    record: Mapped["Record"] = relationship("Record", back_populates="record_entities")
    entity: Mapped["Entity"] = relationship("Entity", back_populates="record_links")

    __table_args__ = (
        Index("ix_record_entity_unique", "record_id", "entity_id", "role", unique=True),
    )


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False, index=True)  # queued, running, success, partial, failed
    records_seen: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_added: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(100), default="scheduler", nullable=False)

    # Relationships
    source: Mapped["Source"] = relationship("Source", back_populates="ingestion_runs")


class CrawlState(Base):
    __tablename__ = "crawl_state"

    id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        SafeUUID, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    last_cursor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_runs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    source: Mapped["Source"] = relationship("Source", back_populates="crawl_state")
