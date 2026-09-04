import asyncio
import hashlib
import io
import re
import uuid
from datetime import date, datetime

import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.db.models import RawDocument, Record, Source
from app.etl.entity_extractor import (
    extract_entities_from_text,
    extract_location,
    extract_regulations,
)

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


async def ingest_live_sebi_settlement_orders():
    print("Fetching live SEBI Settlement Orders from sebi.gov.in (smid=3)...")
    listing_url = (
        "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=2&ssid=9&smid=3"
    )

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        resp = await client.get(listing_url, headers=headers)
        if resp.status_code != 200:
            print(f"Failed to fetch listing: {resp.status_code}")
            return

        soup = BeautifulSoup(resp.text, "html.parser")
        rows = soup.find_all("tr")[1:15]  # Grab top 14 real settlement orders
        print(f"Found {len(rows)} live settlement rows on SEBI")

        async with AsyncSessionLocal() as session:
            src = (
                await session.execute(
                    select(Source).where(Source.adapter_key == "sebi_adjudication_orders")
                )
            ).scalar_one()

            added = 0
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 2:
                    continue
                date_str = cols[0].get_text(strip=True)
                link_elem = cols[1].find("a", href=True)
                if not link_elem:
                    continue
                title = cols[1].get_text(strip=True)
                order_url = link_elem["href"]

                # Check if already exists
                existing = (
                    await session.execute(select(Record).where(Record.source_url == order_url))
                ).scalar_one_or_none()
                if existing:
                    continue

                # Fetch order page
                page_resp = await client.get(order_url, headers=headers)
                if page_resp.status_code != 200:
                    continue

                # Parse pub date
                pub_date = date.today()
                for fmt in ("%b %d, %Y", "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"):
                    try:
                        pub_date = datetime.strptime(date_str, fmt).date()
                        break
                    except Exception:
                        pass

                page_soup = BeautifulSoup(page_resp.text, "html.parser")
                iframe = page_soup.find("iframe")
                pdf_url = None
                raw_text = page_soup.get_text()
                settlement_amount = None

                if iframe and iframe.has_attr("src"):
                    src_val = iframe["src"]
                    pdf_url = src_val.split("file=")[-1] if "file=" in src_val else src_val
                    try:
                        pdf_resp = await client.get(pdf_url, headers=headers)
                        if pdf_resp.status_code == 200:
                            reader = PdfReader(io.BytesIO(pdf_resp.content))
                            pdf_text = " ".join([p.extract_text() for p in reader.pages[:4]])
                            raw_text = pdf_text
                            # Extract settlement amount
                            # Pattern: Rs. X,XX,XXX or INR X,XX,XXX paid towards settlement
                            amt_matches = re.findall(
                                r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d+)?)", pdf_text
                            )
                            candidates = []
                            for a_str in amt_matches:
                                try:
                                    clean_val = float(a_str.replace(",", ""))
                                    if clean_val >= 100000.0:  # At least 1 Lakh INR
                                        candidates.append(clean_val)
                                except Exception:
                                    pass
                            if candidates:
                                settlement_amount = max(candidates)
                    except Exception as ex:
                        print(f"PDF extract error for {pdf_url}: {ex}")

                # Generate sha256
                chash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

                raw_doc = RawDocument(
                    id=uuid.uuid4(),
                    source_id=src.id,
                    source_ref=order_url,
                    content_hash=chash,
                    storage_path=f"raw/{chash}.html",
                    http_status=200,
                    mime_type="text/html",
                    raw_content=raw_text[:5000],
                )
                session.add(raw_doc)
                await session.flush()

                # Extract location and regulations
                jurisdiction, state_val, city_val = extract_location(raw_text)
                regs = extract_regulations(raw_text)

                # Extract noticee entity from title
                extracted_entities = extract_entities_from_text(title, raw_text)
                entity_names = (
                    [e.name for e in extracted_entities]
                    if extracted_entities
                    else ["Noticee Entity"]
                )

                ext_id = f"SEBI-SETTLE-{hashlib.md5(order_url.encode()).hexdigest()[:10].upper()}"

                record = Record(
                    id=uuid.uuid4(),
                    source_id=src.id,
                    raw_document_id=raw_doc.id,
                    external_id=ext_id,
                    record_type="settlement_order",
                    title=title,
                    summary=f"Settlement Order passed by SEBI under Settlement Proceedings Regulations, 2018 in the matter of {title}. Settlement amount of Rs. {settlement_amount:,.2f} remitted by the applicant."
                    if settlement_amount
                    else f"Settlement Order passed by SEBI in the matter of {title}.",
                    entity_names=entity_names,
                    jurisdiction=jurisdiction,
                    state=state_val,
                    city=city_val,
                    amount=settlement_amount,
                    status="published",
                    published_date=pub_date,
                    source_url=order_url,
                    raw_metadata={
                        "settlement_amount_inr": settlement_amount,
                        "pdf_url": pdf_url,
                        "regulations_cited": regs,
                        "state": state_val,
                        "city": city_val,
                    },
                )
                session.add(record)
                added += 1
                print(
                    f"Added [{added}] {title[:45]}... | Settlement: Rs. {settlement_amount} | State: {state_val}"
                )

            await session.commit()
            print(f"Successfully ingested {added} 100% REAL LIVE SEBI settlement orders!")


if __name__ == "__main__":
    asyncio.run(ingest_live_sebi_settlement_orders())
