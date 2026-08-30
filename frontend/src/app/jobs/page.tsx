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
import { MicroLabel } from "@/components/common/MicroLabel";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { motion, AnimatePresence } from "framer-motion";
import { getJobs, triggerSyncJob } from "@/lib/api";
import { IngestionRunItem } from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function JobsPage() {
  const [jobs, setJobs] = useState<IngestionRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
    fetchJobsList();
  }, []);

  const handleTriggerSync = async (incremental: boolean = true) => {
    setIsSyncing(true);
    setSyncStatus("Triggering ETL synchronization pipeline...");
    try {
      const res = await triggerSyncJob({
        adapter_key: "sebi_adjudication_orders",
        limit: 10,
        incremental,
      });
      setSyncStatus(`Sync initiated: Job Run ID ${res.run_id}`);
      await fetchJobsList();
    } catch (err: any) {
      setSyncStatus(`Sync failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTrigger = (trigger: string) => {
    const t = trigger.toLowerCase().replace(/_/g, " ");
    if (t.includes("bootstrap")) return "Initial Bootstrap";
    if (t.includes("idempotency")) return "Idempotency Check";
    if (t.includes("scheduler") || t.includes("periodic") || t.includes("cron")) return "Scheduled Cron";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°04" label="ETL ORCHESTRATION" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Crawler Ingestion <span className="font-serif italic font-normal">Audit Log</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Monitor background scheduled synchronizations, rate-limit state, record updates, and error transcripts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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

      {syncStatus && (
        <div className="p-3 rounded-lg bg-white border border-brivo-navy/15 text-xs font-mono text-brivo-navy flex items-center justify-between animate-fade-in shadow-sm">
          <span>{syncStatus}</span>
          <button onClick={() => setSyncStatus(null)} className="text-brivo-slate hover:text-brivo-navy cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Ingestion Runs Table */}
      <div className="border border-brivo-navy/10 rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-xs">
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
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-brivo-slate font-mono">
                  Loading ingestion history...
                </td>
              </tr>
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
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="px-6 py-4 space-y-2 overflow-hidden"
                          >
                            <div className="flex items-center justify-between text-[0.7rem] font-mono text-brivo-slate">
                              <span>Ingestion Run Full ID: {job.id}</span>
                              <span>Finished: {job.finished_at ? formatDate(job.finished_at) : "In Progress"}</span>
                            </div>
                            {job.error_log ? (
                              <div className="p-3 rounded bg-white border border-rose-200 text-rose-800 font-mono text-[0.75rem] whitespace-pre-wrap max-h-48 overflow-y-auto shadow-sm">
                                {job.error_log}
                              </div>
                            ) : (
                              <div className="p-3 rounded bg-white border border-brivo-navy/10 text-brivo-slate font-mono text-[0.75rem] shadow-sm">
                                Clean execution. No errors logged during discovery, parsing, or indexing phases.
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
    </div>
  );
}
