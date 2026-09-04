"""Initial schema with pg_trgm and tsvector search

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-08-29 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Extensions
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        op.execute("CREATE EXTENSION IF NOT EXISTS unaccent;")

    # 2. Sources table
    op.create_table(
        "sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("base_url", sa.String(1024), nullable=False),
        sa.Column("adapter_key", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Raw documents table
    op.create_table(
        "raw_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(36),
            sa.ForeignKey("sources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_ref", sa.String(1024), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("storage_path", sa.String(1024), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=False, server_default="200"),
        sa.Column("mime_type", sa.String(100), nullable=False, server_default="text/html"),
        sa.Column("raw_content", sa.Text(), nullable=True),
    )
    op.create_index("ix_raw_documents_source_id", "raw_documents", ["source_id"])
    op.create_index("ix_raw_documents_content_hash", "raw_documents", ["content_hash"])
    op.create_index("ix_raw_documents_hash_source", "raw_documents", ["source_id", "content_hash"])

    # 4. Records table
    op.create_table(
        "records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(36),
            sa.ForeignKey("sources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "raw_document_id",
            sa.String(36),
            sa.ForeignKey("raw_documents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("record_type", sa.String(100), nullable=False, server_default="order"),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("entity_names", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("jurisdiction", sa.String(255), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("status", sa.String(100), nullable=False, server_default="active"),
        sa.Column("published_date", sa.Date(), nullable=True),
        sa.Column("source_url", sa.String(2048), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("raw_metadata", sa.Text(), nullable=False, server_default="{}"),
    )
    op.create_index("ix_records_source_id", "records", ["source_id"])
    op.create_index("ix_records_raw_document_id", "records", ["raw_document_id"])
    op.create_index("ix_records_external_id", "records", ["external_id"])
    op.create_index("ix_records_record_type", "records", ["record_type"])
    op.create_index("ix_records_status", "records", ["status"])
    op.create_index("ix_records_state", "records", ["state"])
    op.create_index("ix_records_published_date", "records", ["published_date"])
    op.create_index(
        "ix_records_source_ext_id", "records", ["source_id", "external_id"], unique=True
    )
    op.create_index("ix_records_pub_date_state", "records", ["published_date", "state"])

    # 5. Entities table
    op.create_table(
        "entities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("normalized_name", sa.String(512), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False, server_default="company"),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("total_penalty_amount", sa.Numeric(18, 2), nullable=False, server_default="0.00"),
    )
    op.create_index("ix_entities_normalized_name", "entities", ["normalized_name"])
    op.create_index("ix_entities_entity_type", "entities", ["entity_type"])

    # 6. Record entities (many to many)
    op.create_table(
        "record_entities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "entity_id",
            sa.String(36),
            sa.ForeignKey("entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(100), nullable=False, server_default="noticee"),
    )
    op.create_index("ix_record_entities_record_id", "record_entities", ["record_id"])
    op.create_index("ix_record_entities_entity_id", "record_entities", ["entity_id"])
    op.create_index(
        "ix_record_entity_unique",
        "record_entities",
        ["record_id", "entity_id", "role"],
        unique=True,
    )

    # 7. Ingestion runs
    op.create_table(
        "ingestion_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(36),
            sa.ForeignKey("sources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="running"),
        sa.Column("records_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_added", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_seconds", sa.Numeric(10, 2), nullable=True),
        sa.Column("error_log", sa.Text(), nullable=True),
        sa.Column("triggered_by", sa.String(100), nullable=False, server_default="scheduler"),
    )
    op.create_index("ix_ingestion_runs_source_id", "ingestion_runs", ["source_id"])
    op.create_index("ix_ingestion_runs_status", "ingestion_runs", ["status"])

    # 8. Crawl state
    op.create_table(
        "crawl_state",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(36),
            sa.ForeignKey("sources.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("last_cursor", sa.String(255), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_runs", sa.Integer(), nullable=False, server_default="0"),
    )

    # 9. Postgres specific tsvector and trigram indexes
    if conn.dialect.name == "postgresql":
        op.execute(
            """
            ALTER TABLE records 
            ADD COLUMN search_vector tsvector 
            GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(jurisdiction, ''))
            ) STORED;
            """
        )
        op.execute("CREATE INDEX ix_records_search_vector ON records USING gin(search_vector);")
        op.execute("CREATE INDEX ix_records_title_trgm ON records USING gin(title gin_trgm_ops);")
        op.execute("CREATE INDEX ix_entities_name_trgm ON entities USING gin(name gin_trgm_ops);")
        op.execute(
            "CREATE INDEX ix_entities_normalized_name_trgm ON entities USING gin(normalized_name gin_trgm_ops);"
        )


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS ix_entities_normalized_name_trgm;")
        op.execute("DROP INDEX IF EXISTS ix_entities_name_trgm;")
        op.execute("DROP INDEX IF EXISTS ix_records_title_trgm;")
        op.execute("DROP INDEX IF EXISTS ix_records_search_vector;")

    op.drop_table("crawl_state")
    op.drop_table("ingestion_runs")
    op.drop_table("record_entities")
    op.drop_table("entities")
    op.drop_table("records")
    op.drop_table("raw_documents")
    op.drop_table("sources")
