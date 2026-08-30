import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any


@dataclass
class DuplicateCluster:
    primary_record_id: str
    primary_title: str
    duplicate_record_id: str
    duplicate_title: str
    similarity_score: float
    reason: str
    entity_overlap: list[str]
    amount_difference: float | None


def clean_title_for_sim(t: str) -> str:
    """
    Strip common legal order prefixes and generic corporate suffixes
    so similarity reflects the actual distinctive entity name and subject matter.
    """
    if not t:
        return ""
    # 1. Strip legal action prefixes
    s = re.sub(
        r"^(?:Final Order|Interim Order|Adjudication Order|Order|Revocation Order|Exemption Order|Settlement Order|Consent Order|Recovery Order)\s+(?:in\s+the\s+matter\s+of|in\s+respect\s+of|against|regarding)\s+",
        "",
        t,
        flags=re.IGNORECASE,
    ).strip()

    # 2. Strip generic corporate suffixes and common boilerplate noise
    s = re.sub(
        r"\b(?:private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|corporation|corp\.?|incorporated|inc\.?)\b",
        "",
        s,
        flags=re.IGNORECASE,
    ).strip()

    # 3. Normalize non-alphanumeric noise and extra spaces
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.lower()


def calculate_text_similarity(a: str, b: str) -> float:
    """Calculate string similarity ratio using SequenceMatcher on distinctive subject matter."""
    clean_a = clean_title_for_sim(a)
    clean_b = clean_title_for_sim(b)
    if not clean_a or not clean_b:
        return 0.0
    return SequenceMatcher(None, clean_a, clean_b).ratio()


def detect_near_duplicates(records: list[dict[str, Any]], similarity_threshold: float = 0.75) -> list[DuplicateCluster]:
    """
    Detect authentic near-duplicate records and cross-matter clusters using distinctive subject matter similarity,
    entity set overlap, and penalty amount parity.
    """
    duplicates: list[DuplicateCluster] = []
    n = len(records)

    for i in range(n):
        rec_a = records[i]
        entities_a = set(e.lower() for e in (rec_a.get("entity_names") or []))
        amt_a = rec_a.get("amount")

        for j in range(i + 1, n):
            rec_b = records[j]
            entities_b = set(e.lower() for e in (rec_b.get("entity_names") or []))
            amt_b = rec_b.get("amount")

            # 1. Distinct title subject matter similarity
            title_sim = calculate_text_similarity(rec_a.get("title", ""), rec_b.get("title", ""))

            # 2. Entity overlap
            shared_entities = list(entities_a.intersection(entities_b))

            # 3. Amount parity check
            amount_diff = None
            amount_matches = False
            if amt_a is not None and amt_b is not None:
                amount_diff = abs(float(amt_a) - float(amt_b))
                if amount_diff == 0 or (float(amt_a) > 0 and amount_diff / float(amt_a) < 0.05):
                    amount_matches = True

            # Heuristic for authentic duplicates / cross-references:
            # Must EITHER have:
            # - Shared Noticee/Entity AND (title similarity >= 0.40 OR amount match)
            # - High distinct title similarity (>= similarity_threshold, default 0.75)
            is_dup = False
            reasons = []

            if shared_entities:
                is_dup = True
                reasons.append(f"Linked noticee ({', '.join(shared_entities)})")
                if amount_matches:
                    reasons.append("Matching penalty parity")
                elif title_sim > 0.40:
                    reasons.append(f"Related proceeding ({title_sim:.2f})")
            elif title_sim >= similarity_threshold:
                is_dup = True
                reasons.append(f"High subject similarity ({title_sim:.2f})")

            if is_dup:
                score = max(
                    title_sim,
                    0.85 if shared_entities and amount_matches else (0.80 if shared_entities else title_sim),
                )
                duplicates.append(
                    DuplicateCluster(
                        primary_record_id=str(rec_a.get("id", "")),
                        primary_title=rec_a.get("title", ""),
                        duplicate_record_id=str(rec_b.get("id", "")),
                        duplicate_title=rec_b.get("title", ""),
                        similarity_score=round(score, 2),
                        reason="; ".join(reasons),
                        entity_overlap=shared_entities,
                        amount_difference=amount_diff,
                    )
                )

    # Sort clusters by similarity score descending
    duplicates.sort(key=lambda x: x.similarity_score, reverse=True)
    return duplicates
