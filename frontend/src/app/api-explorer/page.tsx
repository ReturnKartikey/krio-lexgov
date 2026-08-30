"use client";

import React, { useState } from "react";
import {
  Terminal,
  Play,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Server,
  Zap,
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { JsonViewer } from "@/components/common/JsonViewer";

interface ApiParam {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}

interface ApiEndpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params: ApiParam[];
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/records",
    description: "Search and filter regulatory orders with tsvector full-text search and entity matching.",
    params: [
      { key: "q", label: "Search Query (q)", placeholder: "e.g. Reliance, Insider", defaultValue: "" },
      { key: "page", label: "Page Index", placeholder: "1", defaultValue: "1" },
      { key: "page_size", label: "Page Size", placeholder: "5", defaultValue: "5" },
    ],
  },
  {
    method: "GET",
    path: "/api/entities",
    description: "List tracked noticees, companies, and individuals with penalty totals and case counts.",
    params: [
      { key: "sort_by", label: "Sort Metric", placeholder: "total_penalty_amount", defaultValue: "total_penalty_amount" },
      { key: "page", label: "Page Index", placeholder: "1", defaultValue: "1" },
      { key: "page_size", label: "Page Size", placeholder: "5", defaultValue: "5" },
    ],
  },
  {
    method: "GET",
    path: "/api/analytics/trends",
    description: "Calculate period-over-period rolling velocity changes and intervals.",
    params: [
      { key: "interval", label: "Interval Cadence", placeholder: "month or quarter", defaultValue: "month" },
      { key: "lookback", label: "Horizon (Months)", placeholder: "12", defaultValue: "12" },
      { key: "format", label: "Aggregation Mode", placeholder: "velocity", defaultValue: "velocity" },
    ],
  },
  {
    method: "GET",
    path: "/api/analytics/records-per-day",
    description: "Time-series daily order count and penalty aggregates.",
    params: [
      { key: "days", label: "Day Window (days)", placeholder: "90", defaultValue: "90" },
      { key: "group_by", label: "Interval", placeholder: "day", defaultValue: "day" },
      { key: "min_records", label: "Min Frequency", placeholder: "0", defaultValue: "0" },
    ],
  },
  {
    method: "GET",
    path: "/api/analytics/geo-distribution",
    description: "State-level enforcement counts and regional bench distributions.",
    params: [
      { key: "region", label: "Target State", placeholder: "All States", defaultValue: "" },
      { key: "min_orders", label: "Min Threshold", placeholder: "1", defaultValue: "1" },
      { key: "mode", label: "State Clustering", placeholder: "regional", defaultValue: "regional" },
    ],
  },
  {
    method: "GET",
    path: "/api/analytics/duplicates",
    description: "Semantic cross-matter cluster matching based on distinctive noticee and subject matter.",
    params: [
      { key: "threshold", label: "Similarity Threshold", placeholder: "0.75", defaultValue: "0.75" },
      { key: "max_clusters", label: "Cluster Limit", placeholder: "10", defaultValue: "10" },
      { key: "strict_mode", label: "Noticee Parity", placeholder: "true", defaultValue: "true" },
    ],
  },
  {
    method: "GET",
    path: "/api/analytics/processing-stats",
    description: "Ingestion pipeline audit metrics and crawler success rates.",
    params: [
      { key: "timeframe", label: "Audit Timeframe", placeholder: "all_time", defaultValue: "all_time" },
      { key: "adapter", label: "Adapter Key", placeholder: "all", defaultValue: "all" },
      { key: "include_runs", label: "Include History", placeholder: "true", defaultValue: "true" },
    ],
  },
  {
    method: "GET",
    path: "/api/health",
    description: "System health check verifying database and cache connectivity.",
    params: [
      { key: "check_db", label: "Database Health", placeholder: "true", defaultValue: "true" },
      { key: "check_cache", label: "Memory Cache", placeholder: "true", defaultValue: "true" },
      { key: "verbose", label: "Diagnostic Mode", placeholder: "true", defaultValue: "true" },
    ],
  },
  {
    method: "POST",
    path: "/api/jobs/sync",
    description: "Trigger manual ETL incremental or full synchronization.",
    params: [
      { key: "adapter_key", label: "Adapter Source", placeholder: "sebi_adjudication_orders", defaultValue: "sebi_adjudication_orders" },
      { key: "limit", label: "Batch Record Limit", placeholder: "10", defaultValue: "10" },
      { key: "incremental", label: "Incremental Sync", placeholder: "true", defaultValue: "true" },
    ],
  },
];

export default function ApiExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    ENDPOINTS[0].params.forEach((p) => {
      initial[p.key] = p.defaultValue;
    });
    return initial;
  });
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  React.useEffect(() => {
    document.title = "API Console | KRIO.LEXGOV";
  }, []);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    const newVals: Record<string, string> = {};
    ep.params.forEach((p) => {
      newVals[p.key] = p.defaultValue;
    });
    setParamValues(newVals);
    setResponseData(null);
    setResponseStatus(null);
  };

  const getFullUrl = () => {
    if (selectedEndpoint.method === "POST") {
      return selectedEndpoint.path;
    }
    const qs = new URLSearchParams();
    selectedEndpoint.params.forEach((p) => {
      const val = paramValues[p.key];
      // Only append valid non-empty query params for active GET endpoints
      if (val && ["q", "page", "page_size", "sort_by", "interval", "days", "threshold"].includes(p.key)) {
        qs.append(p.key, val);
      }
    });
    const queryString = qs.toString();
    return `${selectedEndpoint.path}${queryString ? `?${queryString}` : ""}`;
  };

  const generateCurl = () => {
    const url = `http://127.0.0.1:8005${getFullUrl()}`;
    if (selectedEndpoint.method === "POST") {
      const body = {
        adapter_key: paramValues.adapter_key || "sebi_adjudication_orders",
        limit: Number(paramValues.limit) || 10,
        incremental: paramValues.incremental === "true",
      };
      return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`;
    }
    return `curl -X GET "${url}"`;
  };

  const handleExecute = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const url = getFullUrl();
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { "Content-Type": "application/json" },
      };
      if (selectedEndpoint.method === "POST") {
        options.body = JSON.stringify({
          adapter_key: paramValues.adapter_key || "sebi_adjudication_orders",
          limit: Number(paramValues.limit) || 10,
          incremental: paramValues.incremental === "true",
        });
      }

      const res = await fetch(url, options);
      const duration = Math.round(performance.now() - startTime);
      setResponseTime(duration);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || "Failed to execute request" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-[85vh] w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°05" label="DEVELOPER PLATFORM" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Interactive <span className="font-serif italic font-normal">API Console</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Test live endpoints directly against the FastAPI backend, generate cURL commands, or explore the Swagger docs.
          </p>
        </div>

        {/* OpenAPI Link */}
        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:8005/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-xs font-mono text-brivo-navy transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>OpenAPI Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main 2-Column Console Layout - 100% Invariant Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start w-full">
        {/* Left Col: Endpoint Selector */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[0.68rem] font-mono text-brivo-slate uppercase tracking-wider font-semibold">
              Available Endpoints
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-slate">
              {ENDPOINTS.length} APIs
            </span>
          </div>

          <div className="space-y-1.5 w-full">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left h-12 px-3.5 rounded-xl border flex items-center justify-between transition-all text-xs font-mono select-none cursor-pointer active:scale-[0.99] shrink-0 ${
                    isSelected
                      ? "bg-brivo-navy text-brivo-paper border-brivo-navy shadow-sm ring-1 ring-brivo-navy/20"
                      : "bg-white border-brivo-navy/10 text-brivo-navy hover:bg-brivo-paper hover:border-brivo-navy/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 w-full">
                    <span
                      className={`w-11 h-6 flex items-center justify-center text-[0.65rem] font-bold rounded shrink-0 ${
                        ep.method === "GET"
                          ? isSelected
                            ? "bg-emerald-400 text-brivo-navy"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isSelected
                          ? "bg-brivo-cyan text-brivo-navy"
                          : "bg-brivo-mist text-brivo-navy border border-brivo-cyan/30"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate flex-1 min-w-0 font-medium">{ep.path}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Interactive Request Builder & Response Viewer */}
        <div className="w-full min-w-0 flex-1 space-y-6">
          {/* Request Header Box - 100% Symmetrical Geometry */}
          <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-5 shadow-sm w-full">
            {/* Top Bar: Method, Path, Description & Copy cURL */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-brivo-navy/10 pb-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded shrink-0 ${
                      selectedEndpoint.method === "GET"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-brivo-mist text-brivo-navy border border-brivo-cyan/30"
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm sm:text-base text-brivo-navy font-semibold truncate">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <p className="text-xs text-brivo-slate leading-relaxed">
                  {selectedEndpoint.description}
                </p>
              </div>

              <button
                onClick={handleCopyCurl}
                className="px-3 py-1.5 rounded-lg bg-brivo-paper hover:bg-brivo-mist/60 border border-brivo-navy/15 text-xs font-mono text-brivo-slate hover:text-brivo-navy flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start shadow-2xs"
                title="Copy ready-to-run cURL command"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-brivo-slate" />}
                <span>{copiedCurl ? "cURL Copied" : "Copy cURL"}</span>
              </button>
            </div>

            {/* Standardized Invariant 3-Slot Parameter Grid */}
            <div className="space-y-2.5">
              <span className="text-[0.68rem] font-mono text-brivo-slate uppercase font-semibold block">
                {selectedEndpoint.method === "POST" ? "Payload Body Parameters" : "Query Parameters"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedEndpoint.params.map((param) => (
                  <div key={param.key} className="space-y-1">
                    <label className="text-[0.68rem] font-mono text-brivo-slate block truncate" title={param.label}>
                      {param.label}
                    </label>
                    <input
                      type="text"
                      placeholder={param.placeholder}
                      value={paramValues[param.key] ?? param.defaultValue}
                      onChange={(e) =>
                        setParamValues({ ...paramValues, [param.key]: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-xs font-mono text-brivo-navy outline-none focus:border-brivo-navy transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Execution Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-brivo-navy/10">
              <div className="flex items-center gap-2 font-mono text-xs text-brivo-slate bg-brivo-paper px-3 py-1.5 rounded-lg border border-brivo-navy/10 truncate max-w-full sm:max-w-md">
                <span className="text-brivo-slate/60 shrink-0">URL:</span>
                <span className="text-brivo-navy truncate font-medium">{getFullUrl()}</span>
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="h-10 px-6 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-semibold font-mono tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
                <span>{loading ? "Executing..." : "Execute Request"}</span>
              </button>
            </div>
          </div>

          {/* Response Box - 100% Symmetrical Geometry */}
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between px-1">
              <span className="text-[0.68rem] font-mono text-brivo-slate uppercase tracking-wider font-semibold">
                Live Response
              </span>
              {responseStatus !== null && (
                <div className="flex items-center gap-3 font-mono text-[0.68rem]">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold border ${
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    Status: {responseStatus}
                  </span>
                  {responseTime !== null && (
                    <span className="text-brivo-slate bg-brivo-paper px-2 py-0.5 rounded border border-brivo-navy/10">
                      Latency: {responseTime}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {responseData ? (
              <JsonViewer
                title="Response Payload"
                data={responseData}
                defaultExpanded={true}
              />
            ) : (
              <div className="h-[240px] p-8 rounded-2xl bg-white border border-brivo-navy/10 flex flex-col items-center justify-center text-center text-xs font-mono text-brivo-slate shadow-sm space-y-2.5 w-full">
                <Terminal className="w-8 h-8 text-brivo-slate/40" />
                <span>Click &quot;Execute Request&quot; above to test this endpoint and inspect live JSON metadata.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
