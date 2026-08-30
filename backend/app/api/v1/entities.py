import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.schemas import (
    EntityDetailItem,
    EntitySimple,
    EnvelopeResponse,
    PaginationMeta,
    RecordListItem,
)
from app.core.database import get_db
from app.db.models import Entity, RecordEntity

router = APIRouter(prefix="/entities", tags=["Entities"])


@router.get("", response_model=EnvelopeResponse[list[EntitySimple]])
async def list_entities(
    q: str | None = Query(None, description="Search entity by name or normalized name"),
    entity_type: str | None = Query(None, description="Filter by type (company, individual, intermediary)"),
    sort_by: str = Query("record_count", description="Sort by (record_count, total_penalty_amount, name)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List and search tracked entities (companies, noticees, intermediaries) across regulatory orders."""
    stmt = select(Entity)
    count_stmt = select(func.count(Entity.id))

    if q and q.strip():
        term = q.strip().lower()
        search_filter = Entity.normalized_name.ilike(f"%{term}%")
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if entity_type and entity_type.strip():
        stmt = stmt.where(Entity.entity_type == entity_type.strip().lower())
        count_stmt = count_stmt.where(Entity.entity_type == entity_type.strip().lower())

    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one() or 0

    order_func = desc if sort_order.lower() == "desc" else asc
    sort_column = Entity.record_count
    if sort_by == "total_penalty_amount":
        sort_column = Entity.total_penalty_amount
    elif sort_by == "name":
        sort_column = Entity.name

    stmt = stmt.order_by(order_func(sort_column))

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    entities = result.scalars().all()

    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1

    return EnvelopeResponse(
        data=[
            EntitySimple(
                id=e.id,
                name=e.name,
                normalized_name=e.normalized_name,
                entity_type=e.entity_type,
                record_count=e.record_count,
                total_penalty_amount=float(e.total_penalty_amount or 0.0),
            )
            for e in entities
        ],
        meta=PaginationMeta(
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{entity_id}", response_model=EntityDetailItem)
async def get_entity_detail(
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve comprehensive entity dossier with linked historical orders and penalty sums."""
    stmt = (
        select(Entity)
        .where(Entity.id == entity_id)
        .options(
            selectinload(Entity.record_links).selectinload(RecordEntity.record)
        )
    )
    result = await db.execute(stmt)
    entity = result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    recent_records = []
    if entity.record_links:
        for rl in entity.record_links:
            if rl.record:
                recent_records.append(RecordListItem.model_validate(rl.record))

    return EntityDetailItem(
        id=entity.id,
        name=entity.name,
        normalized_name=entity.normalized_name,
        entity_type=entity.entity_type,
        first_seen=entity.first_seen,
        last_seen=entity.last_seen,
        record_count=entity.record_count,
        total_penalty_amount=float(entity.total_penalty_amount or 0.0),
        recent_records=recent_records,
    )
