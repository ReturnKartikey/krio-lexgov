import re
import unicodedata
from typing import List, Optional, Tuple, Dict, Any
from app.adapters.base import ExtractedEntityItem

# Precompiled Regex Patterns
COMPANY_REGEX = re.compile(
    r"\b([A-Z][A-Za-z0-9\s&,\.\-']{2,60}?(?:\s+(?:Private Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|LLP|Securities|Brokers|Capital|Finvest|Investments|Holdings|Enterprises|Corp(?:oration)?|Bank|Exchange|Advisory|Consultancy|Services|Traders|Technologies|Infra|Realty|Mutual Fund|Asset Management|Trust|Finance))\b)",
    re.IGNORECASE,
)

INDIVIDUAL_REGEX = re.compile(
    r"\b(?:Shri|Smt\.?|Mr\.?|Ms\.?|Dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b"
)

MATTER_REGEX = re.compile(
    r"(?:in\s+the\s+matter\s+of|in\s+respect\s+of|against|regarding)\s+([A-Z0-9\s&,\.\-']{3,100}?)(?=(?:\s+under|\s+in\s+respect|\s+for|\s+vide|\s+dated|\s+and|\.|$))",
    re.IGNORECASE,
)

PENALTY_REGEX = re.compile(
    r"(?:penalty\s+of|penalty\s+amount\s+of|impose(?:d|s)?\s+a\s+penalty\s+of|fine\s+of|total\s+penalty\s+of)?\s*(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d+)?)\s*(lakhs?|crores?|cr\.?|thousand|million|billion)?(?:\s*/-)?",
    re.IGNORECASE,
)

SECTIONS_REGEX = re.compile(
    r"(?:Section|Sec\.)\s+([0-9]+[A-Z]*(?:\([a-zA-Z0-9]+\))?)\s*(?:of\s+the\s+(?:SEBI|Securities\s+and\s+Exchange\s+Board\s+of\s+India)?\s*Act)?",
    re.IGNORECASE,
)

REGULATIONS_REGEX = re.compile(
    r"\b((?:PFUTP|PIT|SAST|LODR|Intermediaries|Stock\s+Brokers|Depository|Takeover|Merchant\s+Bankers|Mutual\s+Funds)\s+(?:Regulations|Rules)(?:\s*,\s*\d{4})?)\b",
    re.IGNORECASE,
)

CITIES_STATE_MAP = {
    "mumbai": "Maharashtra",
    "pune": "Maharashtra",
    "nagpur": "Maharashtra",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "bengaluru": "Karnataka",
    "bangalore": "Karnataka",
    "hyderabad": "Telangana",
    "chennai": "Tamil Nadu",
    "kolkata": "West Bengal",
    "ahmedabad": "Gujarat",
    "gandhinagar": "Gujarat",
    "surat": "Gujarat",
    "vadodara": "Gujarat",
    "jaipur": "Rajasthan",
    "chandigarh": "Chandigarh",
    "kochi": "Kerala",
    "ernakulam": "Kerala",
    "thiruvananthapuram": "Kerala",
    "indore": "Madhya Pradesh",
    "bhopal": "Madhya Pradesh",
    "lucknow": "Uttar Pradesh",
    "noida": "Uttar Pradesh",
    "patna": "Bihar",
    "bhubaneswar": "Odisha",
    "guwahati": "Assam",
}


def normalize_entity_name(name: str) -> str:
    """Normalize company or person names for standard indexing and deduplication."""
    if not name:
        return ""
    # Unicode normalize & lowercase
    s = unicodedata.normalize("NFKD", name).lower().strip()
    # Strip common prefixes
    s = re.sub(r"^(?:in\s+the\s+matter\s+of|in\s+respect\s+of|against|m/s\.?|shri|smt\.?|mr\.?|ms\.?|dr\.?)\s+", "", s)
    # Strip common corporate suffixes for matching
    s = re.sub(r"\b(private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|llp|inc\.?|corp\.?)\b", "", s)
    # Remove special punctuation & extra spaces
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_inr_amount(amount_str: str, multiplier_unit: Optional[str] = None) -> Optional[float]:
    """Convert parsed INR string and unit into standard float value."""
    try:
        clean_str = amount_str.replace(",", "").strip()
        base_val = float(clean_str)
        if not multiplier_unit:
            return round(base_val, 2)

        unit = multiplier_unit.lower()
        if "crore" in unit or unit == "cr" or unit == "cr.":
            return round(base_val * 10000000.0, 2)
        elif "lakh" in unit or "lac" in unit:
            return round(base_val * 100000.0, 2)
        elif "thousand" in unit:
            return round(base_val * 1000.0, 2)
        elif "million" in unit:
            return round(base_val * 1000000.0, 2)
        elif "billion" in unit:
            return round(base_val * 1000000000.0, 2)
        return round(base_val, 2)
    except Exception:
        return None


def extract_entities_from_text(title: str, body: str = "") -> List[ExtractedEntityItem]:
    """Extract structured entities (companies and individuals) with their roles."""
    combined_text = f"{title}\n{body}"
    entities_map: Dict[str, ExtractedEntityItem] = {}

    # 1. Check title matter patterns
    matter_matches = MATTER_REGEX.findall(title)
    for m in matter_matches:
        cleaned = m.strip(" ,.-/")
        if len(cleaned) > 2 and len(cleaned) < 120:
            norm = normalize_entity_name(cleaned)
            if norm and norm not in entities_map:
                ent_type = "individual" if INDIVIDUAL_REGEX.search(cleaned) else "company"
                entities_map[norm] = ExtractedEntityItem(
                    name=cleaned,
                    normalized_name=norm,
                    entity_type=ent_type,
                    role="noticee",
                )

    # 2. Extract companies from text
    for match in COMPANY_REGEX.finditer(combined_text):
        name = match.group(1).strip(" ,.-/")
        norm = normalize_entity_name(name)
        if norm and len(norm) > 3 and norm not in entities_map:
            entities_map[norm] = ExtractedEntityItem(
                name=name,
                normalized_name=norm,
                entity_type="company",
                role="respondent",
            )

    # 3. Extract individuals
    for match in INDIVIDUAL_REGEX.finditer(combined_text):
        name = match.group(0).strip(" ,.-/")
        norm = normalize_entity_name(name)
        if norm and len(norm) > 3 and norm not in entities_map:
            entities_map[norm] = ExtractedEntityItem(
                name=name,
                normalized_name=norm,
                entity_type="individual",
                role="noticee",
            )

    return list(entities_map.values())


def extract_penalties(text: str) -> Optional[float]:
    """Find maximum penalty amount declared in order text."""
    amounts: List[float] = []
    for match in PENALTY_REGEX.finditer(text):
        amt_str = match.group(1)
        unit_str = match.group(2)
        parsed = parse_inr_amount(amt_str, unit_str)
        if parsed is not None and parsed > 0:
            amounts.append(parsed)
    return max(amounts) if amounts else None


def extract_location(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract (Jurisdiction, State, City) from text."""
    lower_text = text.lower()
    for city_key, state_val in CITIES_STATE_MAP.items():
        if re.search(r"\b" + re.escape(city_key) + r"\b", lower_text):
            city_name = city_key.title()
            jurisdiction = f"{city_name} Bench, {state_val}"
            return jurisdiction, state_val, city_name

    # Default to SEBI Head Office in Mumbai
    return "Head Office, Mumbai", "Maharashtra", "Mumbai"


def extract_regulations(text: str) -> List[str]:
    """Extract relevant SEBI regulations and sections cited."""
    regulations: List[str] = []
    for m in REGULATIONS_REGEX.finditer(text):
        reg = m.group(1).strip()
        if reg not in regulations:
            regulations.append(reg)
    for m in SECTIONS_REGEX.finditer(text):
        sec = f"Section {m.group(1).strip()}"
        if sec not in regulations:
            regulations.append(sec)
    return regulations
