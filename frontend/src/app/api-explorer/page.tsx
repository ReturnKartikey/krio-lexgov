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

interface ApiEndpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: any;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/records",
    description: "Search and filter regulatory orders with tsvector full-text search and entity matching.",
    defaultParams: { q: "Reliance", page: "1", page_size: "5" },
  },
  {
    method: "GET",
    path: "/api/entities",
    description: "List tracked noticees, companies, and individuals with penalty totals and case counts.",
    defaultParams: { sort_by: "total_penalty_amount", page_size: "5" },
  },
  {
    method: "GET",
    path: "/api/analytics/trends",
    description: "Calculate period-over-period rolling velocity changes and intervals.",
    defaultParams: { interval: "month" },
  },
  {
    method: "GET",
    path: "/api/analytics/records-per-day",
    description: "Time-series daily order count and penalty aggregates.",
    defaultParams: { days: "90" },
  },
  {
    method: "GET",
    path: "/api/analytics/geo-distribution",
    description: "State-level enforcement counts and regional bench distributions.",
    defaultParams: {},
  },
  {
    method: "GET",
    path: "/api/analytics/duplicates",
    description: "Fuzzy matching near-duplicate order clusters based on pg_trgm similarity.",
    defaultParams: { threshold: "0.6" },
  },
  {
    method: "GET",
    path: "/api/analytics/processing-stats",
    description: "Ingestion pipeline audit metrics and crawler success rates.",
    defaultParams: {},
  },
  {
    method: "GET",
    path: "/api/health",
    description: "System health check verifying database and cache connectivity.",
    defaultParams: {},
  },
  {
    method: "POST",
    path: "/api/jobs/sync",
    description: "Trigger manual ETL incremental or full synchronization.",
    defaultBody: { adapter_key: "sebi_adjudication_orders", limit: 10, incremental: true },
  },
];

export default function ApiExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [queryParams, setQueryParams] = useState<Record<string, string>>(
    ENDPOINTS[0].defaultParams || {}
  );
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(ENDPOINTS[0].defaultBody || {}, null, 2)
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setQueryParams(ep.defaultParams || {});
    setRequestBody(JSON.stringify(ep.defaultBody || {}, null, 2));
    setResponseData(null);
    setResponseStatus(null);
  };

  const getFullUrl = () => {
    const qs = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) qs.append(k, v);
    });
    const queryString = qs.toString();
    return `${selectedEndpoint.path}${queryString ? `?${queryString}` : ""}`;
  };

  const generateCurl = () => {
    const url = `http://127.0.0.1:8005${getFullUrl()}`;
    if (selectedEndpoint.method === "POST") {
      return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, "")}'`;
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
      if (selectedEndpoint.method === "POST" && requestBody) {
        options.body = requestBody;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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

      {/* Main 2-Column Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Endpoint Selector */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[0.65rem] font-mono text-brivo-slate uppercase tracking-wider block px-1">
            Available Endpoints
          </span>

          <div className="space-y-1.5">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-mono flex items-center justify-between shadow-sm ${
                    isSelected
                      ? "bg-brivo-navy text-brivo-paper border-brivo-navy"
                      : "bg-white border-brivo-navy/10 text-brivo-navy hover:bg-brivo-paper"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded ${
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
                    <span className="truncate">{ep.path}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Interactive Request Builder & Response Viewer */}
        <div className="lg:col-span-8 space-y-6">
          {/* Request Header Box */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    selectedEndpoint.method === "GET"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-brivo-mist text-brivo-navy border border-brivo-cyan/30"
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm text-brivo-navy font-semibold">
                  {selectedEndpoint.path}
                </span>
              </div>
              <p className="text-xs text-brivo-slate">{selectedEndpoint.description}</p>
            </div>

            {/* Query Parameters Builder */}
            {selectedEndpoint.method === "GET" && selectedEndpoint.defaultParams && (
              <div className="space-y-2 pt-3 border-t border-brivo-navy/10">
                <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">
                  Query Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.keys(selectedEndpoint.defaultParams).map((paramKey) => (
                    <div key={paramKey} className="space-y-1">
                      <label className="text-[0.65rem] font-mono text-brivo-slate block">
                        {paramKey}
                      </label>
                      <input
                        type="text"
                        value={queryParams[paramKey] || ""}
                        onChange={(e) =>
                          setQueryParams({ ...queryParams, [paramKey]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs font-mono text-brivo-navy outline-none focus:border-brivo-navy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Body editor for POST */}
            {selectedEndpoint.method === "POST" && (
              <div className="space-y-2 pt-3 border-t border-brivo-navy/10">
                <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">
                  Request JSON Body
                </span>
                <textarea
                  rows={4}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-2.5 rounded bg-brivo-paper border border-brivo-navy/15 text-xs font-mono text-brivo-navy outline-none focus:border-brivo-navy"
                />
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-brivo-navy/10">
              <button
                onClick={handleCopyCurl}
                className="text-xs font-mono text-brivo-slate hover:text-brivo-navy flex items-center gap-1.5 transition-colors"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-brivo-slate" />}
                <span>{copiedCurl ? "cURL Copied" : "Copy cURL"}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-5 py-2 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-semibold font-mono tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
                <span>{loading ? "Executing..." : "Execute Request"}</span>
              </button>
            </div>
          </div>

          {/* Response Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[0.65rem] font-mono text-brivo-slate uppercase tracking-wider">
                Live Response
              </span>
              {responseStatus !== null && (
                <div className="flex items-center gap-3 font-mono text-[0.65rem]">
                  <span
                    className={
                      responseStatus >= 200 && responseStatus < 300
                        ? "text-emerald-600 font-semibold"
                        : "text-rose-600 font-semibold"
                    }
                  >
                    Status: {responseStatus}
                  </span>
                  {responseTime !== null && (
                    <span className="text-brivo-slate">Latency: {responseTime}ms</span>
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
              <div className="p-8 rounded-lg bg-white border border-brivo-navy/10 text-center text-xs font-mono text-brivo-slate shadow-sm">
                Click &quot;Execute Request&quot; to test the endpoint and inspect live JSON payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
