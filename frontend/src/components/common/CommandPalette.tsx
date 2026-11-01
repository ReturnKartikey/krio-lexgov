"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  BarChart3,
  Scale,
  Sparkles,
  FileText,
  ShieldCheck,
  Terminal,
  ArrowRight,
  CornerDownLeft,
  X,
  AlertCircle,
} from "lucide-react";
import { getRecords, getEntities } from "@/lib/api";
import { RecordListItem, EntitySimple } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface PaletteAction {
  id: string;
  category: "navigation" | "actions" | "filters" | "orders" | "entities";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [orderResults, setOrderResults] = useState<RecordListItem[]>([]);
  const [entityResults, setEntityResults] = useState<EntitySimple[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Global Cmd+K or Ctrl+K shortcut and Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("krio-open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("krio-open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus search input when opened and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setOrderResults([]);
      setEntityResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced search for orders and entities
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setOrderResults([]);
      setEntityResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [recordsRes, entitiesRes] = await Promise.allSettled([
          getRecords({ q: trimmed, page_size: 4 }),
          getEntities({ q: trimmed, page_size: 3 }),
        ]);

        if (recordsRes.status === "fulfilled") {
          setOrderResults(recordsRes.value.data || []);
        } else {
          setOrderResults([]);
        }

        if (entitiesRes.status === "fulfilled") {
          setEntityResults(entitiesRes.value.data || []);
        } else {
          setEntityResults([]);
        }
      } catch {
        setOrderResults([]);
        setEntityResults([]);
      } finally {
        setIsSearching(false);
        setActiveIndex(0);
      }
    }, 160);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Construct items list based on current state
  const items: PaletteAction[] = [];

  if (query.trim() === "") {
    // 1. Navigation items
    items.push(
      {
        id: "nav-explorer",
        category: "navigation",
        title: "Records Explorer",
        subtitle: "Search 39+ normalized SEBI adjudication & consent orders",
        icon: Search,
        badge: "G E",
        onSelect: () => {
          router.push("/explorer");
          setIsOpen(false);
        },
      },
      {
        id: "nav-entities",
        category: "navigation",
        title: "Entities & Noticees Directory",
        subtitle: "Track repeat corporate & individual violators across jurisdictions",
        icon: Building2,
        badge: "G N",
        onSelect: () => {
          router.push("/entities");
          setIsOpen(false);
        },
      },
      {
        id: "nav-analytics",
        category: "navigation",
        title: "Market Enforcement Analytics",
        subtitle: "Temporal trends, penalty distribution, and geospatial maps",
        icon: BarChart3,
        badge: "G A",
        onSelect: () => {
          router.push("/analytics");
          setIsOpen(false);
        },
      },
      {
        id: "nav-api",
        category: "navigation",
        title: "Interactive API Console",
        subtitle: "RFC-04 SourceAdapter contracts and OpenGov endpoints",
        icon: Terminal,
        badge: "G P",
        onSelect: () => {
          router.push("/api-explorer");
          setIsOpen(false);
        },
      }
    );

    // 2. Smart Quick Actions
    items.push({
      id: "action-ai",
      category: "actions",
      title: "Open AI Legal Risk Brief",
      subtitle: "Multi-order synthesis and precedent extraction across docket",
      icon: Sparkles,
      badge: "⌘J",
      onSelect: () => {
        setIsOpen(false);
        window.dispatchEvent(new Event("krio-open-ai-modal"));
      },
    });

    // 3. Preset Filter Jumps
    items.push(
      {
        id: "filter-high-penalty",
        category: "filters",
        title: "High Penalty Orders (≥ ₹1 Crore)",
        subtitle: "Filter explorer to orders with substantial monetary sanctions",
        icon: Scale,
        onSelect: () => {
          router.push("/explorer?min_amount=10000000");
          setIsOpen(false);
        },
      },
      {
        id: "filter-adjudication",
        category: "filters",
        title: "Adjudication Enforcement Orders",
        subtitle: "View Section 15-I inquiry orders under the SEBI Act",
        icon: FileText,
        onSelect: () => {
          router.push("/explorer?record_type=adjudication_order");
          setIsOpen(false);
        },
      },
      {
        id: "filter-settlement",
        category: "filters",
        title: "Settlement & Consent Orders",
        subtitle: "View summary proceedings resolved via SEBI Settlement Regulations",
        icon: ShieldCheck,
        onSelect: () => {
          router.push("/explorer?record_type=settlement_order");
          setIsOpen(false);
        },
      }
    );
  } else {
    // When user types a query:
    // A. Matching Orders
    orderResults.forEach((record) => {
      items.push({
        id: `order-${record.id}`,
        category: "orders",
        title: record.title,
        subtitle: `${record.external_id} • ${formatDate(record.published_date)} • ${
          record.amount && record.amount > 0 ? formatINR(record.amount) : "Directional Order"
        }`,
        icon: FileText,
        badge: record.status.toUpperCase(),
        onSelect: () => {
          router.push(`/explorer/${record.id}`);
          setIsOpen(false);
        },
      });
    });

    // B. Matching Entities
    entityResults.forEach((entity) => {
      items.push({
        id: `entity-${entity.id}`,
        category: "entities",
        title: entity.name,
        subtitle: `${entity.entity_type.toUpperCase()} • ${entity.record_count} order(s) • Total ${formatINR(
          entity.total_penalty_amount
        )}`,
        icon: Building2,
        badge: "ENTITY",
        onSelect: () => {
          router.push(`/entities/${entity.id}`);
          setIsOpen(false);
        },
      });
    });

    // C. Search All In Explorer action
    items.push({
      id: "search-all-records",
      category: "navigation",
      title: `Search all orders for "${query}"`,
      subtitle: `View full ranked results and filters in Records Explorer`,
      icon: Search,
      badge: "↵",
      onSelect: () => {
        router.push(`/explorer?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      },
    });

    // D. Ask AI action with query
    items.push({
      id: "ask-ai-query",
      category: "actions",
      title: `Synthesize AI Risk Brief for "${query}"`,
      subtitle: `Generate instant multi-order precedent analysis for this keyword`,
      icon: Sparkles,
      badge: "AI",
      onSelect: () => {
        setIsOpen(false);
        window.dispatchEvent(
          new CustomEvent("krio-open-ai-modal-with-query", { detail: { query } })
        );
      },
    });
  }

  // Handle keyboard navigation inside the list
  const handleKeyDownInList = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[activeIndex]) {
        items[activeIndex].onSelect();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation & Pages",
    actions: "Quick Actions",
    filters: "Filter Presets",
    orders: "Matching Regulatory Orders",
    entities: "Matching Entities & Noticees",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-brivo-navy/25 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: "spring", stiffness: 440, damping: 32 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_24px_50px_rgba(9,13,22,0.18),0_4px_16px_rgba(9,13,22,0.06)] border border-brivo-navy/10 overflow-hidden flex flex-col max-h-[82vh] z-10"
            onKeyDown={handleKeyDownInList}
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-brivo-navy/10">
              <Search className="w-5 h-5 text-brivo-slate mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Type a command, search orders, entities, or jump to page..."
                className="w-full bg-transparent border-0 outline-none text-brivo-navy placeholder:text-brivo-slate/60 font-sans text-sm sm:text-base font-normal leading-normal"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-brivo-slate hover:text-brivo-navy transition-colors mr-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-black/[0.04] text-brivo-slate border border-black/[0.08] select-none">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-2 py-3 space-y-4 max-h-[58vh] divide-y divide-black/[0.04]"
            >
              {isSearching && (
                <div className="flex items-center justify-center py-8 text-xs font-mono text-brivo-slate gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-brivo-cyan border-t-transparent rounded-full animate-spin" />
                  <span>Searching regulatory orders & entities...</span>
                </div>
              )}

              {!isSearching && items.length === 0 && query.trim() !== "" && (
                <div className="text-center py-10 px-4 space-y-2">
                  <AlertCircle className="w-8 h-8 text-brivo-slate/60 mx-auto" />
                  <p className="text-sm font-medium text-brivo-navy">
                    No matching records or entities found
                  </p>
                  <p className="text-xs text-brivo-slate max-w-sm mx-auto">
                    Try refining your keyword or launch a full indexed search across all SEBI dossiers in the Records Explorer.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/explorer?q=${encodeURIComponent(query)}`);
                        setIsOpen(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-brivo-navy text-white text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Explore all matching files</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {!isSearching &&
                Array.from(new Set(items.map((i) => i.category))).map((category) => {
                  const categoryItems = items.filter((i) => i.category === category);
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category} className="pt-2 first:pt-0 space-y-1">
                      <div className="px-2.5 pb-1.5 text-[0.625rem] font-mono uppercase tracking-wider text-brivo-slate font-semibold select-none">
                        {categoryLabels[category] || category}
                      </div>

                      <div className="space-y-0.5">
                        {categoryItems.map((item) => {
                          const itemIndex = items.findIndex((i) => i.id === item.id);
                          const isActive = itemIndex === activeIndex;
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.id}
                              data-index={itemIndex}
                              type="button"
                              onClick={item.onSelect}
                              onMouseEnter={() => setActiveIndex(itemIndex)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-100 cursor-pointer group outline-none select-none ${
                                isActive
                                  ? "bg-brivo-mist/80 text-brivo-navy"
                                  : "text-brivo-slate hover:bg-black/[0.025]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isActive
                                      ? "bg-brivo-navy text-white"
                                      : "bg-black/[0.04] text-brivo-slate group-hover:text-brivo-navy"
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={`text-xs sm:text-[0.8125rem] font-medium truncate ${
                                      isActive
                                        ? "text-brivo-navy font-semibold"
                                        : "text-brivo-navy/90"
                                    }`}
                                  >
                                    {item.title}
                                  </div>
                                  {item.subtitle && (
                                    <div className="text-[0.6875rem] text-brivo-slate/75 truncate font-sans">
                                      {item.subtitle}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.badge && (
                                  <span
                                    className={`font-mono text-[0.625rem] px-2 py-0.5 rounded uppercase tracking-tight ${
                                      isActive
                                        ? "bg-brivo-navy/10 text-brivo-navy font-semibold"
                                        : "bg-black/[0.04] text-brivo-slate"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {isActive && (
                                  <CornerDownLeft className="w-3.5 h-3.5 text-brivo-cyan shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer Toolbar */}
            <div className="px-4 py-2.5 bg-black/[0.02] border-t border-brivo-navy/10 flex items-center justify-between text-[0.6875rem] font-mono text-brivo-slate select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] text-[0.625rem]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] text-[0.625rem]">↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] text-[0.625rem]">↵</kbd>
                  <span>select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-black/[0.05] text-[0.625rem]">esc</kbd>
                  <span>dismiss</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
