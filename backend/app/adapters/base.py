from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Optional, Dict, Any, Tuple


@dataclass
class RawRecordRef:
    """Discovered reference to a record on the source registry."""
    external_id: str
    source_url: str
    title: str
    published_date: Optional[date] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RawDocumentPayload:
    """Fetched raw content snapshot of a registry document/page."""
    source_ref: str
    content_bytes: bytes
    content_hash: str
    mime_type: str = "text/html"
    http_status: int = 200
    storage_path: Optional[str] = None
    text_content: Optional[str] = None


@dataclass
class ExtractedEntityItem:
    """Extracted entity associated with a record."""
    name: str
    normalized_name: str
    entity_type: str  # company, individual, intermediary
    role: str  # noticee, respondent, intermediary, regulator


@dataclass
class NormalizedRecord:
    """Standardized record ready for database storage and indexing."""
    external_id: str
    record_type: str  # order, notice, case, adjudication
    title: str
    summary: Optional[str]
    entity_names: List[str]
    jurisdiction: Optional[str]
    state: Optional[str]
    city: Optional[str]
    amount: Optional[float]
    status: str
    published_date: Optional[date]
    source_url: str
    raw_metadata: Dict[str, Any]
    entities: List[ExtractedEntityItem] = field(default_factory=list)


class SourceAdapter(ABC):
    """Abstract base class for all public registry source adapters."""

    @property
    @abstractmethod
    def adapter_key(self) -> str:
        """Unique identifier for this adapter (e.g. sebi_orders, rera_projects)."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable display name for this registry source."""
        pass

    @property
    @abstractmethod
    def base_url(self) -> str:
        """Base URL of the public registry."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Brief description of the registry and data provided."""
        pass

    @abstractmethod
    async def discover(
        self,
        since: Optional[datetime] = None,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> Tuple[List[RawRecordRef], Optional[str]]:
        """
        Discover new or changed record references since the last sync cursor.
        Returns a tuple of (references, next_cursor).
        """
        pass

    @abstractmethod
    async def fetch(self, ref: RawRecordRef) -> RawDocumentPayload:
        """Fetch raw document (HTML / PDF) for a given reference."""
        pass

    @abstractmethod
    async def parse(
        self, raw: RawDocumentPayload, ref: RawRecordRef
    ) -> NormalizedRecord:
        """Parse raw document into normalized schema with entity extraction."""
        pass
