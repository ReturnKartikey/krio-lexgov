export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EnvelopeResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface RawDocumentSimple {
  id: string;
  source_ref: string;
  content_hash: string;
  fetched_at: string;
  http_status: number;
  mime_type: string;
}

export interface EntitySimple {
  id: string;
  name: string;
  normalized_name: string;
  entity_type: "company" | "individual" | "intermediary";
  record_count: number;
  total_penalty_amount: number;
  role?: string;
}

export interface RecordListItem {
  id: string;
  source_id: string;
  external_id: string;
  record_type: string;
  title: string;
  summary?: string;
  entity_names: string[];
  jurisdiction?: string;
  state?: string;
  city?: string;
  amount?: number;
  status: string;
  published_date?: string;
  source_url: string;
  ingested_at: string;
}

export interface RecordDetailItem extends RecordListItem {
  raw_metadata: Record<string, any>;
  raw_document?: RawDocumentSimple;
  entities: EntitySimple[];
}

export interface EntityDetailItem {
  id: string;
  name: string;
  normalized_name: string;
  entity_type: string;
  first_seen: string;
  last_seen: string;
  record_count: number;
  total_penalty_amount: number;
  recent_records: RecordListItem[];
}

export interface DailyCount {
  date: string;
  count: number;
  total_penalty: number;
}

export interface TrendMetric {
  label: string;
  current_value: number;
  previous_value: number;
  percentage_change: number;
  trend_direction: "up" | "down" | "flat";
}

export interface TrendsResponse {
  interval: "week" | "month";
  total_orders_trend: TrendMetric;
  total_penalties_trend: TrendMetric;
  active_entities_trend: TrendMetric;
  time_series: { date: string; orders: number; penalties: number }[];
}

export interface EntityFrequencyItem {
  id: string;
  name: string;
  entity_type: string;
  record_count: number;
  total_penalty: number;
}

export interface GeoDistributionItem {
  state: string;
  record_count: number;
  total_penalty: number;
  top_cities: string[];
}

export interface IngestionRunItem {
  id: string;
  source_id: string;
  started_at: string;
  finished_at?: string;
  status: "queued" | "running" | "success" | "partial" | "failed";
  records_seen: number;
  records_added: number;
  records_updated: number;
  records_failed: number;
  duration_seconds?: number;
  error_log?: string;
  triggered_by: string;
}

export interface ProcessingStatsResponse {
  total_runs: number;
  success_rate_percent: number;
  average_duration_seconds: number;
  total_records_ingested: number;
  last_run_at?: string;
  recent_runs: IngestionRunItem[];
}

export interface DuplicateItemResponse {
  primary_record_id: string;
  primary_title: string;
  duplicate_record_id: string;
  duplicate_title: string;
  similarity_score: number;
  reason: string;
  entity_overlap: string[];
  amount_difference?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  database: string;
  redis: string;
  total_records: number;
  total_entities: number;
  uptime_seconds: number;
}

export interface PrecedentCase {
  id: string;
  external_id: string;
  title: string;
  published_date: string;
  amount: number | null;
  jurisdiction: string | null;
  key_finding: string;
  respondents: string[];
}

export interface SynthesisResponse {
  headline: string;
  mode: string;
  executive_summary: string;
  total_penalty_exposure: number;
  order_count: number;
  entity_count: number;
  applicable_statutes: string[];
  precedents: PrecedentCase[];
  compliance_takeaways: string[];
  risk_level: "HIGH" | "MEDIUM" | "MODERATE";
  confidence_score: number;
  generated_at: string;
}
