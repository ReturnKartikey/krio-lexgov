"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Sparkles,
  Activity,
  ShieldAlert,
  Scale,
  FileText,
  Building2,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Users,
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { AIPaneSkeleton } from "@/components/common/Skeleton";
import { toast } from "@/lib/toast";
import { synthesizeIntelligence } from "@/lib/api";
import { SynthesisResponse } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface IntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function IntelligenceModal({
  isOpen,
  onClose,
  initialQuery = "",
}: IntelligenceModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"risk_brief" | "precedent_analysis" | "entity_exposure">("risk_brief");
  const [initialLoading, setInitialLoading] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [data, setData] = useState<SynthesisResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Initial load or query change
  useEffect(() => {
    if (isOpen) {
      handleRunSynthesis(query, mode, true);
    }
  }, [isOpen]);

  // Global ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleRunSynthesis = async (
    qText?: string,
    mType?: typeof mode,
    isInitial: boolean = false
  ) => {
    if (isInitial || !data) {
      setInitialLoading(true);
    } else {
      setIsUpdatingMode(true);
    }

    try {
      const targetQuery = qText !== undefined ? qText : query;
      const targetMode = mType || mode;
      const res = await synthesizeIntelligence({
        query: targetQuery,
        mode: targetMode,
      });
      setData(res);
    } catch (err) {
      console.error("Synthesis failed:", err);
    } finally {
      setInitialLoading(false);
      setIsUpdatingMode(false);
    }
  };

  const handleModeSwitch = (newMode: typeof mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    handleRunSynthesis(query, newMode, false);
  };

  const handleCopyReport = () => {
    if (!data) return;
    const text = `KRIO // STATUTORY RISK SYNTHESIS
Query: ${query || "Full Registry Cohort"}
Mode: ${mode.toUpperCase()}
Risk Level: ${data.risk_level}
Sanction Exposure: ${formatINR(data.total_penalty_exposure)}
Orders: ${data.order_count} | Entities: ${data.entity_count}

EXECUTIVE SUMMARY:
${data.executive_summary}

APPLICABLE STATUTES:
${data.applicable_statutes.join("\n")}

COMPLIANCE TAKEAWAYS:
${data.compliance_takeaways.join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info("Briefing Copied", "Executive AI synthesis copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          {/* Backdrop with silky blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-brivo-void/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-4xl bg-white border border-brivo-navy/15 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] my-auto"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-brivo-navy/10 bg-brivo-paper flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                  <Image
                    src="/icon_logo.png"
                    alt="KRIO Icon"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain rounded-lg shrink-0"
                  />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-mono text-xs font-semibold text-brivo-navy tracking-tight truncate block">
                    KRIO // STATUTORY RISK SYNTHESIZER
                  </span>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-brivo-slate truncate">
                    Cross-matter precedent extraction & liability analysis across SEBI orders
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="hidden sm:inline-block font-mono text-[0.65rem] text-brivo-slate px-2 py-1 rounded bg-white border border-brivo-navy/10">
                  ESC to close
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-brivo-navy/10 text-brivo-slate hover:text-brivo-navy transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input & Mode Toolbar */}
            <div className="p-3.5 sm:p-6 border-b border-brivo-navy/10 bg-white space-y-3 sm:space-y-4 shrink-0">
              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunSynthesis(query, mode, true);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brivo-slate shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Focus query (e.g. 'Front-Running', 'Section 15HA')..."
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-brivo-paper border border-brivo-navy/15 focus:border-brivo-navy focus:ring-1 focus:ring-brivo-navy text-xs sm:text-sm text-brivo-navy placeholder:text-brivo-slate/60 outline-none transition-all font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={initialLoading}
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Activity className={`w-3.5 h-3.5 ${initialLoading ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
                  <span className="hidden xs:inline sm:inline">{initialLoading ? "Analyzing..." : "Synthesize"}</span>
                  <span className="inline xs:hidden sm:hidden">{initialLoading ? "..." : "Run"}</span>
                </button>
              </form>

              {/* Mode Switcher & Example Chips */}
              <div className="flex flex-col gap-2.5">
                {/* Responsive Mode Switcher: full-width segmented control on mobile, pills on desktop */}
                <div className="w-full overflow-x-auto no-scrollbar scrollbar-none pb-0.5">
                  <div className="inline-flex items-center p-1 rounded-full bg-brivo-paper border border-brivo-navy/10 min-w-full sm:min-w-0 justify-between sm:justify-start">
                    <button
                      onClick={() => handleModeSwitch("risk_brief")}
                      className="relative flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1 rounded-full text-[0.7rem] sm:text-xs font-mono font-medium transition-colors select-none whitespace-nowrap text-center cursor-pointer"
                    >
                      {mode === "risk_brief" && (
                        <motion.div
                          layoutId="aiModePill"
                          className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${mode === "risk_brief" ? "text-brivo-paper font-semibold" : "text-brivo-slate hover:text-brivo-navy"}`}>
                        <span className="sm:hidden">Risk Brief</span>
                        <span className="hidden sm:inline">Executive Risk Brief</span>
                      </span>
                    </button>

                    <button
                      onClick={() => handleModeSwitch("precedent_analysis")}
                      className="relative flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1 rounded-full text-[0.7rem] sm:text-xs font-mono font-medium transition-colors select-none whitespace-nowrap text-center cursor-pointer"
                    >
                      {mode === "precedent_analysis" && (
                        <motion.div
                          layoutId="aiModePill"
                          className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${mode === "precedent_analysis" ? "text-brivo-paper font-semibold" : "text-brivo-slate hover:text-brivo-navy"}`}>
                        <span className="sm:hidden">Precedents</span>
                        <span className="hidden sm:inline">Precedent Analysis</span>
                      </span>
                    </button>

                    <button
                      onClick={() => handleModeSwitch("entity_exposure")}
                      className="relative flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1 rounded-full text-[0.7rem] sm:text-xs font-mono font-medium transition-colors select-none whitespace-nowrap text-center cursor-pointer"
                    >
                      {mode === "entity_exposure" && (
                        <motion.div
                          layoutId="aiModePill"
                          className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${mode === "entity_exposure" ? "text-brivo-paper font-semibold" : "text-brivo-slate hover:text-brivo-navy"}`}>
                        <span className="sm:hidden">Noticees</span>
                        <span className="hidden sm:inline">Noticee Liability Matrix</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Example query chips (Clean wrap without horizontal scroll) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-mono text-brivo-slate pt-0.5">
                  <span className="text-brivo-slate/80 font-medium shrink-0">Try:</span>
                  {[
                    { label: "Front Running", q: "Front Running" },
                    { label: "Angel One", q: "Angel One" },
                    { label: "Unregistered Advisory", q: "Unregistered Advisory" },
                    { label: "Insider Trading", q: "Insider Trading" },
                    { label: "Settlement Orders", q: "Settlement Order" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setQuery(chip.q);
                        handleRunSynthesis(chip.q, mode, true);
                      }}
                      className="px-2 py-0.5 rounded-md bg-brivo-paper hover:bg-white border border-brivo-navy/12 text-brivo-navy hover:text-brivo-navy font-mono text-[0.65rem] transition-all hover:border-brivo-navy/30 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Content Area */}
            <div
              data-lenis-prevent="true"
              className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-editorial-grid"
              style={{ overscrollBehavior: "contain" }}
            >
              {initialLoading ? (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-brivo-slate border-b border-brivo-navy/10 pb-3">
                    <div className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse shrink-0" />
                    <span>Synthesizing statutory penalties, noticees, and Section 15HA precedents...</span>
                  </div>
                  <AIPaneSkeleton />
                </div>
              ) : data ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-4 sm:space-y-6"
                  >
                    {/* Top Headline & Risk Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-brivo-navy/10">
                      <div className="space-y-1">
                        <MicroLabel number="N°01" label="SYNTHESIS REPORT" />
                        <h2 className="text-base sm:text-xl lg:text-2xl font-light text-brivo-navy font-sans tracking-tight leading-snug">
                          {mode === "entity_exposure"
                            ? "Noticee & Promoter Cross-Matter Liability Synthesis"
                            : mode === "precedent_analysis"
                            ? "Precedent Authority & Key Statutory Violations"
                            : data.headline}
                        </h2>
                      </div>

                      <span
                        className={`px-2.5 sm:px-3 py-1 rounded-full font-mono text-[0.62rem] sm:text-[0.65rem] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 self-start sm:self-center shadow-sm shrink-0 ${
                          data.risk_level === "HIGH"
                            ? "bg-rose-50 border border-rose-200 text-rose-700"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{data.risk_level} INTENSITY</span>
                      </span>
                    </div>

                    {/* Quantitative Exposure KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div className="p-3 sm:p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-0.5 sm:space-y-1">
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-mono text-brivo-slate uppercase block truncate">
                          Sanction Exposure
                        </span>
                        <span className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-brivo-navy block truncate" title={formatINR(data.total_penalty_exposure)}>
                          {formatINR(data.total_penalty_exposure)}
                        </span>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-0.5 sm:space-y-1">
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-mono text-brivo-slate uppercase block truncate">
                          Orders Synthesized
                        </span>
                        <span className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-brivo-navy block truncate">
                          {data.order_count} Orders
                        </span>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-0.5 sm:space-y-1">
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-mono text-brivo-slate uppercase block truncate">
                          Tracked Noticees
                        </span>
                        <span className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-brivo-navy block truncate">
                          {data.entity_count} Entities
                        </span>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-0.5 sm:space-y-1">
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-mono text-brivo-slate uppercase block truncate">
                          Confidence Score
                        </span>
                        <span className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-emerald-600 block truncate">
                          {(data.confidence_score * 100).toFixed(0)}% Audit
                        </span>
                      </div>
                    </div>

                    {/* Mode Specific Views */}
                    {mode === "risk_brief" && (
                      <div className="space-y-3.5 sm:space-y-5">
                        {/* Executive Briefing Card */}
                        <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-2">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Executive Legal Brief</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-brivo-navy leading-relaxed font-sans">
                            {data.executive_summary}
                          </p>
                        </div>

                        {/* Applicable Statutes */}
                        <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Applicable Regulatory Provisions</span>
                          </h3>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {data.applicable_statutes.map((statute, idx) => (
                              <span
                                key={idx}
                                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-brivo-paper border border-brivo-navy/10 text-[0.7rem] sm:text-xs font-mono text-brivo-navy"
                              >
                                {statute}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Practical Compliance Takeaways */}
                        <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-brivo-cyan" />
                            <span>Key Evidentiary & Compliance Takeaways</span>
                          </h3>
                          <ul className="space-y-2 text-xs text-brivo-navy">
                            {data.compliance_takeaways.map((takeaway, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brivo-cyan mt-1.5 shrink-0" />
                                <span className="leading-relaxed">{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {mode === "precedent_analysis" && (
                      <div className="space-y-3.5 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Citing Precedent Matters ({data.precedents.length})</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                          {data.precedents.map((prec) => (
                            <div
                              key={prec.id}
                              className="p-3.5 sm:p-5 rounded-xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/25 transition-all shadow-sm space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-navy font-semibold">
                                    {prec.external_id}
                                  </span>
                                  <span className="text-[0.7rem] sm:text-xs font-mono text-brivo-slate">
                                    {formatDate(prec.published_date)}
                                  </span>
                                </div>
                                <span className="font-mono text-[0.72rem] sm:text-xs font-semibold text-brivo-navy">
                                  {prec.amount ? formatINR(prec.amount) : "Non-Monetary"}
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-semibold text-brivo-navy leading-snug">
                                {prec.title}
                              </h4>

                              <p className="text-xs text-brivo-slate leading-relaxed font-sans line-clamp-2">
                                {prec.key_finding}
                              </p>

                              <div className="pt-2 flex items-center justify-between border-t border-brivo-navy/5 text-xs">
                                <span className="text-[0.65rem] font-mono text-brivo-slate truncate max-w-[50%]">
                                  {prec.jurisdiction}
                                </span>
                                <Link
                                  href={`/explorer/${prec.id}`}
                                  onClick={onClose}
                                  className="text-xs font-mono text-brivo-navy hover:text-brivo-cyan flex items-center gap-1 transition-colors shrink-0 py-1"
                                >
                                  <span>View Holding</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mode === "entity_exposure" && (
                      <div className="space-y-3.5 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Identified Noticees & Legal Entities</span>
                          </h3>
                          <span className="text-[0.65rem] font-mono text-brivo-slate">
                            {data.entity_count} Unique Entities Tracked
                          </span>
                        </div>

                        <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
                          <p className="text-xs text-brivo-slate leading-relaxed">
                            Cross-matter linkage analysis across extracted respondents in this cohort. Clicking any noticee inspects historical sanction exposure.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.precedents.flatMap((p) => p.respondents || []).slice(0, 20).map((resp, i) => (
                              <Link
                                key={i}
                                href={`/explorer?q=${encodeURIComponent(resp)}`}
                                onClick={onClose}
                                className="px-2.5 sm:px-3 py-1 rounded-lg bg-brivo-paper hover:bg-brivo-mist border border-brivo-navy/10 text-xs font-mono text-brivo-navy transition-colors flex items-center gap-1 max-w-full"
                              >
                                <span className="truncate">{resp}</span>
                                <ChevronRight className="w-3 h-3 text-brivo-slate shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>

            {/* Modal Footer Bar */}
            <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-t border-brivo-navy/10 bg-brivo-paper flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs shrink-0">
              <span className="font-mono text-[0.62rem] sm:text-[0.65rem] text-brivo-slate text-center sm:text-left">
                Indexed from public SEBI orders • SHA-256 Provenance Tracked
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyReport}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-1.5 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Brief</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-initial justify-center px-4 py-1.5 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-mono font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
