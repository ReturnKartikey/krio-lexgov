import math
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, and_, asc, cast, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.schemas import (
    EntitySimple,
    EnvelopeResponse,
    PaginationMeta,
    RawDocumentSimple,
    RecordDetailItem,
    RecordListItem,
)
from app.core.database import get_db
from app.db.models import Record, RecordEntity

router = APIRouter(prefix="/records", tags=["Records"])


@router.get("", response_model=EnvelopeResponse[list[RecordListItem]])
async def list_records(
    q: str | None = Query(None, description="Full-text search query across title, summary, and jurisdiction"),
    state: str | None = Query(None, description="Filter by state (e.g. Maharashtra, Delhi)"),
    record_type: str | None = Query(None, description="Filter by record type"),
    status: str | None = Query(None, description="Filter by status"),
    entity: str | None = Query(None, description="Filter by extracted entity name"),
    date_from: date | None = Query(None, description="Filter orders published on or after date"),
    date_to: date | None = Query(None, description="Filter orders published on or before date"),
    min_amount: float | None = Query(None, description="Filter minimum penalty amount (INR)"),
    max_amount: float | None = Query(None, description="Filter maximum penalty amount (INR)"),
    penalty_slab: str | None = Query(None, description="Filter by penalty slab (zero, non_zero, thousands, lakhs, crores)"),
    sort_by: str = Query("published_date", description="Field to sort by (published_date, amount, ingested_at, title)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Records per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search and filter public regulatory enforcement orders with full-text indexing,
    entity filtering, penalty ranges, and date windows.
    """
    stmt = select(Record)
    count_stmt = select(func.count(Record.id))

    # Apply filters
    filters = []

    if isinstance(q, str) and q.strip():
        search_term = q.strip()
        tokens = [t for t in search_term.split() if len(t) > 1]
        
        # Base full-phrase match
        full_phrase_filter = or_(
            Record.title.ilike(f"%{search_term}%"),
            Record.summary.ilike(f"%{search_term}%"),
            Record.jurisdiction.ilike(f"%{search_term}%"),
            Record.external_id.ilike(f"%{search_term}%"),
            cast(Record.entity_names, String).ilike(f"%{search_term}%"),
        )
        
        if len(tokens) > 1:
            # Multi-token match: every word in query must match a field
            token_filters = []
            for tok in tokens:
                token_filters.append(
                    or_(
                        Record.title.ilike(f"%{tok}%"),
                        Record.summary.ilike(f"%{tok}%"),
                        Record.jurisdiction.ilike(f"%{tok}%"),
                        Record.external_id.ilike(f"%{tok}%"),
                        cast(Record.entity_names, String).ilike(f"%{tok}%"),
                    )
                )
            filters.append(or_(full_phrase_filter, and_(*token_filters)))
        else:
            filters.append(full_phrase_filter)

    if isinstance(state, str) and state.strip():
        filters.append(Record.state.ilike(f"%{state.strip()}%"))

    if isinstance(record_type, str) and record_type.strip():
        filters.append(Record.record_type.ilike(record_type.strip()))

    if isinstance(status, str) and status.strip():
        filters.append(Record.status.ilike(status.strip()))

    if isinstance(entity, str) and entity.strip():
        ent_term = entity.strip()
        ent_tokens = [t for t in ent_term.split() if len(t) > 1]
        if len(ent_tokens) > 1:
            ent_token_filters = [
                or_(
                    cast(Record.entity_names, String).ilike(f"%{tok}%"),
                    Record.title.ilike(f"%{tok}%"),
                )
                for tok in ent_tokens
            ]
            filters.append(
                or_(
                    cast(Record.entity_names, String).ilike(f"%{ent_term}%"),
                    Record.title.ilike(f"%{ent_term}%"),
                    and_(*ent_token_filters),
                )
            )
        else:
            filters.append(
                or_(
                    cast(Record.entity_names, String).ilike(f"%{ent_term}%"),
                    Record.title.ilike(f"%{ent_term}%"),
                )
            )

    if isinstance(date_from, (date, datetime)):
        filters.append(Record.published_date >= date_from)

    if isinstance(date_to, (date, datetime)):
        filters.append(Record.published_date <= date_to)

    if isinstance(min_amount, (int, float)):
        filters.append(Record.amount >= min_amount)

    if isinstance(max_amount, (int, float)):
        filters.append(Record.amount <= max_amount)

    if isinstance(penalty_slab, str) and penalty_slab.strip():
        ps = penalty_slab.strip().lower()
        if ps == "zero":
            filters.append(or_(Record.amount.is_(None), Record.amount == 0))
        elif ps == "non_zero":
            filters.append(and_(Record.amount.isnot(None), Record.amount > 0))
        elif ps in ("thousands", "k"):
            filters.append(and_(Record.amount >= 1000, Record.amount < 100000))
        elif ps in ("lakhs", "lakh"):
            filters.append(and_(Record.amount >= 100000, Record.amount < 10000000))
        elif ps in ("crores", "crore", "cr"):
            filters.append(Record.amount >= 10000000)

    if filters:
        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

    # Count total matching
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one() or 0

    # Sorting
    s_order = sort_order if isinstance(sort_order, str) else "desc"
    s_by = sort_by if isinstance(sort_by, str) else "published_date"
    p_num = page if isinstance(page, int) else 1
    p_size = page_size if isinstance(page_size, int) else 10

    order_func = desc if s_order.lower() == "desc" else asc
    sort_column = Record.published_date
    if s_by == "amount":
        sort_column = Record.amount
    elif s_by == "ingested_at":
        sort_column = Record.ingested_at
    elif s_by == "title":
        sort_column = Record.title

    stmt = stmt.order_by(order_func(sort_column).nulls_last())

    # Pagination
    offset = (p_num - 1) * p_size
    stmt = stmt.offset(offset).limit(p_size)

    result = await db.execute(stmt)
    records = result.scalars().all()

    total_pages = math.ceil(total_count / p_size) if p_size > 0 else 1

    return EnvelopeResponse(
        data=[RecordListItem.model_validate(r) for r in records],
        meta=PaginationMeta(
            total=total_count,
            page=p_num,
            page_size=p_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{record_id}", response_model=RecordDetailItem)
async def get_record_detail(
    record_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve full normalized record details including raw document hash,
    traceable source URL, and linked entity graph.
    Supports lookup by UUID (internal ID) or External Citation ID (e.g. SEBI-xxx).
    """
    clean_id = record_id.strip()
    id_filter = None
    try:
        val = uuid.UUID(clean_id)
        id_filter = or_(Record.id == val, Record.external_id.ilike(clean_id))
    except (ValueError, AttributeError):
        id_filter = Record.external_id.ilike(clean_id)

    stmt = (
        select(Record)
        .where(id_filter)
        .options(
            selectinload(Record.raw_document),
            selectinload(Record.record_entities).selectinload(RecordEntity.entity),
        )
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    raw_doc_simple = None
    if record.raw_document:
        raw_doc_simple = RawDocumentSimple.model_validate(record.raw_document)

    entities_list = []
    if record.record_entities:
        for re in record.record_entities:
            if re.entity:
                ent_dto = EntitySimple(
                    id=re.entity.id,
                    name=re.entity.name,
                    normalized_name=re.entity.normalized_name,
                    entity_type=re.entity.entity_type,
                    record_count=re.entity.record_count,
                    total_penalty_amount=float(re.entity.total_penalty_amount or 0.0),
                    role=re.role,
                )
                entities_list.append(ent_dto)

    raw_meta = record.raw_metadata
    if isinstance(raw_meta, str):
        try:
            import json
            raw_meta = json.loads(raw_meta)
        except Exception:
            raw_meta = {}
    elif not isinstance(raw_meta, dict):
        raw_meta = {}

    return RecordDetailItem(
        id=record.id,
        source_id=record.source_id,
        external_id=record.external_id,
        record_type=record.record_type,
        title=record.title,
        summary=record.summary,
        entity_names=record.entity_names,
        jurisdiction=record.jurisdiction,
        state=record.state,
        city=record.city,
        amount=float(record.amount) if record.amount is not None else None,
        status=record.status,
        published_date=record.published_date,
        source_url=record.source_url,
        ingested_at=record.ingested_at,
        raw_metadata=raw_meta,
        raw_document=raw_doc_simple,
        entities=entities_list,
    )
