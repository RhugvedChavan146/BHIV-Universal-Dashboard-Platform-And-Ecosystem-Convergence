// ─── Bucket Service TypeScript Contracts ──────────────────────────────────────
// Configured via VITE_BUCKET_SERVICE_URL in .env

export interface BucketArtifact {
  artifact_id: string;
  trace_id: string;
  timestamp_utc: string;
  schema_version: string;
  source_module_id: string;
  artifact_type: string;
  parent_hash?: string | null;
  hash?: string | null;
  payload?: Record<string, any>;
}

export interface BucketArtifactsResponse {
  artifacts: BucketArtifact[];
  count: number;
  total: number;
  offset: number;
  limit: number;
  storage_type: string;
  legacy_artifacts_available?: boolean;
}

export interface BucketStorageStatsResponse {
  statistics: {
    artifact_count: number;
    last_hash: string | null;
    log_file_size_bytes: number;
    log_file_size_mb: number;
    storage_path: string;
    schema_version: string;
    max_payload_size_mb: number;
  };
  status: string;
  certification: string;
}

export interface BucketChainStateResponse {
  chain_state: {
    last_hash: string | null;
    artifact_count: number;
  };
  status: string;
  storage_type: string;
}

export interface BucketHealthResponse {
  status: string;
  bucket_version?: string;
  append_only_storage?: {
    status: string;
    artifact_count: number;
    last_hash: string | null;
    log_size_mb: number;
    certification: string;
  };
  governance?: {
    gate_active: boolean;
    approved_integrations: number;
    certification: string;
    certification_date: string;
    constitutional_governance: string;
  };
  services?: Record<string, string>;
}

export interface AuditOperationItem {
  _id: string;
  timestamp: string;
  operation_type: string;
  artifact_id?: string;
  requester_id?: string;
  integration_id?: string;
  status: string;
  error?: string | null;
  data_before?: any;
  data_after?: any;
}

export interface AuditRecentResponse {
  operations: AuditOperationItem[];
}

export interface MetricsScaleStatusResponse {
  timestamp: string;
  concurrent_writes: {
    current: number;
    limit: number;
    percentage: number;
    status: string;
    alert: string | null;
    action_required: string | null;
  };
  storage: {
    status: string;
    usage_ratio: number;
    usage_percent: number;
    used_gb: number;
    total_gb: number;
    free_gb: number;
    action_required: string;
    escalation_path: string;
    response_timeline: string;
  };
  write_throughput?: {
    current_writes_per_sec: number;
    peak_writes_per_sec: number;
    avg_writes_per_sec: number;
  };
}

export interface MetricsQueryPerformanceResponse {
  p50_ms: number;
  p99_ms: number;
  p999_ms: number;
  queries_per_sec: number;
  timestamp?: string;
}

export interface MetricsAlertItem {
  alert_id: string;
  severity: string;
  message: string;
  timestamp: string;
  metric?: string;
  threshold?: number;
  current_value?: number;
}

export interface MetricsAlertsResponse {
  alerts: MetricsAlertItem[];
}

export interface ConstitutionalStatusResponse {
  status: string;
  enforcement: string;
  boundaries_locked: boolean;
  recent_violations_24h: number;
  critical_violations_24h: number;
  allowed_capabilities: number;
  prohibited_actions: number;
  input_channels: number;
  output_channels: number;
  certification: string;
  reference: string;
}
