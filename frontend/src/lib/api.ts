import {
  EnvelopeResponse,
  RecordListItem,
  RecordDetailItem,
  EntitySimple,
  EntityDetailItem,
  DailyCount,
  TrendsResponse,
  EntityFrequencyItem,
  GeoDistributionItem,
  ProcessingStatsResponse,
  DuplicateItemResponse,
  IngestionRunItem,
  HealthResponse,
  SynthesisResponse,
} from "./types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number = 60000): void {
  if (memoryCache.size > 150) {
    const keys = Array.from(memoryCache.keys());
    if (keys.length > 0) {
      memoryCache.delete(keys[0]);
    }
  }
  memoryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  memoryCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  });
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    if (
      !window.location.hostname.includes("localhost") &&
      !window.location.hostname.includes("127.0.0.1")
    ) {
      return "https://krio-lexgov-api.onrender.com";
    }
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    "http://127.0.0.1:8005"
  ).replace(/\/$/, "");
}

export function getDocsUrl(): string {
  const base = getApiBaseUrl();
  return `${base}/docs`;
}

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return getApiBaseUrl();
}

const inflightRequests = new Map<string, Promise<any>>();

async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit,
  ttlMs: number = 45000
): Promise<T> {
  const base = getApiBase();
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const isGet = !options || !options.method || options.method.toUpperCase() === "GET";

  if (isGet) {
    const cached = getCached<T>(url);
    if (cached) return cached;

    // In-flight request deduplication
    if (inflightRequests.has(url)) {
      return inflightRequests.get(url) as Promise<T>;
    }
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
      }

      const data: T = await res.json();
      if (isGet) {
        setCached(url, data, ttlMs);
      }
      return data;
    } catch (err: any) {
      console.error(`Fetch failed for ${url}:`, err);
      throw err;
    } finally {
      if (isGet) {
        inflightRequests.delete(url);
      }
    }
  })();

  if (isGet) {
    inflightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}

export function prefetchEndpoint(endpoint: string, ttlMs: number = 60000) {
  if (typeof window === "undefined") return;
  const base = getApiBase();
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  if (getCached(url)) return;
  fetchJson(endpoint, undefined, ttlMs).catch(() => {});
}

export function prefetchTab(tabHref: string) {
  if (typeof window === "undefined") return;
  if (tabHref.includes("/explorer")) {
    prefetchEndpoint("/api/records?page=1&page_size=20");
    prefetchEndpoint("/api/analytics/trends?interval=month");
  } else if (tabHref.includes("/analytics")) {
    prefetchEndpoint("/api/analytics/trends?interval=month");
    prefetchEndpoint("/api/analytics/daily?days=90");
    prefetchEndpoint("/api/analytics/entities?limit=10");
    prefetchEndpoint("/api/analytics/geo-distribution");
    prefetchEndpoint("/api/analytics/duplicates?threshold=0.75");
    prefetchEndpoint("/api/analytics/stats");
  } else if (tabHref.includes("/jobs")) {
    prefetchEndpoint("/api/jobs");
    prefetchEndpoint("/api/health");
  }
}

export async function getRecords(params?: {
  q?: string;
  state?: string;
  record_type?: string;
  status?: string;
  entity?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  penalty_slab?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}): Promise<EnvelopeResponse<RecordListItem[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, String(v));
      }
    });
  }
  const qs = searchParams.toString();
  return fetchJson<EnvelopeResponse<RecordListItem[]>>(`/api/records${qs ? `?${qs}` : ""}`);
}

export async function getRecordDetail(id: string): Promise<RecordDetailItem> {
  return fetchJson<RecordDetailItem>(`/api/records/${id}`);
}

export async function getEntities(params?: {
  q?: string;
  entity_type?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}): Promise<EnvelopeResponse<EntitySimple[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, String(v));
      }
    });
  }
  const qs = searchParams.toString();
  return fetchJson<EnvelopeResponse<EntitySimple[]>>(`/api/entities${qs ? `?${qs}` : ""}`);
}

export async function getEntityDetail(id: string): Promise<EntityDetailItem> {
  return fetchJson<EntityDetailItem>(`/api/entities/${id}`);
}

export async function getRecordsPerDay(days: number = 90): Promise<DailyCount[]> {
  return fetchJson<DailyCount[]>(`/api/analytics/records-per-day?days=${days}`);
}

export async function getTrends(interval: "week" | "month" = "month"): Promise<TrendsResponse> {
  return fetchJson<TrendsResponse>(`/api/analytics/trends?interval=${interval}`);
}

export async function getEntityFrequency(top: number = 20): Promise<EntityFrequencyItem[]> {
  return fetchJson<EntityFrequencyItem[]>(`/api/analytics/entity-frequency?top=${top}`);
}

export async function getGeoDistribution(): Promise<GeoDistributionItem[]> {
  return fetchJson<GeoDistributionItem[]>("/api/analytics/geo-distribution");
}

export async function getProcessingStats(): Promise<ProcessingStatsResponse> {
  return fetchJson<ProcessingStatsResponse>("/api/analytics/processing-stats");
}

export async function getDuplicates(threshold: number = 0.75): Promise<DuplicateItemResponse[]> {
  return fetchJson<DuplicateItemResponse[]>(`/api/analytics/duplicates?threshold=${threshold}`);
}

export async function getJobs(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<EnvelopeResponse<IngestionRunItem[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, String(v));
      }
    });
  }
  const qs = searchParams.toString();
  return fetchJson<EnvelopeResponse<IngestionRunItem[]>>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export async function getJobDetail(jobId: string): Promise<IngestionRunItem> {
  return fetchJson<IngestionRunItem>(`/api/jobs/${jobId}`);
}

export async function triggerSyncJob(options?: {
  adapter_key?: string;
  limit?: number;
  incremental?: boolean;
}): Promise<{ message: string; run_id: string; status: string }> {
  clearCache();
  return fetchJson<{ message: string; run_id: string; status: string }>("/api/jobs/sync", {
    method: "POST",
    body: JSON.stringify({
      adapter_key: options?.adapter_key || "sebi_adjudication_orders",
      limit: options?.limit || 50,
      incremental: options?.incremental ?? true,
    }),
  });
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/api/health");
}

export async function synthesizeIntelligence(params?: {
  query?: string;
  mode?: "risk_brief" | "precedent_analysis" | "entity_exposure" | "statutory_memo";
  state?: string;
  entity_id?: string;
}): Promise<SynthesisResponse> {
  return fetchJson<SynthesisResponse>("/api/ai/synthesize", {
    method: "POST",
    body: JSON.stringify({
      query: params?.query || "",
      mode: params?.mode || "risk_brief",
      state: params?.state || "",
      entity_id: params?.entity_id || "",
    }),
  });
}
