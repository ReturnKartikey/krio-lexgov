"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  Scale,
  Sparkles,
  Eye,
  X,
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { HighlightedText } from "@/components/common/HighlightedText";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";
import { QuickLookModal } from "@/components/motion/QuickLookModal";
import { getRecords } from "@/lib/api";
import { RecordListItem, PaginationMeta } from "@/lib/types";
import { formatINR, formatDate, truncateText } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/RollingNumber";

const STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Telangana",
  "Gujarat",
  "West Bengal",
  "Tamil Nadu",
];

function ExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const qParam = searchParams.get("q") || "";
  const stateParam = searchParams.get("state") || "";
  const entityParam = searchParams.get("entity") || "";
  const dateFromParam = searchParams.get("date_from") || "";
  const dateToParam = searchParams.get("date_to") || "";
  const sortByParam = searchParams.get("sort_by") || "published_date";
  const sortOrderParam = searchParams.get("sort_order") || "desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local state
  const [searchInput, setSearchInput] = useState(qParam);
  const [selectedState, setSelectedState] = useState(stateParam);
  const [selectedEntity, setSelectedEntity] = useState(entityParam);
  const [dateFrom, setDateFrom] = useState(dateFromParam);
  const [dateTo, setDateTo] = useState(dateToParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [sortOrder, setSortOrder] = useState(sortOrderParam);
  const [page, setPage] = useState(pageParam);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [quickLookRecord, setQuickLookRecord] = useState<RecordListItem | null>(null);
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);

  useEffect(() => {
    document.title = "Explorer | KRIO.LEXGOV";
  }, []);

  // Sync state with URL params
  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== null) {
          params.set(k, String(v));
        } else {
          params.delete(k);
        }
      });
      router.push(`/explorer?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch records
  const loadData = useCallback(async () => {
    if (records.length === 0) {
      setInitialLoading(true);
    } else {
      setIsFetching(true);
    }
    try {
      const res = await getRecords({
        q: qParam,
        state: stateParam,
        entity: entityParam,
        date_from: dateFromParam,
        date_to: dateToParam,
        sort_by: sortByParam,
        sort_order: sortOrderParam,
        page: pageParam,
        page_size: 10,
      });
      setRecords(res.data);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  }, [qParam, stateParam, entityParam, dateFromParam, dateToParam, sortByParam, sortOrderParam, pageParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedState("");
    setSelectedEntity("");
    setDateFrom("");
    setDateTo("");
    setSortBy("published_date");
    setSortOrder("desc");
    router.push("/explorer");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°02" label="SEBI REGULATORY DATABASE" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Adjudication & Enforcement <span className="font-serif italic font-normal">Order Archive</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Search normalized public regulatory orders with full-text vector indexing, extracted noticees, and penalty amounts.
          </p>
        </div>

        {/* View Switcher & Result Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brivo-slate">
            Showing <strong className="text-brivo-navy"><RollingNumber value={meta.total} /></strong> results
          </span>

          <div className="flex items-center border border-brivo-navy/15 rounded-lg bg-white p-0.5 shadow-sm relative">
            <button
              onClick={() => setViewMode("cards")}
              className={`relative px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "cards" ? "text-brivo-paper font-medium" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Card View"
            >
              {viewMode === "cards" && (
                <motion.div
                  layoutId="activeViewPill"
                  className="absolute inset-0 bg-brivo-navy rounded-md shadow-xs"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 text-[0.7rem]">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`relative px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table" ? "text-brivo-paper font-medium" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Table View"
            >
              {viewMode === "table" && (
                <motion.div
                  layoutId="activeViewPill"
                  className="absolute inset-0 bg-brivo-navy rounded-md shadow-xs"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <ListIcon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 text-[0.7rem]">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar & Quick Toggles */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brivo-slate" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by respondent, company name, regulation (e.g. PFUTP, Insider Trading), or order number..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-brivo-navy/15 focus:border-brivo-navy focus:ring-2 focus:ring-brivo-cyan/20 text-sm text-brivo-navy placeholder:text-brivo-slate/60 transition-all font-sans outline-none shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateUrl({ q: undefined, page: 1 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-brivo-slate hover:text-brivo-navy hover:bg-brivo-navy/10 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper font-medium text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Search</span>
            </button>

            {/* AI Precedent Synthesis Button */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-mono text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:border-brivo-cyan active:scale-95"
              title="Synthesize risk for current query"
            >
              <Sparkles className="w-3.5 h-3.5 text-brivo-cyan" />
              <span>AI Risk Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${
                showFilters || selectedState || selectedEntity || dateFrom || dateTo
                  ? "bg-brivo-navy text-brivo-paper border-brivo-navy"
                  : "bg-white border-brivo-navy/15 text-brivo-navy hover:bg-brivo-paper"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </form>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-5 rounded-xl bg-white border border-brivo-navy/10 space-y-4 animate-fade-in shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* State */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-mono text-brivo-slate uppercase tracking-wider">
                  State / Jurisdiction
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    updateUrl({ state: e.target.value, page: 1 });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
                >
                  <option value="">All States</option>
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-mono text-brivo-slate uppercase tracking-wider">
                  Published After
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    updateUrl({ date_from: e.target.value, page: 1 });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy font-mono"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-mono text-brivo-slate uppercase tracking-wider">
                  Published Before
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    updateUrl({ date_to: e.target.value, page: 1 });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy font-mono"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-mono text-brivo-slate uppercase tracking-wider">
                  Sort Order
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      updateUrl({ sort_by: e.target.value, page: 1 });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
                  >
                    <option value="published_date">Date</option>
                    <option value="amount">Penalty Amount</option>
                    <option value="title">Title</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      updateUrl({ sort_order: e.target.value, page: 1 });
                    }}
                    className="w-20 px-2 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy font-mono"
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {(selectedState || selectedEntity || dateFrom || dateTo || qParam) && (
              <div className="pt-3 border-t border-brivo-navy/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">
                    Active Filters:
                  </span>
                  {qParam && (
                    <span className="px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-xs font-mono text-brivo-navy flex items-center gap-1">
                      Query: &ldquo;{qParam}&rdquo;
                      <button
                        onClick={() => updateUrl({ q: undefined, page: 1 })}
                        className="hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedState && (
                    <span className="px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-xs font-mono text-brivo-navy flex items-center gap-1">
                      State: {selectedState}
                      <button
                        onClick={() => updateUrl({ state: undefined, page: 1 })}
                        className="hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedEntity && (
                    <span className="px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-xs font-mono text-brivo-navy flex items-center gap-1">
                      Entity: {selectedEntity}
                      <button
                        onClick={() => updateUrl({ entity: undefined, page: 1 })}
                        className="hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleResetFilters}
                  className="text-xs font-mono text-brivo-slate hover:text-brivo-navy flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section with smooth non-collapsing state */}
      {initialLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-brivo-slate">
          <div className="w-8 h-8 rounded-full border-2 border-brivo-navy/10 border-t-brivo-navy animate-spin" />
          <span>Searching normalized regulatory index...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-brivo-navy/10 text-center space-y-3 shadow-sm">
          <div className="text-brivo-slate font-mono text-sm">
            No enforcement orders match your current filters.
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-xs font-mono text-brivo-paper transition-colors shadow-sm"
          >
            Clear filters & view all
          </button>
        </div>
      ) : (
        <div className={`relative transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          {isFetching && (
            <div className="absolute -top-3 left-0 right-0 h-1 bg-brivo-cyan/20 overflow-hidden rounded-full z-20">
              <div className="h-full bg-brivo-cyan animate-pulse w-full" />
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "cards" ? (
              /* Card Grid View */
              <motion.div
                key="cards-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-6 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-semibold">
                          {record.external_id}
                        </span>
                        {record.state && (
                          <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-mist border border-brivo-cyan/30 text-brivo-navy flex items-center gap-1 font-medium">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{record.state}</span>
                          </span>
                        )}
                        <span className="text-xs text-brivo-slate font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(record.published_date)}</span>
                        </span>
                      </div>

                      {record.amount ? (
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-semibold font-mono text-brivo-navy">
                            {formatINR(record.amount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-brivo-slate">Non-Monetary Sanction</span>
                      )}
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-1.5">
                      <Link
                        href={`/explorer/${record.id}`}
                        className="text-base font-medium text-brivo-navy hover:text-brivo-cyan transition-colors leading-snug block"
                      >
                        <HighlightedText text={record.title} highlight={qParam} />
                      </Link>
                      <p className="text-xs text-brivo-slate leading-relaxed line-clamp-2">
                        <HighlightedText text={record.summary} highlight={qParam} />
                      </p>
                    </div>

                    {/* Entities & Footer Actions */}
                    <div className="pt-3 border-t border-brivo-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[0.65rem] font-mono text-brivo-slate">Extracted Noticees:</span>
                        {record.entity_names?.slice(0, 3).map((ent, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateUrl({ entity: ent, page: 1 })}
                            className="px-2 py-0.5 rounded bg-brivo-paper hover:bg-brivo-mist border border-brivo-navy/10 text-[0.65rem] text-brivo-navy transition-colors font-mono cursor-pointer"
                          >
                            {truncateText(ent, 25)}
                          </button>
                        ))}
                        {record.entity_names && record.entity_names.length > 3 && (
                          <span className="text-[0.65rem] font-mono text-brivo-slate">
                            +{record.entity_names.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickLookRecord(record);
                            setIsQuickLookOpen(true);
                          }}
                          className="px-3 py-1 rounded-full bg-brivo-paper hover:bg-brivo-mist text-brivo-slate hover:text-brivo-navy text-xs font-mono border border-brivo-navy/10 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Quick Look preview (Space)"
                        >
                          <span>⎵ Peek</span>
                        </button>

                        <Link
                          href={`/explorer/${record.id}`}
                          className="px-3.5 py-1 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-mono font-medium flex items-center gap-1 transition-all shadow-sm active:scale-95"
                        >
                          <span>Audit Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5 text-brivo-cyan" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              /* Table View */
              <motion.div
                key="table-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="border border-brivo-navy/10 rounded-2xl overflow-x-auto bg-white shadow-sm"
              >
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.65rem] tracking-wider border-b border-brivo-navy/10">
                    <tr>
                      <th className="px-5 py-3.5">Order ID</th>
                      <th className="px-5 py-3.5">Published Date</th>
                      <th className="px-5 py-3.5">Subject / Title</th>
                      <th className="px-5 py-3.5">Jurisdiction</th>
                      <th className="px-5 py-3.5 text-right">Penalty</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brivo-navy/5">
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => {
                          setQuickLookRecord(r);
                          setIsQuickLookOpen(true);
                        }}
                        className="hover:bg-brivo-paper/60 transition-all cursor-pointer group"
                      >
                        <td className="px-5 py-3.5 font-mono text-brivo-navy font-medium whitespace-nowrap">
                          {r.external_id}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-brivo-slate whitespace-nowrap">
                          {formatDate(r.published_date)}
                        </td>
                        <td className="px-5 py-3.5 text-brivo-navy max-w-md">
                          <span className="group-hover:text-brivo-cyan transition-colors font-medium line-clamp-1">
                            {r.title}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-brivo-slate whitespace-nowrap">
                          {r.state || "Maharashtra"}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-right text-brivo-navy font-semibold whitespace-nowrap">
                          {r.amount ? formatINR(r.amount) : "Non-Monetary"}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickLookRecord(r);
                                setIsQuickLookOpen(true);
                              }}
                              className="px-2 py-0.5 rounded bg-brivo-paper hover:bg-brivo-mist text-[0.65rem] font-mono text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10 transition-colors cursor-pointer"
                            >
                              ⎵ Peek
                            </button>
                            <Link
                              href={`/explorer/${r.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-brivo-slate hover:text-brivo-navy font-mono text-[0.7rem] hover:underline"
                            >
                              Audit →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Bar */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-brivo-navy/10">
          <span className="text-xs font-mono text-brivo-slate">
            Page {meta.page} of {meta.total_pages} ({meta.total} records)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1 || isFetching}
              onClick={() => handlePageChange(meta.page - 1)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-brivo-paper disabled:opacity-40 border border-brivo-navy/15 text-xs text-brivo-navy font-mono flex items-center gap-1 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              disabled={meta.page >= meta.total_pages || isFetching}
              onClick={() => handlePageChange(meta.page + 1)}
              className="px-3.5 py-1.5 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 disabled:opacity-40 text-xs text-brivo-paper font-mono flex items-center gap-1 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* AI Synthesis Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialQuery={searchInput || qParam}
      />

      {/* Quick Look Modal */}
      <QuickLookModal
        record={quickLookRecord}
        isOpen={isQuickLookOpen}
        onClose={() => setIsQuickLookOpen(false)}
      />
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-mono text-brivo-slate">
          Loading regulatory explorer...
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}
