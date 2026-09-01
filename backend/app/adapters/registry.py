
from app.adapters.base import SourceAdapter
from app.adapters.sebi_orders import SEBIOrdersAdapter


class AdapterRegistry:
    """Central registry for managing pluggable public registry source adapters."""

    def __init__(self):
        self._adapters: dict[str, SourceAdapter] = {}
        # Auto-register default SEBI adapter
        sebi_adapter = SEBIOrdersAdapter()
        self.register(sebi_adapter)
        self._adapters["sebi_orders"] = sebi_adapter
        self._adapters["sebi"] = sebi_adapter

    def register(self, adapter: SourceAdapter) -> None:
        self._adapters[adapter.adapter_key] = adapter

    def get(self, adapter_key: str) -> SourceAdapter | None:
        return self._adapters.get(adapter_key)

    def list_adapters(self) -> list[SourceAdapter]:
        # Return unique instances
        seen = set()
        unique = []
        for a in self._adapters.values():
            if a.adapter_key not in seen:
                seen.add(a.adapter_key)
                unique.append(a)
        return unique


registry = AdapterRegistry()
