"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/common/CustomSelect";
import { HighlightedText } from "@/components/common/HighlightedText";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { Skeleton } from "@/components/common/Skeleton";
import { getEntities, getEntitySummary, getCached } from "@/lib/api";
import { EntitySimple, EntitySummaryResponse, EnvelopeResponse, PaginationMeta } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const SORT_OPTIONS: SelectOption[] = [
  { value: "total_penalty_amount_desc", label: "Highest Aggregate Penalty" },
  { value: "record_count_desc", label: "Most Enforced Orders" },
  { value: "name_asc", label: "Entity Name (A → Z)" },
  { value: "name_desc", label: "Entity Name (Z → A)" },
];

function EntitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query params
  const qParam = searchParams.get("q") || "";
  const typeParam = searchParams.get("entity_type") || "";
  const sortByParam = searchParams.get("sort_by") || "total_penalty_amount";
  const sortOrderParam = searchParams.get("sort_order") || "desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const pageSizeParam = parseInt(searchParams.get("page_size") || "24", 10);

  // Local state
  const [searchInput, setSearchInput] = useState(qParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [sortCombined, setSortCombined] = useState(`${sortByParam}_${sortOrderParam}`);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [hasUserToggledView, setHasUserToggledView] = useState(false);

  // Summary state for authoritative global KPIs
  const [summary, setSummary] = useState<EntitySummaryResponse | null>(null);

  const isFiltered = Boolean(qParam || typeParam || sortByParam !== "total_penalty_amount" || sortOrderParam !== "desc" || pageParam !== 1 || pageSizeParam !== 24);

  // Cache hydration: only use default fallback if no active filters
  const cacheKey = `/api/entities?page=${pageParam}&page_size=${pageSizeParam}&sort_by=${sortByParam}&sort_order=${sortOrderParam}${qParam ? `&q=${encodeURIComponent(qParam)}` : ""}${typeParam ? `&entity_type=${typeParam}` : ""}`;
  const defaultCacheKey = "/api/entities?page=1&page_size=24&sort_by=total_penalty_amount&sort_order=desc";
  const cachedData = getCached<EnvelopeResponse<EntitySimple[]>>(cacheKey) || (!isFiltered ? getCached<EnvelopeResponse<EntitySimple[]>>(defaultCacheKey) : null);

  const [entities, setEntities] = useState<EntitySimple[]>(() => cachedData?.data || []);
  const [meta, setMeta] = useState<PaginationMeta>(() => cachedData?.meta || {
    total: cachedData?.data?.length || 0,
    page: pageParam,
    page_size: pageSizeParam,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(() => !cachedData?.data?.length);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedRef = useRef(Boolean(cachedData?.data?.length));

  useEffect(() => {
    document.title = "Entity Directory & Intelligence";
  }, []);

  // Fetch summary once
  useEffect(() => {
    getEntitySummary()
      .then((data) => {
        if (data && typeof data.total_entities === "number") {
          setSummary(data);
        }
      })
      .catch((err) => console.debug("Failed to load entity summary:", err));
  }, []);

  // Sync state with URL params
  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      setIsFetching(true);
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== null) {
          params.set(k, String(v));
        } else {
          params.delete(k);
        }
      });
      router.push(`/entities?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== qParam.trim()) {
        updateUrl({ q: searchInput.trim() || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, qParam, updateUrl]);

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    setSelectedType(typeParam);
  }, [typeParam]);

  useEffect(() => {
    setSortCombined(`${sortByParam}_${sortOrderParam}`);
  }, [sortByParam, sortOrderParam]);

  // Fetch entities list
  const loadEntities = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await getEntities({
        q: qParam || undefined,
        entity_type: typeParam || undefined,
        sort_by: sortByParam,
        sort_order: sortOrderParam,
        page: pageParam,
        page_size: pageSizeParam,
      });
      setEntities(res.data);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error("Failed to load entities:", err);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setIsFetching(false);
    }
  }, [qParam, typeParam, sortByParam, sortOrderParam, pageParam, pageSizeParam]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const handleSortChange = (val: string) => {
    setSortCombined(val);
    let by = "total_penalty_amount";
    let order = "desc";
    if (val === "record_count_desc") {
      by = "record_count";
      order = "desc";
    } else if (val === "name_asc") {
      by = "name";
      order = "asc";
    } else if (val === "name_desc") {
      by = "name";
      order = "desc";
    }
    updateUrl({ sort_by: by, sort_order: order, page: 1 });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    updateUrl({ entity_type: type || undefined, page: 1 });
  };

  const handleResetFilters = () => {
    setIsFetching(true);
    setSearchInput("");
    setSelectedType("");
    setSortCombined("total_penalty_amount_desc");
    router.push("/entities");
  };


  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-12 sm:pb-20 space-y-6 sm:space-y-8">
      {/* Top Header - Brivo Editorial Hierarchy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Entity Intelligence & <span className="font-serif italic font-normal">Directory</span>
          </h1>

          <p className="text-xs text-brivo-slate max-w-2xl leading-relaxed">
            Index of corporate respondents, registered market intermediaries, and individual noticees identified across official SEBI adjudication and settlement proceedings.
          </p>
        </div>

        {/* View Switcher & Result Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-xs font-mono text-brivo-slate whitespace-nowrap flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-brivo-navy">
                {loading ? "..." : <RollingNumber value={meta.total} />}
              </strong>{" "}
              entities
            </span>
            {isFetching && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-brivo-navy/15 text-[0.65rem] font-mono text-brivo-navy shadow-2xs">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-brivo-navy" />
                <span className="hidden sm:inline">Updating</span>
              </span>
            )}
          </span>

          <div className="flex items-center border border-brivo-navy/15 rounded-lg bg-white p-0.5 shadow-2xs relative">
            <button
              onClick={() => {
                setHasUserToggledView(true);
                setViewMode("cards");
              }}
              className={`relative px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "cards" ? "text-brivo-paper font-medium" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Card Grid View"
            >
              {viewMode === "cards" && (
                hasUserToggledView ? (
                  <motion.div
                    layoutId="activeEntityViewPill"
                    className="absolute inset-0 bg-brivo-navy rounded-md shadow-2xs"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-brivo-navy rounded-md shadow-2xs" />
                )
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 text-[0.7rem]">Cards</span>
            </button>
            <button
              onClick={() => {
                setHasUserToggledView(true);
                setViewMode("table");
              }}
              className={`relative px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table" ? "text-brivo-paper font-medium" : "text-brivo-slate hover:text-brivo-navy"
              }`}
              title="Table View"
            >
              {viewMode === "table" && (
                hasUserToggledView ? (
                  <motion.div
                    layoutId="activeEntityViewPill"
                    className="absolute inset-0 bg-brivo-navy rounded-md shadow-2xs"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-brivo-navy rounded-md shadow-2xs" />
                )
              )}
              <ListIcon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 text-[0.7rem]">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Strip - Search, Entity Filter Pills, Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-white border border-brivo-navy/10 shadow-2xs">
        {/* Left: Search Input */}
        <div className="relative w-full sm:w-60 lg:w-64 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brivo-slate pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by entity or noticee name..."
            className="w-full pl-10 pr-8 py-2 rounded-lg bg-brivo-paper border border-brivo-navy/15 focus:border-brivo-navy focus:ring-2 focus:ring-brivo-cyan/20 text-xs sm:text-sm text-brivo-navy placeholder:text-brivo-slate/60 transition-all font-sans outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateUrl({ q: undefined, page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-brivo-slate hover:text-brivo-navy transition-colors text-xs font-bold"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Center: Entity Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5 shrink-0">
          {[
            { id: "", label: "All Entities", count: summary?.total_entities },
            { id: "company", label: "Companies", count: summary?.total_companies },
            { id: "individual", label: "Individuals", count: summary?.total_individuals },
            { id: "intermediary", label: "Intermediaries", count: summary?.total_intermediaries },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTypeChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-brivo-navy text-brivo-paper font-medium shadow-2xs"
                    : "bg-brivo-paper hover:bg-brivo-mist text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-brivo-navy/5 text-brivo-slate"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Sort */}
        <div className="flex items-center justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-brivo-navy/10 shrink-0">
          <div className="w-full sm:w-48 lg:w-52">
            <CustomSelect
              value={sortCombined}
              onChange={handleSortChange}
              options={SORT_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Refined Archival Hairline Progress Bar */}
      <div className="h-[3px] w-full -my-1 relative overflow-hidden rounded-full">
        <AnimatePresence>
          {isFetching && (
            <motion.div
              key="entities-progress-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full bg-brivo-navy/10 relative overflow-hidden rounded-full"
            >
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-brivo-navy/40 via-brivo-navy to-brivo-navy/40 rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "320%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Results View */}
      {(loading || (isFetching && entities.length === 0)) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-brivo-navy/10 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <div className="pt-3 border-t border-brivo-navy/10 flex justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-brivo-navy/10 text-center space-y-3 shadow-2xs">
          <div className="text-brivo-slate font-mono text-xs">
            No entities match your search or filter criteria.
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-brivo-navy hover:bg-brivo-navy/90 text-xs font-mono text-brivo-paper transition-colors shadow-2xs cursor-pointer"
          >
            Clear filters & view all entities
          </button>
        </div>
      ) : (
        <div className={`relative w-full min-h-[500px] transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "cards" ? (
              /* Editorial Cards Grid */
              <motion.div
                key="cards-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {entities.map((ent, idx) => {
                  const rank = (pageParam - 1) * pageSizeParam + idx + 1;
                  const formattedRank = String(rank).padStart(2, "0");
                  const isIndividual = ent.entity_type === "individual";
                  const isIntermediary = ent.entity_type === "intermediary";

                  return (
                    <div
                      key={ent.id}
                      className="p-5 rounded-xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all space-y-3.5 shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top Meta Strip: Monospace Index + Type Badge + Sanction Amount */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Understated Monospace Index (Non-AI podium) */}
                            <span className="font-mono text-xs text-brivo-slate/80 font-semibold tracking-wider">
                              {formattedRank}
                            </span>

                            {/* Classification Badge */}
                            <span
                              className={`font-mono text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider font-medium border ${
                                isIntermediary
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isIndividual
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : "bg-brivo-mist text-brivo-navy border-brivo-navy/15"
                              }`}
                            >
                              {ent.entity_type}
                            </span>
                          </div>

                          {/* Sanction Amount */}
                          <div className="text-right">
                            <span className="text-sm font-bold font-sans tracking-tight text-brivo-navy">
                              {ent.total_penalty_amount > 0 ? formatINR(ent.total_penalty_amount) : "Non-Monetary"}
                            </span>
                          </div>
                        </div>

                        {/* Entity Name & Canonical Identifier */}
                        <div className="space-y-1">
                          <Link
                            href={`/entities/${ent.id}`}
                            className="text-base font-medium text-brivo-navy hover:text-brivo-cyan transition-colors leading-snug flex items-start gap-2 group-hover:text-brivo-cyan min-h-[2.75rem]"
                          >
                            {isIndividual ? (
                              <User className="w-4 h-4 text-brivo-slate shrink-0 mt-0.5" />
                            ) : (
                              <Building2 className="w-4 h-4 text-brivo-slate shrink-0 mt-0.5" />
                            )}
                            <span className="break-words line-clamp-2">
                              <HighlightedText text={ent.name} highlight={qParam} />
                            </span>
                          </Link>

                          <div className="text-[0.68rem] font-mono text-brivo-slate truncate">
                            Canonical: {ent.normalized_name}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-brivo-navy/10 flex items-center justify-between gap-2">
                        <Link
                          href={`/explorer?entity=${encodeURIComponent(ent.name)}`}
                          className="text-xs font-mono text-brivo-slate hover:text-brivo-navy hover:underline transition-colors flex items-center gap-1.5"
                          title={`View ${ent.record_count} enforcement orders in Explorer`}
                        >
                          <FileText className="w-3.5 h-3.5 text-brivo-slate" />
                          <span>{ent.record_count} {ent.record_count === 1 ? "Order" : "Orders"}</span>
                        </Link>

                        <Link
                          href={`/entities/${ent.id}`}
                          className="text-xs font-mono text-brivo-navy hover:text-brivo-cyan inline-flex items-center gap-1 group/link transition-colors"
                        >
                          <span>Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              /* High-Density Editorial Table View */
              <motion.div
                key="table-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="w-full space-y-3"
              >
                {/* Mobile-Native High-Density List (Shown on screens < md) */}
                <div className="block md:hidden space-y-2.5">
                  {entities.map((ent, idx) => {
                    const rank = (pageParam - 1) * pageSizeParam + idx + 1;
                    const formattedRank = String(rank).padStart(2, "0");
                    const isIndividual = ent.entity_type === "individual";
                    const isIntermediary = ent.entity_type === "intermediary";

                    return (
                      <Link
                        key={ent.id}
                        href={`/entities/${ent.id}`}
                        className="p-3.5 rounded-xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all space-y-2 shadow-2xs block active:scale-[0.99] group"
                      >
                        {/* Top: Rank + Classification + Penalty */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-brivo-slate font-semibold">
                              {formattedRank}
                            </span>
                            <span
                              className={`font-mono text-[0.62rem] px-2 py-0.5 rounded uppercase font-medium border ${
                                isIntermediary
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isIndividual
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : "bg-brivo-mist text-brivo-navy border-brivo-navy/15"
                              }`}
                            >
                              {ent.entity_type}
                            </span>
                          </div>
                          <span className="font-sans font-bold text-xs text-brivo-navy tracking-tight">
                            {ent.total_penalty_amount > 0 ? formatINR(ent.total_penalty_amount) : "Non-Monetary"}
                          </span>
                        </div>

                        {/* Name & Canonical */}
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-brivo-navy flex items-center gap-1.5 leading-snug group-hover:text-brivo-cyan transition-colors">
                            {isIndividual ? (
                              <User className="w-3.5 h-3.5 text-brivo-slate shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-brivo-slate shrink-0" />
                            )}
                            <span className="truncate">
                              <HighlightedText text={ent.name} highlight={qParam} />
                            </span>
                          </div>
                          <div className="text-[0.68rem] font-mono text-brivo-slate truncate">
                            Canonical: {ent.normalized_name}
                          </div>
                        </div>

                        {/* Bottom: Orders & Dossier link */}
                        <div className="pt-2 border-t border-brivo-navy/5 flex items-center justify-between text-xs font-mono text-brivo-slate">
                          <span className="flex items-center gap-1 text-[0.7rem]">
                            <FileText className="w-3 h-3 text-brivo-slate/70" />
                            <span>{ent.record_count} {ent.record_count === 1 ? "Order" : "Orders"}</span>
                          </span>
                          <span className="text-brivo-navy font-medium text-[0.7rem] flex items-center gap-1">
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3 text-brivo-cyan group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop Full 6-Column Table (Preserved on md: and above) */}
                <div className="hidden md:block w-full border border-brivo-navy/10 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full table-fixed text-left text-xs min-w-[700px]">
                      <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.65rem] tracking-wider border-b border-brivo-navy/10">
                        <tr>
                          <th className="px-5 py-3.5 w-16 text-center whitespace-nowrap">#</th>
                          <th className="px-5 py-3.5 w-auto min-w-[200px]">Entity / Noticee</th>
                          <th className="px-5 py-3.5 w-36 whitespace-nowrap">Classification</th>
                          <th className="px-5 py-3.5 w-36 text-center whitespace-nowrap">Enforced Orders</th>
                          <th className="px-5 py-3.5 w-44 text-right whitespace-nowrap">Aggregate Sanctions</th>
                          <th className="px-5 py-3.5 w-24 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brivo-navy/5">
                        {entities.map((ent, idx) => {
                          const rank = (pageParam - 1) * pageSizeParam + idx + 1;
                          const formattedRank = String(rank).padStart(2, "0");
                          const isIndividual = ent.entity_type === "individual";
                          const isIntermediary = ent.entity_type === "intermediary";

                          return (
                            <tr
                              key={ent.id}
                              className="hover:bg-brivo-paper/60 transition-colors group"
                            >
                              <td className="px-5 py-3.5 text-center font-mono text-xs text-brivo-slate font-semibold whitespace-nowrap">
                                {formattedRank}
                              </td>
                              <td className="px-5 py-3.5 text-brivo-navy font-sans font-medium min-w-0">
                                <Link
                                  href={`/entities/${ent.id}`}
                                  className="hover:text-brivo-cyan transition-colors truncate block text-sm font-semibold"
                                >
                                  <HighlightedText text={ent.name} highlight={qParam} />
                                </Link>
                                <span className="text-[0.68rem] font-mono text-brivo-slate block truncate">
                                  Canonical: {ent.normalized_name}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span
                                  className={`font-mono text-[0.65rem] px-2 py-0.5 rounded uppercase border font-medium ${
                                    isIntermediary
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : isIndividual
                                      ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                      : "bg-brivo-mist text-brivo-navy border-brivo-navy/15"
                                  }`}
                                >
                                  {ent.entity_type}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                <Link
                                  href={`/explorer?entity=${encodeURIComponent(ent.name)}`}
                                  className="text-brivo-navy hover:text-brivo-cyan hover:underline font-mono font-medium"
                                  title={`View ${ent.record_count} enforcement orders`}
                                >
                                  {ent.record_count}
                                </Link>
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-brivo-navy font-sans tracking-tight text-sm whitespace-nowrap">
                                {ent.total_penalty_amount > 0 ? (
                                  formatINR(ent.total_penalty_amount)
                                ) : (
                                  <span className="text-brivo-slate font-normal text-xs">Non-Monetary</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                <Link
                                  href={`/entities/${ent.id}`}
                                  className="text-xs text-brivo-navy hover:text-brivo-cyan font-mono hover:underline inline-flex items-center gap-1"
                                >
                                  <span>Dossier</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination Controls - Consistent layout across all filters */}
          {meta.total > 0 && (
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brivo-navy/10">
              <span className="text-xs font-mono text-brivo-slate">
                Page <strong className="text-brivo-navy">{meta.page}</strong> of{" "}
                <strong className="text-brivo-navy">{meta.total_pages}</strong> ({meta.total} {meta.total === 1 ? "entity" : "total entities"})
              </span>

              {meta.total_pages > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateUrl({ page: Math.max(1, pageParam - 1) })}
                    disabled={pageParam <= 1}
                    className="px-3 py-1.5 rounded-lg border border-brivo-navy/15 bg-white text-xs font-mono text-brivo-navy hover:bg-brivo-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => updateUrl({ page: Math.min(meta.total_pages, pageParam + 1) })}
                    disabled={pageParam >= meta.total_pages}
                    className="px-3 py-1.5 rounded-lg border border-brivo-navy/15 bg-white text-xs font-mono text-brivo-navy hover:bg-brivo-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[0.7rem] font-mono text-brivo-slate/60">
                  All {meta.total} records displayed
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EntitiesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>}>
      <EntitiesContent />
    </Suspense>
  );
}
