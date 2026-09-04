import asyncio
from datetime import UTC, datetime

from sqlalchemy import delete, select

from app.adapters.base import ExtractedEntityItem
from app.core.database import AsyncSessionLocal
from app.db.models import Entity, Record, RecordEntity
from app.etl.entity_extractor import (
    extract_entities_from_text,
    is_valid_entity_candidate,
    normalize_entity_name,
)


async def renormalize():
    async with AsyncSessionLocal() as session:
        # Delete existing noisy entity links and entities
        await session.execute(delete(RecordEntity))
        await session.execute(delete(Entity))
        await session.commit()

        # Load all records
        records_res = await session.execute(select(Record))
        records = records_res.scalars().all()

        entity_cache = {}

        for rec in records:
            # Re-extract clean entities from title and summary
            summary_text = rec.summary or ""
            raw_text = f"{rec.title}\n{summary_text}"
            extracted = extract_entities_from_text(rec.title, raw_text)

            # Also preserve any curated entities in raw_metadata if present
            meta = rec.raw_metadata or {}
            if "entities" in meta and isinstance(meta["entities"], list):
                for ent_name in meta["entities"]:
                    if is_valid_entity_candidate(ent_name):
                        norm = normalize_entity_name(ent_name)
                        if norm and not any(e.normalized_name == norm for e in extracted):
                            is_corp = any(
                                k in ent_name.lower()
                                for k in [
                                    "ltd",
                                    "llp",
                                    "corp",
                                    "pvt",
                                    "inc",
                                    "holding",
                                    "securities",
                                    "broker",
                                    "advisory",
                                    "capital",
                                ]
                            )
                            extracted.append(
                                ExtractedEntityItem(
                                    name=ent_name,
                                    normalized_name=norm,
                                    entity_type="company" if is_corp else "individual",
                                    role="noticee",
                                )
                            )

            clean_names = []
            seen_in_record = set()
            for item in extracted:
                norm = item.normalized_name
                if norm in seen_in_record:
                    continue
                seen_in_record.add(norm)
                clean_names.append(item.name)

                # Ensure published_date has a valid timezone-aware datetime for first_seen/last_seen
                p_date = rec.published_date
                if p_date:
                    ts = datetime.combine(p_date, datetime.min.time(), tzinfo=UTC)
                else:
                    ts = datetime.now(UTC)

                penalty_amt = float(rec.amount) if rec.amount else 0.0

                if norm not in entity_cache:
                    ent = Entity(
                        name=item.name,
                        normalized_name=norm,
                        entity_type=item.entity_type,
                        first_seen=ts,
                        last_seen=ts,
                        record_count=1,
                        total_penalty_amount=penalty_amt,
                    )
                    session.add(ent)
                    await session.flush()
                    entity_cache[norm] = ent
                else:
                    ent = entity_cache[norm]
                    ent.record_count += 1
                    ent.total_penalty_amount += penalty_amt
                    if ts > ent.last_seen:
                        ent.last_seen = ts
                    if ts < ent.first_seen:
                        ent.first_seen = ts

                # Link
                link = RecordEntity(
                    record_id=rec.id,
                    entity_id=ent.id,
                    role=item.role,
                )
                session.add(link)

            rec.entity_names = clean_names
            session.add(rec)

        await session.commit()
        print(f"Successfully re-indexed clean entities! Total clean entities: {len(entity_cache)}")


if __name__ == "__main__":
    asyncio.run(renormalize())
