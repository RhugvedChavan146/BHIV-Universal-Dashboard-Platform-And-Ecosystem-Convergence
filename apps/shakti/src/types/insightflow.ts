// ─── InsightFlow (BHIV Vision Intelligence Runtime) Contracts ────────────────
// Configured via VITE_INSIGHTFLOW_URL in .env

export interface InsightFlowHealthResponse {
  status: string;
  service?: string;
  uptime_seconds?: number;
  error_count_60s?: number;
}

export interface InsightFlowStageMetric {
  stage: string;
  total_events: number;
  events_per_sec: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  error_rate: number;
  status: string;
}

export interface InsightFlowBucketStatus {
  sync_percent: number;
  stages_synced: string[];
  last_sync_utc: string;
  pending_writes: number;
  failed_writes: number;
}
