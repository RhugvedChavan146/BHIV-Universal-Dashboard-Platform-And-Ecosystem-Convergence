// ─── SHAKTI REST API Contract — Machine-Readable Mirror ───────────────────────
// Typed manifest of every REST endpoint wrapped by this app's API clients
// (client.ts, bucketEndpoints.ts, insightflowEndpoints.ts,
// niyantranEndpoints.ts, pranaEndpoints.ts). Mirrors `/API.md`. Pure data —
// no side effects, imported by nothing else in the app. It does not gate,
// wrap, or alter any existing client or fetch function; it exists so the
// endpoint surface can be introspected/diffed by tooling (e.g. a CI check
// that a new fetch function was documented here and in /API.md).
//
// Follows the same "documentation-as-code, additive-only" pattern as
// `@bhiv/dashboard-sdk`'s `registry/runtimeIdentity.ts` and
// `contract/capabilityContract.ts` — keep all three in sync with reality.

import type { RestEndpointContract } from "@bhiv/dashboard-sdk";

export const SHAKTI_API_CONTRACT_VERSION = "1.0.0";

// ─── Control Plane — apps/shakti/src/api/{client,endpoints}.ts ────────────────
// Base URL: VITE_CONTROL_PLANE_URL. All GET, read-only, polled via TanStack
// Query (see apps/shakti/src/hooks/useQueries.ts for interval per endpoint).

export const CONTROL_PLANE_ENDPOINTS: RestEndpointContract[] = [
  { service: "control-plane", method: "GET", path: "/health", clientFn: "fetchHealth", responseType: "HealthResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/system/status", clientFn: "fetchSystemStatus", responseType: "SystemStatusResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/metrics", clientFn: "fetchMetrics", responseType: "MetricsResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/dashboard/executive", clientFn: "fetchExecutiveDashboard", responseType: "ExecutiveDashboardResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/dashboard/operations", clientFn: "fetchOperationsDashboard", responseType: "OperationsDashboardResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/dashboard/alerts", clientFn: "fetchAlertsDashboard", responseType: "AlertsDashboardResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/dashboard/runtime", clientFn: "fetchRuntimeDashboard", responseType: "RuntimeDashboardResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/dashboard/telemetry", clientFn: "fetchTelemetryDashboard", responseType: "TelemetryDashboardResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/registry/repositories", clientFn: "fetchRepositoryRegistry", responseType: "RepositoryRegistryResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/registry/builds", clientFn: "fetchBuildRegistry", responseType: "BuildRegistryResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/queue/migration", clientFn: "fetchMigrationQueue", responseType: "MigrationQueueResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/queue/review", clientFn: "fetchReviewQueue", responseType: "ReviewQueueResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/registry/capabilities", clientFn: "fetchCapabilityRegistry", responseType: "CapabilityRegistryResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/registry/executions", clientFn: "fetchExecutionRegistry", responseType: "ExecutionRegistryResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/registry/replays", clientFn: "fetchReplayRegistry", responseType: "ReplayRegistryResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/operations/employee-execution", clientFn: "fetchEmployeeExecution", responseType: "EmployeeExecutionResponse", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/operations/engineering-capacity", clientFn: "fetchEngineeringCapacity", responseType: "EngineeringCapacityResponse", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "control-plane", method: "GET", path: "/operations/delivery-intelligence", clientFn: "fetchDeliveryIntelligence", responseType: "DeliveryIntelligenceResponse", normalizes: true, resilientFallback: true, stability: "stable" },
];

// ─── Bucket — apps/shakti/src/api/bucketEndpoints.ts ───────────────────────────
// Base URL: VITE_BUCKET_SERVICE_URL ?? VITE_BUCKET_URL. All GET, read-only.

export const BUCKET_ENDPOINTS: RestEndpointContract[] = [
  { service: "bucket", method: "GET", path: "/bucket/artifacts", clientFn: "fetchBucketArtifacts", responseType: "BucketArtifactsResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/bucket/storage-stats", clientFn: "fetchBucketStorageStats", responseType: "BucketStorageStatsResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/bucket/chain-state", clientFn: "fetchBucketChainState", responseType: "BucketChainStateResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/health", clientFn: "fetchBucketHealth", responseType: "BucketHealthResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/audit/recent", clientFn: "fetchAuditRecent", responseType: "AuditRecentResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/audit/failed", clientFn: "fetchAuditFailed", responseType: "AuditRecentResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/metrics/scale-status", clientFn: "fetchMetricsScaleStatus", responseType: "MetricsScaleStatusResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/metrics/query-performance", clientFn: "fetchMetricsQueryPerformance", responseType: "MetricsQueryPerformanceResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/metrics/alerts", clientFn: "fetchMetricsAlerts", responseType: "MetricsAlertsResponse", normalizes: true, resilientFallback: false, stability: "stable" },
  { service: "bucket", method: "GET", path: "/constitutional/status", clientFn: "fetchConstitutionalStatus", responseType: "ConstitutionalStatusResponse", normalizes: false, resilientFallback: false, stability: "stable" },
];

// ─── InsightFlow — apps/shakti/src/api/insightflowEndpoints.ts ────────────────
// Base URL: VITE_INSIGHTFLOW_URL (default http://localhost:8000). All GET,
// read-only; every function catches and returns a safe default on failure.

export const INSIGHTFLOW_ENDPOINTS: RestEndpointContract[] = [
  { service: "insightflow", method: "GET", path: "/health", clientFn: "fetchInsightFlowHealth", responseType: "InsightFlowHealthResponse", normalizes: false, resilientFallback: true, stability: "stable" },
  { service: "insightflow", method: "GET", path: "/stage-metrics", clientFn: "fetchInsightFlowStageMetrics", responseType: "InsightFlowStageMetric[]", normalizes: false, resilientFallback: true, stability: "stable" },
  { service: "insightflow", method: "GET", path: "/bucket/status", clientFn: "fetchInsightFlowBucketStatus", responseType: "InsightFlowBucketStatus", normalizes: true, resilientFallback: true, stability: "stable" },
];

// ─── NIYANTRAN — apps/shakti/src/api/niyantranEndpoints.ts ────────────────────
// Base URL: VITE_NIYANTRAN_URL (default http://localhost:5000). Requires
// x-auth-token (VITE_NIYANTRAN_AUTH_TOKEN or localStorage) and
// x-execution-key headers. All GET, read-only; every function catches and
// returns a safe empty default on failure.

export const NIYANTRAN_ENDPOINTS: RestEndpointContract[] = [
  { service: "niyantran", method: "GET", path: "/api/dashboard/stats", clientFn: "fetchNiyantranStats", responseType: "NiyantranDashboardStats", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/dashboard/tasks-overview", clientFn: "fetchNiyantranTasksOverview", responseType: "NiyantranTasksOverview", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/dashboard/departments", clientFn: "fetchNiyantranDepartments", responseType: "NiyantranDepartmentStat[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/dashboard/leaderboard", clientFn: "fetchNiyantranLeaderboard", responseType: "NiyantranLeaderboardUser[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/dashboard/attendance-summary", clientFn: "fetchNiyantranAttendanceSummary", responseType: "NiyantranAttendanceSummary", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/dashboard/merge-analysis", clientFn: "fetchNiyantranMergeAnalysis", responseType: "NiyantranMergeAnalysis", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/tantra/execution/{executionId}/history", clientFn: "fetchNiyantranExecutionHistory", responseType: "NiyantranTantraExecutionHistory", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/aims", clientFn: "fetchNiyantranAims", responseType: "NiyantranAim[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/enhanced-aims/with-progress", clientFn: "fetchNiyantranEnhancedAims", responseType: "NiyantranAim[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/alerts", clientFn: "fetchNiyantranAlerts", responseType: "NiyantranAlert[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/submissions", clientFn: "fetchNiyantranSubmissions", responseType: "NiyantranSubmission[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/tasks", clientFn: "fetchNiyantranTasks", responseType: "NiyantranTask[]", normalizes: true, resilientFallback: true, stability: "stable" },
  { service: "niyantran", method: "GET", path: "/api/attendance-dashboard/locations", clientFn: "fetchNiyantranLiveLocations", responseType: "NiyantranLiveLocationUser[]", normalizes: true, resilientFallback: true, stability: "stable" },
];

// ─── PRANA — apps/shakti/src/api/pranaEndpoints.ts ─────────────────────────────
// Base URL: VITE_PRANA_SERVICE_URL ?? VITE_PRANA_URL. All GET, read-only.

export const PRANA_ENDPOINTS: RestEndpointContract[] = [
  { service: "prana", method: "GET", path: "/health", clientFn: "fetchPranaHealth", responseType: "PranaHealthResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "prana", method: "GET", path: "/prana/system/health", clientFn: "fetchPranaSystemHealth", responseType: "PranaSystemHealthResponse", normalizes: false, resilientFallback: false, stability: "stable" },
  { service: "prana", method: "GET", path: "/prana/propagation-log", clientFn: "fetchPranaPropagationLog", responseType: "PranaPropagationLogResponse", normalizes: true, resilientFallback: false, stability: "stable" },
];

/** Every documented REST endpoint across all five backend services, flattened for tooling that wants the whole surface at once. */
export const ALL_SHAKTI_API_ENDPOINTS: RestEndpointContract[] = [
  ...CONTROL_PLANE_ENDPOINTS,
  ...BUCKET_ENDPOINTS,
  ...INSIGHTFLOW_ENDPOINTS,
  ...NIYANTRAN_ENDPOINTS,
  ...PRANA_ENDPOINTS,
];

/**
 * Single aggregated export bundling the REST contract version, the flattened
 * endpoint list, and the per-service breakdown, for tooling that wants one
 * import instead of picking individual arrays. Pure re-grouping of the
 * constants already exported above — not a new source of truth.
 */
export const SHAKTI_API_CONTRACT = {
  version: SHAKTI_API_CONTRACT_VERSION,
  endpoints: ALL_SHAKTI_API_ENDPOINTS,
  byService: {
    controlPlane: CONTROL_PLANE_ENDPOINTS,
    bucket: BUCKET_ENDPOINTS,
    insightflow: INSIGHTFLOW_ENDPOINTS,
    niyantran: NIYANTRAN_ENDPOINTS,
    prana: PRANA_ENDPOINTS,
  },
} as const;
