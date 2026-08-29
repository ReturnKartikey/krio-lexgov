from typing import Dict, List, Optional
from app.adapters.base import SourceAdapter
from app.adapters.sebi_orders import SEBIOrdersAdapter


class AdapterRegistry:
    """Central registry for managing pluggable public registry source adapters."""

    def __init__(self):
        self._adapters: Dict[str, SourceAdapter] = {}
        # Auto-register default SEBI adapter
        self.register(SEBIOrdersAdapter())

    def register(self, adapter: SourceAdapter) -> None:
        self._adapters[adapter.adapter_key] = adapter

    def get(self, adapter_key: str) -> Optional[SourceAdapter]:
        return self._adapters.get(adapter_key)

    def list_adapters(self) -> List[SourceAdapter]:
        return list(self._adapters.values())


registry = AdapterRegistry()
