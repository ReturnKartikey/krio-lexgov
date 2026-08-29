"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { HighlightedText } from "@/components/common/HighlightedText";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";
import { getRecords } from "@/lib/api";
import { RecordListItem, PaginationMeta } from "@/lib/types";
import { formatINR, formatDate, truncateText } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
      router.push(`/explorer?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Fetch records
  const loadData = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
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
            Showing <strong className="text-brivo-navy">{meta.total}</strong> results
          </span>

          <div className="flex items-center border border-brivo-navy/15 rounded-md bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === "cards" ? "bg-brivo-navy text-brivo-paper" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === "table" ? "bg-brivo-navy text-brivo-paper" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar & Quick Toggles */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap sm:flex-nowrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brivo-slate" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by respondent, company name, regulation (e.g. PFUTP, Insider Trading), or order number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-brivo-navy/15 focus:border-brivo-navy focus:ring-1 focus:ring-brivo-navy text-sm text-brivo-navy placeholder:text-brivo-slate/60 transition-all font-sans outline-none shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper font-medium text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Search</span>
          </button>

          {/* AI Precedent Synthesis Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-mono text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-sm hover:border-brivo-cyan/50"
            title="Synthesize risk for current query"
          >
            <Sparkles className="w-3.5 h-3.5 text-brivo-cyan" />
            <span>AI Risk Brief</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${
              showFilters || selectedState || selectedEntity || dateFrom || dateTo
                ? "bg-brivo-navy text-brivo-paper border-brivo-navy"
                : "bg-white border-brivo-navy/15 text-brivo-navy hover:bg-brivo-paper"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </form>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-5 rounded-lg bg-white border border-brivo-navy/10 space-y-4 animate-fade-in shadow-sm">
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
                  className="w-full px-3 py-1.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
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
                  className="w-full px-3 py-1.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
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
                  className="w-full px-3 py-1.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-mono text-brivo-slate uppercase tracking-wider">
                  Sort Order
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split("-");
                    setSortBy(sb);
                    setSortOrder(so);
                    updateUrl({ sort_by: sb, sort_order: so, page: 1 });
                  }}
                  className="w-full px-3 py-1.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs text-brivo-navy outline-none focus:border-brivo-navy"
                >
                  <option value="published_date-desc">Newest Orders First</option>
                  <option value="published_date-asc">Oldest Orders First</option>
                  <option value="amount-desc">Highest Penalty (INR)</option>
                  <option value="amount-asc">Lowest Penalty (INR)</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-brivo-navy/10">
              <span className="text-[0.65rem] font-mono text-brivo-slate">
                Active filters update instantly
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs font-mono text-brivo-slate hover:text-brivo-navy flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Container */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-white border border-brivo-navy/10 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 border border-brivo-navy/10 rounded-lg bg-white space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brivo-paper border border-brivo-navy/15 flex items-center justify-center text-brivo-slate mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-brivo-navy">No matching regulatory orders found</h3>
            <p className="text-xs text-brivo-slate max-w-sm mx-auto">
              Try adjusting your search terms, clearing entity filters, or expanding the publication date window.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded bg-brivo-navy hover:bg-brivo-navy/90 text-xs font-mono text-brivo-paper transition-colors"
          >
            Clear filters & view all
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-5 sm:p-6 rounded-lg bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all space-y-3 shadow-sm"
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
                      className="px-2 py-0.5 rounded bg-brivo-paper hover:bg-brivo-mist border border-brivo-navy/10 text-[0.65rem] text-brivo-navy transition-colors font-mono"
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

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/explorer/${record.id}`}
                    className="text-xs font-medium text-brivo-navy hover:text-brivo-cyan flex items-center gap-1 transition-colors"
                  >
                    <span>View Full Case & Audit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-brivo-navy/10 rounded-lg overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.65rem] tracking-wider border-b border-brivo-navy/10">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Published Date</th>
                <th className="px-4 py-3">Subject / Title</th>
                <th className="px-4 py-3">Jurisdiction</th>
                <th className="px-4 py-3 text-right">Penalty</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brivo-navy/5">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-brivo-paper/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-brivo-navy font-medium">
                    {r.external_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-brivo-slate whitespace-nowrap">
                    {formatDate(r.published_date)}
                  </td>
                  <td className="px-4 py-3 text-brivo-navy max-w-md">
                    <Link
                      href={`/explorer/${r.id}`}
                      className="hover:text-brivo-cyan transition-colors font-medium line-clamp-1"
                    >
                      <HighlightedText text={r.title} highlight={qParam} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-brivo-slate whitespace-nowrap">
                    {r.state || "Head Office"}
                  </td>
                  <td className="px-4 py-3 font-mono text-right text-brivo-navy font-semibold whitespace-nowrap">
                    {formatINR(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/explorer/${r.id}`}
                      className="text-brivo-slate hover:text-brivo-navy font-mono text-[0.7rem] hover:underline"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-brivo-navy/10 pt-6">
          <span className="text-xs font-mono text-brivo-slate">
            Page {meta.page} of {meta.total_pages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => updateUrl({ page: meta.page - 1 })}
              className="px-3 py-1.5 rounded bg-white hover:bg-brivo-paper disabled:opacity-40 border border-brivo-navy/15 text-xs text-brivo-navy font-mono flex items-center gap-1 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              disabled={meta.page >= meta.total_pages}
              onClick={() => updateUrl({ page: meta.page + 1 })}
              className="px-3 py-1.5 rounded bg-white hover:bg-brivo-paper disabled:opacity-40 border border-brivo-navy/15 text-xs text-brivo-navy font-mono flex items-center gap-1 transition-colors shadow-sm"
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
