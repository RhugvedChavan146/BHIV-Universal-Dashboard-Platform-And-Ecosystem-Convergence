// ─── Official Runtime Integration API contracts ───────────────────────────────
// Source: SHAKTI Runtime Integration team
// Configured via VITE_CONTROL_PLANE_URL in .env

// ─── GET /health ──────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

// ─── GET /system/status ───────────────────────────────────────────────────────

export interface ComponentStatus {
  name: string;
  status: string;          // "operational" | "degraded" | "offline" | "warning" | "healthy" | "CRASH_LOOPING"
  last_check: string;      // ISO 8601
  response_time_ms: number | null;
  details: string;
  pid?: number;
  port?: number;
  restarts?: number;
}

export interface SystemStatusResponse {
  overall_status: string;  // "operational" | "degraded" | "offline" | "ok"
  timestamp: string;
  components: ComponentStatus[];
  uptime_seconds?: number;
  shutting_down?: boolean;
  active_alerts?: number;
  services?: Record<string, {
    status: string;
    pid?: number;
    port?: number;
    restarts?: number;
    last_restart_at?: string;
    healthy?: boolean;
  }>;
}

// ─── GET /metrics ─────────────────────────────────────────────────────────────

export interface MetricsResponse {
  timestamp: string;
  uptime_seconds?: number;
  services?: {
    total: number;
    healthy: number;
    degraded: number;
  };
  requests?: {
    total: number;
    errors: number;
    per_minute: number;
    error_rate_pct: number;
    success_rate_pct: number;
  };
  latency_ms?: {
    p50: number;
    p95: number;
  };
  alerts?: {
    active_count: number;
    by_severity?: Record<string, number>;
  };
  replay?: {
    total_replays?: number;
    failed_replays?: number;
    queue_depth: number;
  };
  per_service_snapshots?: Record<string, any>;
  // Legacy & derived fields for component backward-compatibility
  period_seconds?: number;
  total_requests?: number;
  successful_requests?: number;
  failed_requests?: number;
  success_rate?: number | null;
  average_response_time_ms?: number | null;
  active_sessions?: number;
  events_processed?: number;
  alerts_generated?: number;
  cache_hit_rate?: number | null;
}

// ─── GET /dashboard/executive ─────────────────────────────────────────────────

export interface ExecutiveSummaryItem {
  metric: string;
  value: string | number;
  status: string;          // "normal" | "warning" | "critical"
  trend: string;           // "up" | "down" | "stable"
  description: string;
}

export interface ExecutiveDashboardResponse {
  timestamp: string;
  summary: ExecutiveSummaryItem[];
  key_metrics: Record<string, string | number | null>;
  alerts_count: number;
  active_sessions: number;
}

// ─── GET /dashboard/operations ────────────────────────────────────────────────

export interface OperationItem {
  id: string;
  type: string;
  status: string;          // "running" | "completed" | "failed" | "pending" | "paused" | "healthy" | "CRASH_LOOPING"
  priority: string;        // "critical" | "high" | "medium" | "low"
  started_at: string;
  description: string;
  progress: number;        // 0–100
  agent: string;
}

export interface OperationsDashboardResponse {
  timestamp: string;
  active_operations: number;
  operations: OperationItem[];
  system_load: number;     // 0–100
  queue_depth: number;
  pipeline?: {
    total_traces?: number;
    total_artifacts?: number;
    artifacts_by_type?: Record<string, number>;
    storage_size_mb?: number;
    recent_traces?: any[];
  };
  requests?: {
    total: number;
    errors: number;
    per_minute: number;
    error_rate_pct: number;
    success_rate_pct: number;
  };
  latency_ms?: {
    p50: number;
    p95: number;
  };
  replay?: {
    total_replays?: number;
    failed_replays?: number;
  };
  runtime_services?: Record<string, {
    status: string;
    pid?: number;
    port?: number;
    restarts?: number;
    last_restart_at?: string;
  }>;
  per_service_snapshots?: Record<string, any>;
}

// ─── GET /dashboard/alerts ────────────────────────────────────────────────────

export interface AlertItem {
  id: string;
  severity: string;        // "critical" | "high" | "medium" | "low" | "info"
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  category: string;
}

export interface AlertsDashboardResponse {
  timestamp: string;
  total_alerts: number;
  unacknowledged: number;
  alerts: AlertItem[];
  alert_summary: Record<string, number>;
  by_severity?: Record<string, number>;
  by_status?: Record<string, number>;
}

// ─── GET /dashboard/runtime ───────────────────────────────────────────────────

export interface RuntimeSession {
  session_id: string;
  status: string;          // "active" | "idle" | "completed" | "failed" | "healthy" | "CRASH_LOOPING"
  started_at: string;
  last_activity: string;
  events_processed: number;
  current_operation: string | null;
  progress: number;        // 0–100
}

export interface RuntimeDashboardResponse {
  timestamp: string;
  generated_at?: string;
  uptime_seconds?: number;
  shutting_down?: boolean;
  services?: Record<string, {
    status: string;
    pid?: number;
    port?: number;
    restarts?: number;
    last_restart_at?: string;
  }>;
  summary?: {
    total: number;
    healthy: number;
    degraded: number;
  };
  active_sessions: number;
  total_events_processed: number;
  system_status: string;
  sessions: RuntimeSession[];
  performance: {
    avg_response_time_ms: number;
    events_per_second: number;
    queue_depth: number;
  };
}

// ─── GET /dashboard/telemetry ─────────────────────────────────────────────────

export interface TelemetryDataPoint {
  timestamp: string;
  value: number;
  metric: string;
}

export interface TelemetryDashboardResponse {
  timestamp: string;
  metrics: {
    response_times: TelemetryDataPoint[];
    event_rates: TelemetryDataPoint[];
    error_rates: TelemetryDataPoint[];
    system_load: TelemetryDataPoint[];
  };
  summary: {
    avg_response_time: number;
    peak_response_time: number;
    total_events: number;
    error_rate: number;
    uptime_percentage: number;
  };
  insightflow?: {
    total_events?: number;
    by_component?: Record<string, number>;
    by_event_type?: Record<string, number>;
    recent_events?: any[];
  };
  recent_telemetry?: {
    trace_id: string;
    telemetry: {
      source_id: string;
      metric: string;
      value: number;
      unit: string;
      timestamp: string;
      trace_id: string;
      source_module_id: string;
      status: string;
    } | null;
    signal: {
      signal_id: string;
      trace_id: string;
      metric: string;
      value: number;
      unit: string;
      classification: string;
      threshold_breached: boolean;
      derived_at: string;
      source_module_id: string;
      status: string;
      prompt: string;
    } | null;
  }[];
  classification_breakdown?: Record<string, number>;
  per_trace_telemetry?: any[];
  thresholds?: Record<string, any>;
}

// ─── GET /registry/repositories (BHEX Operational Surface) ────────────────────

export interface RepositoryRegistryItem {
  repository: string;
  owner: string;
  layer: string;
  capability: string;
  branch: string;
  status: string;
  last_commit: string;
  last_activity: string;
  review_status: string;
  migration_status: string;
  documentation_status: string;
  integration_status: string;
}

export interface RepositoryRegistryResponse {
  timestamp: string;
  total_repositories: number;
  repositories: RepositoryRegistryItem[];
}

// ─── GET /registry/builds (BHEX Operational Surface) ──────────────────────────

export interface BuildRegistryItem {
  build_id: string;
  repository: string;
  branch: string;
  pipeline_status: string;
  build_duration: string | number;
  deployment_status: string;
  evidence: string;
  release_readiness: string;
}

export interface BuildRegistryResponse {
  timestamp: string;
  total_builds: number;
  builds: BuildRegistryItem[];
}

// ─── GET /queue/migration (Operational Migration Queue) ─────────────────────

export interface MigrationQueueItem {
  migration_token: string;
  repository: string;
  assigned_engineer: string;
  current_stage: string;
  progress: number;
  blocked_reason: string | null;
  evidence_submitted: boolean | string;
  review_status: string;
}

export interface MigrationQueueResponse {
  timestamp: string;
  total_migrations: number;
  migrations: MigrationQueueItem[];
}

// ─── GET /queue/review (Operational Review Queue) ────────────────────────────

export interface ReviewQueueItem {
  submission: string;
  engineer: string;
  reviewer: string;
  review_status: string;
  testing_status: string;
  required_fixes: number | string;
  priority: string;
}

export interface ReviewQueueResponse {
  timestamp: string;
  total_reviews: number;
  reviews: ReviewQueueItem[];
}

// ─── GET /registry/capabilities (BHEX Capability Registry) ───────────────────

export interface CapabilityRegistryItem {
  capability_name: string;
  layer: string;
  consumers: string[] | number | string;
  providers: string[] | number | string;
  owner: string;
  repository: string;
  version: string;
  runtime_health: string;
  integration_status: string;
}

export interface CapabilityRegistryResponse {
  timestamp: string;
  total_capabilities: number;
  capabilities: CapabilityRegistryItem[];
}

// ─── GET /registry/executions (BHIV Execution Registry) ──────────────────────

export interface ExecutionStep {
  name: string;
  status: string;           // "completed" | "active" | "pending" | "failed"
}

export interface ExecutionRegistryItem {
  execution_id: string;
  workflow: string;
  status: string;            // "running" | "completed" | "failed" | "pending" | "paused"
  priority: string;          // "critical" | "high" | "medium" | "low"
  started_at: string;
  description: string;
  progress: number;          // 0–100
  agent: string;
  steps: ExecutionStep[];
  /** Correlates this execution into a cross-service trace lineage, when known. */
  trace_id?: string | null;
}

export interface ExecutionRegistryResponse {
  timestamp: string;
  active_executions: number;
  executions: ExecutionRegistryItem[];
}

// ─── GET /registry/replays (BHIV Replay Registry) ─────────────────────────────

export interface ReplayRegistryItem {
  replay_id: string;
  status: string;            // "active" | "running" | "completed" | "success" | "failed" | "error" | "idle"
  source_trace_id?: string | null;
  current_operation: string | null;
  started_at: string;
  completed_at?: string | null;
  events_processed: number;
  progress: number;          // 0–100
}

export interface ReplayRegistryResponse {
  timestamp: string;
  active_replays: number;
  replays: ReplayRegistryItem[];
}

// ─── GET /operations/employee-execution ──────────────────────────────────────

export interface EmployeeExecutionItem {
  engineer: string;
  current_task: string;
  current_product: string;
  progress: number;
  blocked: boolean | string;
  last_activity: string;
  todays_contribution: string | number;
}

export interface EmployeeExecutionResponse {
  timestamp: string;
  total_engineers: number;
  engineers: EmployeeExecutionItem[];
}

// ─── GET /operations/engineering-capacity ────────────────────────────────────

export interface EngineeringCapacityResponse {
  timestamp: string;
  active_developers?: number;
  available_developers?: number;
  blocked_developers?: number;
  review_pending?: number;
  testing_pending?: number;
  deployment_pending?: number;
  engineers?: any[];
}

// ─── GET /operations/delivery-intelligence ───────────────────────────────────

export interface DeliveryIntelligenceResponse {
  timestamp: string;
  completed_tasks?: number;
  delayed_tasks?: number;
  upcoming_deliveries?: number;
  sprint_health?: string;
  execution_velocity?: number | string;
  repository_activity?: string | number;
  deliveries?: any[];
}
