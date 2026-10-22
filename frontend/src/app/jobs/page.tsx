"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Database,
  Terminal,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { JobsTableSkeleton, MobileTableRowSkeleton } from "@/components/common/Skeleton";
import { toast } from "@/lib/toast";
import { getJobs, triggerSyncJob, getCached } from "@/lib/api";
import { IngestionRunItem } from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function JobsPage() {
  const initialJobs =
    getCached<{ data: IngestionRunItem[] }>("/api/jobs?page_size=20")?.data ||
    getCached<{ data: IngestionRunItem[] }>("/api/jobs")?.data;

  const [jobs, setJobs] = useState<IngestionRunItem[]>(() => initialJobs || []);
  const [loading, setLoading] = useState(() => !initialJobs || initialJobs.length === 0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchJobsList = async () => {
    try {
      const data = await getJobs({ page_size: 20 });
      setJobs(data.data);
    } catch (err) {
      console.error("Failed to load ingestion history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Ingestion Jobs | KRIO.LEXGOV";
    fetchJobsList();
  }, []);

  const handleTriggerSync = async (incremental: boolean = true) => {
    setIsSyncing(true);
    try {
      const res = await triggerSyncJob({
        adapter_key: "sebi_adjudication_orders",
        limit: 10,
        incremental,
      });
      toast.success(
        "Sync Queued",
        `${incremental ? "Incremental" : "Full"} SEBI crawl active (Run ID: ${res.run_id.slice(0, 8)})`
      );
      await fetchJobsList();
    } catch (err: any) {
      toast.error("Sync Failed", err?.message || "Unable to trigger ETL pipeline");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTrigger = (trigger: string) => {
    const t = trigger.toLowerCase().replace(/_/g, " ");
    if (t.includes("bootstrap")) return "Initial Bootstrap";
    if (t.includes("idempotency")) return "Idempotency Check";
    if (t.includes("scheduler") || t.includes("periodic") || t.includes("cron"))
      return "Scheduled Cron";
    if (t.includes("repeat_noticees") || t.includes("noticees")) return "Noticee Re-Index";
    if (t.includes("manual") || t.includes("api")) return "Manual API";
    return trigger.replace(/_/g, " ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-mist border border-brivo-cyan/40 text-brivo-navy animate-pulse font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-medium">
            <AlertTriangle className="w-3 h-3" />
            <span>PARTIAL</span>
          </span>
        );
      case "timed_out":
      case "interrupted":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>TIMED OUT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-8 min-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Crawler Ingestion <span className="font-serif italic font-normal">Audit Log</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Monitor background scheduled synchronizations, rate-limit state, record updates, and error transcripts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleTriggerSync(true)}
            disabled={isSyncing}
            className="px-4 py-2 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-medium tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
            <span>{isSyncing ? "Running Ingestion..." : "Run Incremental Sync"}</span>
          </button>

          <button
            onClick={() => handleTriggerSync(false)}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-xs font-mono text-brivo-navy transition-colors disabled:opacity-50 shadow-sm cursor-pointer active:scale-95"
          >
            Full Re-Sync
          </button>
        </div>
      </div>

      {/* Desktop Ingestion Runs Table */}
      <div className="border border-brivo-navy/10 rounded-lg overflow-x-auto bg-white shadow-sm hidden md:block">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.65rem] tracking-wider border-b border-brivo-navy/10">
            <tr>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trigger Source</th>
              <th className="px-4 py-3">Started At</th>
              <th className="px-4 py-3 text-center">Seen</th>
              <th className="px-4 py-3 text-center">Added</th>
              <th className="px-4 py-3 text-center">Updated</th>
              <th className="px-4 py-3 text-center">Failed</th>
              <th className="px-4 py-3 text-right">Duration</th>
              <th className="px-4 py-3 text-right">Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brivo-navy/5">
            {loading ? (
              <JobsTableSkeleton count={5} />
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-brivo-slate font-mono">
                  No ingestion runs recorded yet. Click &quot;Run Incremental Sync&quot; above.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <React.Fragment key={job.id}>
                    <tr className="hover:bg-brivo-paper/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-brivo-navy font-medium">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-brivo-paper border border-brivo-navy/10 font-mono text-[0.68rem] text-brivo-navy font-medium">
                          {formatTrigger(job.triggered_by)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-brivo-slate whitespace-nowrap">
                        {formatRelativeTime(job.started_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-center text-brivo-navy">
                        {job.records_seen}
                      </td>
                      <td className="px-4 py-3 font-mono text-center">
                        {job.records_added > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-[0.7rem]">
                            +{job.records_added}
                          </span>
                        ) : (
                          <span className="text-brivo-slate/50 font-normal">+0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-center">
                        {job.records_updated > 0 ? (
                          <span className="text-brivo-navy font-semibold">{job.records_updated}</span>
                        ) : (
                          <span className="text-brivo-slate/50 font-normal">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-center">
                        {job.records_failed > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-50 border border-rose-200/80 text-rose-700 font-semibold text-[0.7rem]">
                            {job.records_failed}
                          </span>
                        ) : (
                          <span className="text-brivo-slate/50 font-normal">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-brivo-slate">
                        {job.duration_seconds !== null && job.duration_seconds !== undefined
                          ? `${job.duration_seconds}s`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="p-1 rounded hover:bg-brivo-paper text-brivo-slate hover:text-brivo-navy transition-colors cursor-pointer"
                          title="View Execution Log"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Error / Detail Row with spring motion */}
                    {isExpanded && (
                      <tr className="bg-brivo-paper/80 border-b border-brivo-navy/10">
                        <td colSpan={10} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="p-4 bg-brivo-paper/40 font-mono text-xs space-y-2 border-t border-brivo-navy/5 overflow-hidden"
                          >
                            <div className="flex items-center justify-between text-brivo-slate text-[0.7rem]">
                              <span>Full Execution ID: {job.id}</span>
                              <span>Started: {formatDate(job.started_at)}</span>
                            </div>

                            {job.error_log ? (
                              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[0.7rem] whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                                <span className="font-semibold block mb-1">Execution Log Transcript:</span>
                                {job.error_log}
                              </div>
                            ) : (
                              <div className="p-3 rounded bg-white border border-brivo-navy/10 text-brivo-slate text-[0.7rem] font-mono">
                                Clean execution. Ingestion crawler processed successfully without fatal exceptions.
                              </div>
                            )}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <MobileTableRowSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="border border-brivo-navy/10 rounded-lg p-6 bg-white text-center text-xs font-mono text-brivo-slate">
            No ingestion runs recorded yet. Tap &quot;Run Incremental Sync&quot; above.
          </div>
        ) : (
          jobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            return (
              <div
                key={job.id}
                className="border border-brivo-navy/10 rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                {/* Header: ID + Status */}
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-semibold text-brivo-navy">
                    {job.id.slice(0, 8)}...
                  </div>
                  <div>{getStatusBadge(job.status)}</div>
                </div>

                {/* Subheader: Trigger + Time */}
                <div className="flex items-center justify-between text-xs text-brivo-slate">
                  <span className="px-2 py-0.5 rounded-full bg-brivo-paper border border-brivo-navy/10 font-mono text-[0.65rem] text-brivo-navy">
                    {formatTrigger(job.triggered_by)}
                  </span>
                  <span className="font-mono text-[0.7rem]">
                    {formatRelativeTime(job.started_at)}
                  </span>
                </div>

                {/* Metrics 4-cell Grid */}
                <div className="grid grid-cols-4 gap-2 py-2 border-y border-brivo-navy/5 text-center font-mono">
                  <div className="space-y-0.5">
                    <div className="text-[0.65rem] uppercase text-brivo-slate">Seen</div>
                    <div className="text-xs font-semibold text-brivo-navy">{job.records_seen}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[0.65rem] uppercase text-brivo-slate">Added</div>
                    <div className="text-xs font-semibold text-emerald-700">+{job.records_added}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[0.65rem] uppercase text-brivo-slate">Updated</div>
                    <div className="text-xs font-semibold text-brivo-navy">{job.records_updated}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[0.65rem] uppercase text-brivo-slate">Failed</div>
                    <div className={`text-xs font-semibold ${job.records_failed > 0 ? "text-rose-700" : "text-brivo-slate/60"}`}>
                      {job.records_failed}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between text-[0.7rem] font-mono text-brivo-slate">
                  <span>Execution Duration</span>
                  <span className="text-brivo-navy font-semibold">
                    {job.duration_seconds !== null && job.duration_seconds !== undefined
                      ? `${job.duration_seconds}s`
                      : "—"}
                  </span>
                </div>

                {/* Log toggle button */}
                <div className="pt-2 border-t border-brivo-navy/5 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    className="w-full flex items-center justify-between py-1 text-xs font-mono text-brivo-slate hover:text-brivo-navy cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? "Hide Execution Details" : "View Execution Log"}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Mobile Expandable Log Detail */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="pt-2 space-y-2 overflow-hidden border-t border-brivo-navy/10"
                  >
                    <div className="text-[0.65rem] font-mono text-brivo-slate break-all">
                      Full ID: {job.id}
                    </div>
                    {job.error_log ? (
                      <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[0.7rem] whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {job.error_log}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-slate font-mono text-[0.7rem]">
                        Clean execution. No errors logged during pipeline run.
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
