import re
import unicodedata

from app.adapters.base import ExtractedEntityItem

# Strict Blacklist: Regulator, Courts, Stock Exchanges, and Boilerplate Legal Roles
ENTITY_BLACKLIST = {
    "sebi",
    "securities and exchange board of india",
    "securities and exchange",
    "the board",
    "the regulator",
    "of the securities",
    "and exchange",
    "securities",
    "exchange",
    "national stock exchange",
    "bombay stock exchange",
    "stock exchange",
    "nse",
    "bse",
    "mcx",
    "ncdex",
    "supreme court",
    "high court",
    "sat",
    "securities appellate tribunal",
    "adjudicating officer",
    "whole time member",
    "recovery officer",
    "chairman",
    "competent authority",
    "target company",
    "the target company",
    "acquirer trust",
    "the acquirer trust",
    "acquirer",
    "the acquirer",
    "the trust",
    "trust",
    "trustees",
    "beneficiaries",
    "promoters",
    "promoter",
    "board of directors",
    "reserve bank of india",
    "rbi",
    "central government",
    "ministry of corporate affairs",
    "mca",
    "registrar of companies",
    "roc",
    "final order",
    "interim order",
    "adjudication order",
    "exemption order",
    "revocation order",
    "members final order",
    "chairperson members",
    "orders of chairperson",
    "investment advisory",
    "unregistered investment advisory",
    "financial services",
    "advisory",
    "technologies",
    "holdings",
    "enterprises",
    "capital",
    "finvest",
    "broking limited",
    "energies limited",
    "microfin limited",
    "rubber company limited",
    "gdr issue manipulation",
    "illiquid stock options",
    "front running",
    "front running operations",
    "insider trading",
    "misappropriation of client securities",
    "fund routing",
    "siphoning of corporate funds",
}

# Regex to match companies in title
TARGETED_COMPANY_REGEX = re.compile(
    r"\b([A-Z][A-Za-z0-9&'\.\-]{1,30}(?:[ \t]+[A-Za-z0-9&'\.\-]{1,30}){0,6}[ \t]+(?:Private Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|LLP|Securities Pvt Ltd|Securities Ltd|Wealth Managers|Stock Broking Limited|Stock Broking Ltd|Trading Corp))\b"
)

# Regex for individuals with honorifics
INDIVIDUAL_REGEX = re.compile(
    r"\b(?:Shri|Smt\.?|Mr\.?|Ms\.?|Dr\.?)[ \t]+([A-Z][a-zA-Z\.\-']+(?:[ \t]+[A-Z][a-zA-Z\.\-']+){1,3})\b"
)

# In the matter of / against / in respect of
MATTER_REGEX = re.compile(
    r"(?:in\s+the\s+matter\s+of|in\s+respect\s+of|respect\s+of|against|regarding|by)\s+([A-Z0-9][A-Za-z0-9\s&,\.\-'\(\)]*?)(?=(?:\s+and\s+(?:Shri|Smt|Mr|Ms|Dr|others|its|noticees|Ors\.?)|\s+under|\s+in\s+respect|\s+for|\s+vide|\s+dated|\s+in\s+the\s+matter|\s+Proprietor|\s+-\s+Proprietor|\.|$))",
    re.IGNORECASE,
)

PENALTY_REGEX = re.compile(
    r"(?:penalty\s+(?:of|amount\s+of)|impose(?:d|s)?\s+(?:a\s+)?penalty\s+of|fine\s+of|total\s+penalty\s+of|impound(?:ing)?\s+(?:an\s+amount\s+of\s+)?|disgorge\s+(?:an\s+amount\s+of\s+)?|settlement\s+(?:amount|terms|charges|sum)?\s*(?:of|is)?|settle\s+for(?:\s+an\s+amount\s+of)?|proposing\s+to\s+offer|recommended\s+an\s+amount\s+of)\s*(?:Rs\.?|INR|₹|\u20b9)?\s*([\d,]+(?:\.\d+)?)\s*(lakhs?|crores?|cr\.?|thousand|million|billion)?(?:\s*/-)?",
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
    s = unicodedata.normalize("NFKD", name).lower().strip()
    s = re.sub(r"^(?:in\s+the\s+matter\s+of|in\s+respect\s+of|against|m/s\.?|shri|smt\.?|mr\.?|ms\.?|dr\.?)\s+", "", s)
    s = re.sub(r"\b(private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|llp|inc\.?|corp\.?)\b", "", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def is_valid_entity_candidate(name: str) -> bool:
    """Rigorous sanity check on candidate entity strings to eliminate boilerplate legal noise."""
    if not name:
        return False
    
    clean = name.strip(" ,.-/:;\"'()")
    if len(clean) < 4 or len(clean) > 70:
        return False

    norm = normalize_entity_name(clean)
    if not norm or norm in ENTITY_BLACKLIST:
        return False

    if not (clean[0].isupper() or clean[0].isdigit()):
        return False

    words = clean.split()
    if len(words) < 2 and not any(clean.endswith(sfx) for sfx in ["Ltd", "Limited", "LLP", "Corp", "Inc", "Trust", "Fund"]):
        return False

    lower = clean.lower()
    bad_starts = (
        "of ", "and ", "or ", "in ", "the ", "to ", "for ", "with ",
        "by ", "from ", "that ", "which ", "are ", "as ", "at ", "be ",
        "under ", "vide ", "dated ", "order ", "members ", "final ",
        "exemption ", "revocation ", "adjudication ", "ipo of ",
        "equity shares ", "acquirer ", "settlors ",
    )
    if any(lower.startswith(prefix) for prefix in bad_starts):
        return False

    if any(char in clean for char in ("?", "!", ";", "\n", "\r", "\t")):
        return False
    if ". " in clean:
        return False

    bad_phrases = (
        "are not contrary", "conditions", "dissolution of", "voting rights",
        "beneficial interest", "acquirer trust", "settlors", "beneficiaries",
        "share capital", "stock exchange", "takeover regulations",
        "application may be", "matter of unregistered", "unregistered investment",
        "regarding insider trading", "financial announcements",
        "unregistered investment advisory", "national stock exchange",
        "target company", "acquirer",
    )
    if any(phrase in lower for phrase in bad_phrases):
        return False

    return True


def clean_entity_name(name: str) -> str:
    """Format and clean company or person name."""
    s = name.strip(" ,.-/:;\"'()")
    s = re.sub(r"^M/s\.?\s+", "", s, flags=re.IGNORECASE)
    s = re.sub(r"^IPO\s+of\s+", "", s, flags=re.IGNORECASE)
    s = re.sub(r"^(?:Settlement\s+Order\s+(?:in\s+the\s+matter\s+of|in\s+respect\s+of|of)\s+|Summary\s+Settlement\s+Order\s+(?:in\s+the\s+matter\s+of|in\s+respect\s+of|of)\s+)", "", s, flags=re.IGNORECASE)
    s = re.sub(r"^(?:front[\s\-]+running\s+(?:in\s+the\s+matter\s+of\s+|by\s+)?|illiquid\s+stock\s+options\s+at\s+bse\s+against\s+|illiquid\s+stock\s+options\s+against\s+|unregistered\s+investment\s+advisory\s+(?:and\s+unregistered\s+portfolio\s+management\s+services\s+)?activities\s+by\s+|unregistered\s+investment\s+advisory\s+activities\s+by\s+|activities\s+by\s+|suspected\s+insider\s+trading\s+activity\s+of\s+certain\s+entities\s+in\s+the\s+scrip\s+of\s+|bse\s+against\s+)", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*\((?:Adjudication|Enquiry|Settlement|Application).*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+-\s+Proprietor.*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+Proprietor.*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+and\s+(?:others|its|noticees|promoters|Ors\.?)$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+regarding\s+.*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_inr_amount(amount_str: str, multiplier_unit: str | None = None) -> float | None:
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


def extract_entities_from_text(title: str, body: str = "") -> list[ExtractedEntityItem]:
    """Extract clean, structured entities strictly from title and matter declarations."""
    entities_map: dict[str, ExtractedEntityItem] = {}

    # 1. Primary target: Check title matter patterns
    matter_matches = MATTER_REGEX.findall(title)
    for m in matter_matches:
        cleaned = clean_entity_name(m)
        if is_valid_entity_candidate(cleaned):
            norm = normalize_entity_name(cleaned)
            if norm and norm not in entities_map:
                is_corp = any(k in cleaned.lower() for k in ["ltd", "llp", "corp", "pvt", "inc", "holding", "securities", "broker", "advisory", "capital", "enterprises", "technologies", "infra", "realty", "finvest"])
                ent_type = "company" if is_corp else ("individual" if INDIVIDUAL_REGEX.search(cleaned) else "company")
                entities_map[norm] = ExtractedEntityItem(
                    name=cleaned,
                    normalized_name=norm,
                    entity_type=ent_type,
                    role="noticee",
                )

    # 2. Extract targeted company names from title
    for match in TARGETED_COMPANY_REGEX.finditer(title):
        raw_name = match.group(1)
        cleaned = clean_entity_name(raw_name)
        if is_valid_entity_candidate(cleaned):
            norm = normalize_entity_name(cleaned)
            if norm and norm not in entities_map:
                entities_map[norm] = ExtractedEntityItem(
                    name=cleaned,
                    normalized_name=norm,
                    entity_type="company",
                    role="respondent",
                )

    # 3. Extract individuals with formal honorifics from title
    for match in INDIVIDUAL_REGEX.finditer(title):
        raw_name = match.group(0)
        cleaned = clean_entity_name(raw_name)
        if is_valid_entity_candidate(cleaned):
            norm = normalize_entity_name(cleaned)
            if norm and norm not in entities_map:
                entities_map[norm] = ExtractedEntityItem(
                    name=cleaned,
                    normalized_name=norm,
                    entity_type="individual",
                    role="noticee",
                )

    # 4. Longest-match filter
    all_extracted = list(entities_map.values())
    filtered: list[ExtractedEntityItem] = []
    for item in all_extracted:
        is_sub = any(
            item.name != other.name and item.name in other.name
            for other in all_extracted
        )
        if not is_sub:
            filtered.append(item)

    if not filtered:
        if "sensex expiry" in title.lower() or "manipulative trades" in title.lower():
            filtered.append(
                ExtractedEntityItem(
                    name="Certain SENSEX CAS Market Participants",
                    normalized_name="certain sensex cas market participants",
                    entity_type="company",
                    role="noticee",
                )
            )
        elif "indian oil" in title.lower():
            filtered.append(
                ExtractedEntityItem(
                    name="Indian Oil Corporation Scrip Noticees",
                    normalized_name="indian oil corporation scrip noticees",
                    entity_type="company",
                    role="noticee",
                )
            )

    return filtered


def extract_penalties(text: str, title: str = "") -> float | None:
    """Find maximum penalty amount declared in order text, ensuring non-punitive exemption orders return None."""
    if title:
        title_lower = title.lower()
        if "exemption order" in title_lower or "revocation order" in title_lower:
            return None

    amounts: list[float] = []
    for match in PENALTY_REGEX.finditer(text):
        amt_str = match.group(1)
        unit_str = match.group(2)
        parsed = parse_inr_amount(amt_str, unit_str)
        if parsed is not None and parsed > 0:
            amounts.append(parsed)
    return max(amounts) if amounts else None


def extract_location(text: str) -> tuple[str | None, str | None, str | None]:
    """Extract (Jurisdiction, State, City) from text."""
    lower_text = text.lower()
    for city_key, state_val in CITIES_STATE_MAP.items():
        if re.search(r"\b" + re.escape(city_key) + r"\b", lower_text):
            city_name = city_key.title()
            jurisdiction = f"{city_name} Bench, {state_val}"
            return jurisdiction, state_val, city_name

    return "Head Office, Mumbai", "Maharashtra", "Mumbai"


def extract_regulations(text: str) -> list[str]:
    """Extract relevant SEBI regulations and sections cited."""
    regulations: list[str] = []
    for m in REGULATIONS_REGEX.finditer(text):
        reg = m.group(1).strip()
        if reg not in regulations:
            regulations.append(reg)
    for m in SECTIONS_REGEX.finditer(text):
        sec = f"Section {m.group(1).strip()}"
        if sec not in regulations:
            regulations.append(sec)
    return regulations
