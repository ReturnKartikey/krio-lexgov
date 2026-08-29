"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
            className="relative w-full max-w-4xl bg-white border border-brivo-navy/15 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brivo-navy/10 bg-brivo-paper flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-brivo-navy text-brivo-paper flex items-center justify-center font-serif italic text-sm font-bold shadow-sm">
                  K
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brivo-navy tracking-tight">
                      KRIO // STATUTORY RISK SYNTHESIZER
                    </span>
                    <span className="text-[0.6rem] font-mono px-1.5 py-0.2 rounded bg-brivo-mist text-brivo-navy border border-brivo-cyan/40">
                      LIVE NLP
                    </span>
                  </div>
                  <p className="text-[0.7rem] text-brivo-slate">
                    Cross-matter precedent extraction & liability analysis across SEBI orders
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block font-mono text-[0.65rem] text-brivo-slate px-2 py-1 rounded bg-white border border-brivo-navy/10">
                  ESC to close
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-brivo-navy/10 text-brivo-slate hover:text-brivo-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input & Mode Toolbar */}
            <div className="p-6 border-b border-brivo-navy/10 bg-white space-y-4">
              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunSynthesis(query, mode, true);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brivo-slate" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Focus query (e.g. 'Illiquid Options', 'Arvind Shenoy Front-Running', 'Section 15HA', or leave empty for full cohort)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brivo-paper border border-brivo-navy/15 focus:border-brivo-navy focus:ring-1 focus:ring-brivo-navy text-xs sm:text-sm text-brivo-navy placeholder:text-brivo-slate/60 outline-none transition-all font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={initialLoading}
                  className="px-5 py-2.5 rounded-xl bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Activity className={`w-3.5 h-3.5 ${initialLoading ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
                  <span>{initialLoading ? "Analyzing..." : "Synthesize"}</span>
                </button>
              </form>

              {/* Mode Pills (Smooth & Jitter-Free) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center p-1 rounded-full bg-brivo-paper border border-brivo-navy/10">
                  <button
                    onClick={() => handleModeSwitch("risk_brief")}
                    className="relative px-3.5 py-1 rounded-full text-xs font-mono font-medium transition-colors select-none"
                  >
                    {mode === "risk_brief" && (
                      <motion.div
                        layoutId="aiModePill"
                        className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${mode === "risk_brief" ? "text-brivo-paper" : "text-brivo-slate hover:text-brivo-navy"}`}>
                      Executive Risk Brief
                    </span>
                  </button>

                  <button
                    onClick={() => handleModeSwitch("precedent_analysis")}
                    className="relative px-3.5 py-1 rounded-full text-xs font-mono font-medium transition-colors select-none"
                  >
                    {mode === "precedent_analysis" && (
                      <motion.div
                        layoutId="aiModePill"
                        className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${mode === "precedent_analysis" ? "text-brivo-paper" : "text-brivo-slate hover:text-brivo-navy"}`}>
                      Precedent Analysis
                    </span>
                  </button>

                  <button
                    onClick={() => handleModeSwitch("entity_exposure")}
                    className="relative px-3.5 py-1 rounded-full text-xs font-mono font-medium transition-colors select-none"
                  >
                    {mode === "entity_exposure" && (
                      <motion.div
                        layoutId="aiModePill"
                        className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${mode === "entity_exposure" ? "text-brivo-paper" : "text-brivo-slate hover:text-brivo-navy"}`}>
                      Noticee Liability Matrix
                    </span>
                  </button>
                </div>

                {/* Example query chips */}
                <div className="hidden sm:flex items-center gap-1 text-[0.65rem] font-mono text-brivo-slate">
                  <span>Try:</span>
                  <button
                    onClick={() => {
                      setQuery("Illiquid Options");
                      handleRunSynthesis("Illiquid Options", mode, true);
                    }}
                    className="underline hover:text-brivo-navy"
                  >
                    Illiquid Options
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      setQuery("Front-Running");
                      handleRunSynthesis("Front-Running", mode, true);
                    }}
                    className="underline hover:text-brivo-navy"
                  >
                    Front-Running
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      setQuery("Reliance");
                      handleRunSynthesis("Reliance", mode, true);
                    }}
                    className="underline hover:text-brivo-navy"
                  >
                    Reliance
                  </button>
                </div>
              </div>
            </div>

            {/* Results Content Area */}
            <div
              data-lenis-prevent="true"
              className="p-6 overflow-y-auto space-y-6 flex-1 bg-editorial-grid max-h-[55vh]"
              style={{ overscrollBehavior: "contain" }}
            >
              {initialLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-2 border-brivo-navy/10 border-t-brivo-navy animate-spin" />
                  <div className="space-y-1 text-center font-mono">
                    <p className="text-xs font-semibold text-brivo-navy">
                      Scanning Public SEBI Adjudication Registry...
                    </p>
                    <p className="text-[0.7rem] text-brivo-slate">
                      Synthesizing statutory penalties, noticees, and Section 15HA precedents
                    </p>
                  </div>
                </div>
              ) : data ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    {/* Top Headline & Risk Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brivo-navy/10">
                      <div className="space-y-1">
                        <MicroLabel number="N°01" label="SYNTHESIS REPORT" />
                        <h2 className="text-xl sm:text-2xl font-light text-brivo-navy font-sans tracking-tight">
                          {mode === "entity_exposure"
                            ? "Noticee & Promoter Cross-Matter Liability Synthesis"
                            : mode === "precedent_analysis"
                            ? "Precedent Authority & Key Statutory Violations"
                            : data.headline}
                        </h2>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full font-mono text-[0.65rem] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 self-start sm:self-center shadow-sm ${
                          data.risk_level === "HIGH"
                            ? "bg-rose-50 border border-rose-200 text-rose-700"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{data.risk_level} ENFORCEMENT INTENSITY</span>
                      </span>
                    </div>

                    {/* Quantitative Exposure KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-1">
                        <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                          Sanction Exposure
                        </span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-brivo-navy block">
                          {formatINR(data.total_penalty_exposure)}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-1">
                        <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                          Orders Synthesized
                        </span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-brivo-navy block">
                          {data.order_count} Proceedings
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-1">
                        <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                          Tracked Noticees
                        </span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-brivo-navy block">
                          {data.entity_count} Entities
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-1">
                        <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                          Confidence Score
                        </span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 block">
                          {(data.confidence_score * 100).toFixed(0)}% Audit Grade
                        </span>
                      </div>
                    </div>

                    {/* Mode Specific Views */}
                    {mode === "risk_brief" && (
                      <div className="space-y-5">
                        {/* Executive Briefing Card */}
                        <div className="p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-2">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Executive Legal Brief</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-brivo-navy leading-relaxed font-sans">
                            {data.executive_summary}
                          </p>
                        </div>

                        {/* Applicable Statutes */}
                        <div className="p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Applicable Regulatory Provisions & Sections</span>
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {data.applicable_statutes.map((statute, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md bg-brivo-paper border border-brivo-navy/10 text-xs font-mono text-brivo-navy"
                              >
                                {statute}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Practical Compliance Takeaways */}
                        <div className="p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Citing Precedent Matters & Case Holdings ({data.precedents.length})</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {data.precedents.map((prec) => (
                            <div
                              key={prec.id}
                              className="p-5 rounded-xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/25 transition-all shadow-sm space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-navy font-semibold">
                                    {prec.external_id}
                                  </span>
                                  <span className="text-xs font-mono text-brivo-slate">
                                    {formatDate(prec.published_date)}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-semibold text-brivo-navy">
                                  {prec.amount ? formatINR(prec.amount) : "Non-Monetary"}
                                </span>
                              </div>

                              <h4 className="text-sm font-semibold text-brivo-navy">
                                {prec.title}
                              </h4>

                              <p className="text-xs text-brivo-slate leading-relaxed font-sans line-clamp-2">
                                {prec.key_finding}
                              </p>

                              <div className="pt-2 flex items-center justify-between border-t border-brivo-navy/5">
                                <span className="text-[0.65rem] font-mono text-brivo-slate">
                                  Jurisdiction: {prec.jurisdiction}
                                </span>
                                <Link
                                  href={`/explorer/${prec.id}`}
                                  onClick={onClose}
                                  className="text-xs font-mono text-brivo-navy hover:text-brivo-cyan flex items-center gap-1 transition-colors"
                                >
                                  <span>View Complete Holding</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mode === "entity_exposure" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-brivo-navy" />
                            <span>Identified Noticees & Legal Entities</span>
                          </h3>
                          <span className="text-[0.65rem] font-mono text-brivo-slate">
                            {data.entity_count} Unique Entities Tracked
                          </span>
                        </div>

                        <div className="p-5 rounded-xl bg-white border border-brivo-navy/10 shadow-sm space-y-3">
                          <p className="text-xs text-brivo-slate leading-relaxed">
                            Cross-matter linkage analysis across extracted respondents in this cohort. Clicking any noticee inspects historical sanction exposure.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.precedents.flatMap((p) => p.respondents || []).slice(0, 20).map((resp, i) => (
                              <Link
                                key={i}
                                href={`/explorer?q=${encodeURIComponent(resp)}`}
                                onClick={onClose}
                                className="px-3 py-1 rounded-lg bg-brivo-paper hover:bg-brivo-mist border border-brivo-navy/10 text-xs font-mono text-brivo-navy transition-colors flex items-center gap-1"
                              >
                                <span>{resp}</span>
                                <ChevronRight className="w-3 h-3 text-brivo-slate" />
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
            <div className="px-6 py-3.5 border-t border-brivo-navy/10 bg-brivo-paper flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-mono text-[0.65rem] text-brivo-slate">
                Generated from indexed public SEBI regulatory orders • SHA-256 Provenance Tracked
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyReport}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm"
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
                  className="px-4 py-1.5 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-mono font-medium transition-colors shadow-sm"
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
