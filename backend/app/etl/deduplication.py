from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from difflib import SequenceMatcher
import re


@dataclass
class DuplicateCluster:
    primary_record_id: str
    primary_title: str
    duplicate_record_id: str
    duplicate_title: str
    similarity_score: float
    reason: str
    entity_overlap: List[str]
    amount_difference: Optional[float]


def clean_title_for_sim(t: str) -> str:
    """Strip common legal order prefixes so similarity reflects actual entity and subject matter."""
    if not t:
        return ""
    s = re.sub(
        r"^(?:Final Order|Interim Order|Adjudication Order|Order|Revocation Order|Exemption Order|Settlement Order)\s+(?:in\s+the\s+matter\s+of|in\s+respect\s+of|against|regarding)\s+",
        "",
        t,
        flags=re.IGNORECASE,
    ).strip()
    return s.lower()


def calculate_text_similarity(a: str, b: str) -> float:
    """Calculate string similarity ratio using SequenceMatcher on subject matter."""
    clean_a = clean_title_for_sim(a)
    clean_b = clean_title_for_sim(b)
    if not clean_a or not clean_b:
        return 0.0
    return SequenceMatcher(None, clean_a, clean_b).ratio()


def detect_near_duplicates(records: List[Dict[str, Any]], similarity_threshold: float = 0.70) -> List[DuplicateCluster]:
    """
    Detect authentic near-duplicate records and cross-matter clusters using subject matter similarity,
    entity set overlap, and penalty amount parity.
    """
    duplicates: List[DuplicateCluster] = []
    n = len(records)

    for i in range(n):
        rec_a = records[i]
        entities_a = set(e.lower() for e in (rec_a.get("entity_names") or []))
        amt_a = rec_a.get("amount")

        for j in range(i + 1, n):
            rec_b = records[j]
            entities_b = set(e.lower() for e in (rec_b.get("entity_names") or []))
            amt_b = rec_b.get("amount")

            # 1. Title subject matter similarity
            title_sim = calculate_text_similarity(rec_a.get("title", ""), rec_b.get("title", ""))

            # 2. Entity overlap
            shared_entities = list(entities_a.intersection(entities_b))
            entity_overlap_score = (
                len(shared_entities) / max(len(entities_a.union(entities_b)), 1)
                if entities_a and entities_b
                else 0.0
            )

            # 3. Amount parity check
            amount_diff = None
            amount_matches = False
            if amt_a is not None and amt_b is not None:
                amount_diff = abs(float(amt_a) - float(amt_b))
                if amount_diff == 0 or (float(amt_a) > 0 and amount_diff / float(amt_a) < 0.05):
                    amount_matches = True

            # Combined heuristic
            is_dup = False
            reasons = []

            if title_sim >= similarity_threshold:
                is_dup = True
                reasons.append(f"High subject similarity ({title_sim:.2f})")

            if shared_entities and (amount_matches or title_sim > 0.50):
                is_dup = True
                reasons.append(f"Linked noticee ({', '.join(shared_entities)})")

            if is_dup:
                duplicates.append(
                    DuplicateCluster(
                        primary_record_id=str(rec_a.get("id", "")),
                        primary_title=rec_a.get("title", ""),
                        duplicate_record_id=str(rec_b.get("id", "")),
                        duplicate_title=rec_b.get("title", ""),
                        similarity_score=round(max(title_sim, entity_overlap_score, 0.75 if shared_entities else title_sim), 2),
                        reason="; ".join(reasons),
                        entity_overlap=shared_entities,
                        amount_difference=amount_diff,
                    )
                )

    return duplicates
