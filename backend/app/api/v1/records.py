import math
import uuid
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_, desc, asc, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.db.models import Record, Entity, RecordEntity, RawDocument
from app.api.schemas import (
    EnvelopeResponse,
    PaginationMeta,
    RecordListItem,
    RecordDetailItem,
    RawDocumentSimple,
    EntitySimple,
)

router = APIRouter(prefix="/records", tags=["Records"])


@router.get("", response_model=EnvelopeResponse[List[RecordListItem]])
async def list_records(
    q: Optional[str] = Query(None, description="Full-text search query across title, summary, and jurisdiction"),
    state: Optional[str] = Query(None, description="Filter by state (e.g. Maharashtra, Delhi)"),
    record_type: Optional[str] = Query(None, description="Filter by record type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    entity: Optional[str] = Query(None, description="Filter by extracted entity name"),
    date_from: Optional[date] = Query(None, description="Filter orders published on or after date"),
    date_to: Optional[date] = Query(None, description="Filter orders published on or before date"),
    min_amount: Optional[float] = Query(None, description="Filter minimum penalty amount (INR)"),
    max_amount: Optional[float] = Query(None, description="Filter maximum penalty amount (INR)"),
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

    if q and q.strip():
        search_term = q.strip()
        # Dialect agnostic search: uses ILIKE on title/summary or TSVector if on postgres
        search_filter = or_(
            Record.title.ilike(f"%{search_term}%"),
            Record.summary.ilike(f"%{search_term}%"),
            Record.jurisdiction.ilike(f"%{search_term}%"),
            cast(Record.entity_names, String).ilike(f"%{search_term}%"),
        )
        filters.append(search_filter)

    if state and state.strip():
        filters.append(Record.state.ilike(state.strip()))

    if record_type and record_type.strip():
        filters.append(Record.record_type == record_type.strip())

    if status and status.strip():
        filters.append(Record.status == status.strip())

    if entity and entity.strip():
        ent_term = entity.strip()
        filters.append(
            or_(
                cast(Record.entity_names, String).ilike(f"%{ent_term}%"),
                Record.title.ilike(f"%{ent_term}%"),
            )
        )

    if date_from:
        filters.append(Record.published_date >= date_from)

    if date_to:
        filters.append(Record.published_date <= date_to)

    if min_amount is not None:
        filters.append(Record.amount >= min_amount)

    if max_amount is not None:
        filters.append(Record.amount <= max_amount)

    if filters:
        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

    # Count total matching
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one() or 0

    # Sorting
    order_func = desc if sort_order.lower() == "desc" else asc
    sort_column = Record.published_date
    if sort_by == "amount":
        sort_column = Record.amount
    elif sort_by == "ingested_at":
        sort_column = Record.ingested_at
    elif sort_by == "title":
        sort_column = Record.title

    stmt = stmt.order_by(order_func(sort_column).nulls_last())

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    records = result.scalars().all()

    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1

    return EnvelopeResponse(
        data=[RecordListItem.model_validate(r) for r in records],
        meta=PaginationMeta(
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{record_id}", response_model=RecordDetailItem)
async def get_record_detail(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve full normalized record details including raw document hash,
    traceable source URL, and linked entity graph.
    """
    stmt = (
        select(Record)
        .where(Record.id == record_id)
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
        raw_metadata=record.raw_metadata or {},
        raw_document=raw_doc_simple,
        entities=entities_list,
    )
