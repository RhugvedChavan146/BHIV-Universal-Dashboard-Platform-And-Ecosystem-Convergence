# API.md — REST Contract (SHAKTI ↔ BHIV Backend Services)

**Status: STABLE.** This is the endpoint-by-endpoint catalog behind
[`CAPABILITY_CONTRACT.md`](./CAPABILITY_CONTRACT.md) §1. It documents the
REST surface `apps/shakti`'s typed API clients already consume — **no
client, route, or type was changed to produce this document.**

Machine-readable mirror: `apps/shakti/src/api/contract.ts`
(`ALL_SHAKTI_API_ENDPOINTS`, one array per service, and the single
aggregated `SHAKTI_API_CONTRACT` export — see `CAPABILITY_CONTRACT.md` §8).
Keep the two in sync — see [What changed](#what-changed) in
`CAPABILITY_CONTRACT.md`.

The dashboard **platform** (`@bhiv/dashboard-sdk`) owns none of these
routes — it is a transport-agnostic frontend SDK. Every endpoint below is
owned by a BHIV backend service and wrapped by one of `apps/shakti/src/api/*.ts`.
A future BHIV product can wire its own equivalent typed clients into the
same `RuntimeConnector` / `ServiceObservability` seams (see
`CAPABILITY_CONTRACT.md` §6) without touching the SDK.

**Conventions that apply to every endpoint in this document:**

- All requests are `GET`. There are no mutating (`POST`/`PUT`/`PATCH`/`DELETE`)
  calls anywhere in the current client surface.
- All base URLs come from Vite env vars (`import.meta.env.VITE_*`),
  resolved at build/dev-server time — see each service's table for its
  variable name(s) and default.
- Response bodies are read defensively: every client backfills
  missing/renamed fields with `??` fallbacks rather than trusting the raw
  payload shape, and several services additionally catch network/HTTP
  failures and return a typed empty/default value (see the **Resilient
  fallback** column and [Error handling](#error-handling-per-service)).
- Where a response carries an `x-trace-id` / `traceparent` / `x-request-id`
  / `x-execution-id` header, it is copied onto the parsed body as
  `trace_id` by a response interceptor, for cross-service correlation via
  `buildTraceLineage()`.

---

## 1. Control Plane

**Client:** `apps/shakti/src/api/client.ts` (axios instance) +
`apps/shakti/src/api/endpoints.ts` (fetch functions)
**Base URL:** `VITE_CONTROL_PLANE_URL` (default: `""`, i.e. same-origin)
**Timeout:** 250,000 ms · **Headers:** `Content-Type: application/json`

| Method | Path | Client fn | Response type | Normalizes | Resilient fallback |
|---|---|---|---|---|---|
| GET | `/health` | `fetchHealth` | `HealthResponse` | No | No |
| GET | `/system/status` | `fetchSystemStatus` | `SystemStatusResponse` | Yes — derives `components[]` from `services{}` if the backend omits `components` | No |
| GET | `/metrics` | `fetchMetrics` | `MetricsResponse` | Yes — derives top-level counters from nested `requests`/`latency_ms`/`alerts` if omitted | No |
| GET | `/dashboard/executive` | `fetchExecutiveDashboard` | `ExecutiveDashboardResponse` | No | No |
| GET | `/dashboard/operations` | `fetchOperationsDashboard` | `OperationsDashboardResponse` | Yes — derives `operations[]` from `runtime_services{}` | No |
| GET | `/dashboard/alerts` | `fetchAlertsDashboard` | `AlertsDashboardResponse` | Yes — derives `total_alerts`/`unacknowledged` from `alerts[]` | No |
| GET | `/dashboard/runtime` | `fetchRuntimeDashboard` | `RuntimeDashboardResponse` | Yes — derives `sessions[]` from `services{}` | No |
| GET | `/dashboard/telemetry` | `fetchTelemetryDashboard` | `TelemetryDashboardResponse` | Yes — backfills `metrics`/`summary`/`recent_telemetry` defaults | No |
| GET | `/registry/repositories` | `fetchRepositoryRegistry` | `RepositoryRegistryResponse` | No | No |
| GET | `/registry/builds` | `fetchBuildRegistry` | `BuildRegistryResponse` | No | No |
| GET | `/queue/migration` | `fetchMigrationQueue` | `MigrationQueueResponse` | No | No |
| GET | `/queue/review` | `fetchReviewQueue` | `ReviewQueueResponse` | No | No |
| GET | `/registry/capabilities` | `fetchCapabilityRegistry` | `CapabilityRegistryResponse` | No | No |
| GET | `/registry/executions` | `fetchExecutionRegistry` | `ExecutionRegistryResponse` | Yes — derives `active_executions` count | No |
| GET | `/registry/replays` | `fetchReplayRegistry` | `ReplayRegistryResponse` | Yes — derives `active_replays` count | No |
| GET | `/operations/employee-execution` | `fetchEmployeeExecution` | `EmployeeExecutionResponse` | Yes | **Yes** — falls back to NIYANTRAN `attendance-summary`, then an empty `{ engineers: [] }` |
| GET | `/operations/engineering-capacity` | `fetchEngineeringCapacity` | `EngineeringCapacityResponse` | Yes | **Yes** — falls back to NIYANTRAN `leaderboard`, then a zeroed default |
| GET | `/operations/delivery-intelligence` | `fetchDeliveryIntelligence` | `DeliveryIntelligenceResponse` | Yes | **Yes** — falls back to NIYANTRAN `aims`, then an empty default |

**Example response — `HealthResponse` (`GET /health`):**

```json
{ "status": "ok", "timestamp": "2026-08-06T04:00:00Z", "version": "1.4.2" }
```

**Example response — `SystemStatusResponse` (`GET /system/status`)**, showing
the two backend shapes the client reconciles (`components[]` directly, or a
`services{}` map it derives `components[]` from):

```json
{
  "overall_status": "operational",
  "timestamp": "2026-08-06T04:00:00Z",
  "components": [
    { "name": "bucket", "status": "operational", "last_check": "...", "response_time_ms": 42, "details": "PID: 1234, Restarts: 0" }
  ]
}
```

Full field-level shapes for every response type above are defined in
`apps/shakti/src/types/runtime.ts`.

## 2. Bucket

**Client:** `apps/shakti/src/api/bucketEndpoints.ts`
**Base URL:** `VITE_BUCKET_SERVICE_URL` ?? `VITE_BUCKET_URL` (default: `""`)
**Timeout:** 15,000 ms

| Method | Path | Client fn | Response type | Query params |
|---|---|---|---|---|
| GET | `/bucket/artifacts` | `fetchBucketArtifacts` | `BucketArtifactsResponse` | `limit` (default 50), `offset` (default 0), `trace_id?` |
| GET | `/bucket/storage-stats` | `fetchBucketStorageStats` | `BucketStorageStatsResponse` | — |
| GET | `/bucket/chain-state` | `fetchBucketChainState` | `BucketChainStateResponse` | — |
| GET | `/health` | `fetchBucketHealth` | `BucketHealthResponse` | — |
| GET | `/audit/recent` | `fetchAuditRecent` | `AuditRecentResponse` | `limit` (default 20) |
| GET | `/audit/failed` | `fetchAuditFailed` | `AuditRecentResponse` | `limit` (default 20) |
| GET | `/metrics/scale-status` | `fetchMetricsScaleStatus` | `MetricsScaleStatusResponse` | — |
| GET | `/metrics/query-performance` | `fetchMetricsQueryPerformance` | `MetricsQueryPerformanceResponse` | — |
| GET | `/metrics/alerts` | `fetchMetricsAlerts` | `MetricsAlertsResponse` | — |
| GET | `/constitutional/status` | `fetchConstitutionalStatus` | `ConstitutionalStatusResponse` | — |

Types defined in `apps/shakti/src/types/bucket.ts`. This client does not
attach a request interceptor or auth header — the Bucket service is
expected to be reachable without credentials in current deployments.

## 3. InsightFlow

**Client:** `apps/shakti/src/api/insightflowEndpoints.ts`
**Base URL:** `VITE_INSIGHTFLOW_URL` (default: `http://localhost:8000`)
**Timeout:** 15,000 ms · **Headers:** `ngrok-skip-browser-warning: true` (dev tunneling)

| Method | Path | Client fn | Response type | Resilient fallback |
|---|---|---|---|---|
| GET | `/health` | `fetchInsightFlowHealth` | `InsightFlowHealthResponse` | **Yes** — `{ status: "OFFLINE", uptime_seconds: 0, error_count_60s: 0 }` |
| GET | `/stage-metrics` | `fetchInsightFlowStageMetrics` | `InsightFlowStageMetric[]` | **Yes** — `[]` |
| GET | `/bucket/status` | `fetchInsightFlowBucketStatus` | `InsightFlowBucketStatus` | **Yes** — zeroed sync/pending/failed counters |

Types defined in `apps/shakti/src/types/insightflow.ts`. Every function in
this client catches its own errors — none of them throw to the caller.

## 4. NIYANTRAN

**Client:** `apps/shakti/src/api/niyantranEndpoints.ts`
**Base URL:** `VITE_NIYANTRAN_URL` (default: `http://localhost:5000`)
**Timeout:** 15,000 ms
**Auth:** request interceptor attaches `x-auth-token` (from
`VITE_NIYANTRAN_AUTH_TOKEN`, else `localStorage["x-auth-token"]`) and
`x-execution-key` (from `VITE_NIYANTRAN_EXECUTION_KEY`, default
`"niyantran-dev-exec-key"`).

| Method | Path | Client fn | Response type | Query params |
|---|---|---|---|---|
| GET | `/api/dashboard/stats` | `fetchNiyantranStats` | `NiyantranDashboardStats` | — |
| GET | `/api/dashboard/tasks-overview` | `fetchNiyantranTasksOverview` | `NiyantranTasksOverview` | — |
| GET | `/api/dashboard/departments` | `fetchNiyantranDepartments` | `NiyantranDepartmentStat[]` | — |
| GET | `/api/dashboard/leaderboard` | `fetchNiyantranLeaderboard` | `NiyantranLeaderboardUser[]` | — |
| GET | `/api/dashboard/attendance-summary` | `fetchNiyantranAttendanceSummary` | `NiyantranAttendanceSummary` | `startDate?`, `endDate?`, `departmentId?`, `status?` |
| GET | `/api/dashboard/merge-analysis` | `fetchNiyantranMergeAnalysis` | `NiyantranMergeAnalysis` | `startDate?`, `endDate?`, `departmentId?` |
| GET | `/api/tantra/execution/{executionId}/history` | `fetchNiyantranExecutionHistory` | `NiyantranTantraExecutionHistory` | — (path param) |
| GET | `/api/aims` | `fetchNiyantranAims` | `NiyantranAim[]` | — |
| GET | `/api/enhanced-aims/with-progress` | `fetchNiyantranEnhancedAims` | `NiyantranAim[]` | — |
| GET | `/api/alerts` | `fetchNiyantranAlerts` | `NiyantranAlert[]` | — |
| GET | `/api/submissions` | `fetchNiyantranSubmissions` | `NiyantranSubmission[]` | `page=1`, `limit=20` |
| GET | `/api/tasks` | `fetchNiyantranTasks` | `NiyantranTask[]` | `page=1`, `limit=20` |
| GET | `/api/attendance-dashboard/locations` | `fetchNiyantranLiveLocations` | `NiyantranLiveLocationUser[]` | `date?`, `department?` |

Types defined in `apps/shakti/src/types/niyantran.ts`. Every function in
this client catches its own errors and returns a typed empty default — see
the inline `BUG #n FIX` comments in the source for the specific
backend-shape quirks each unwrap handles (e.g. `/api/submissions` unwraps
`response.submissions`, `/api/tasks` unwraps `response.tasks`,
`/api/enhanced-aims/with-progress` unwraps `response.data`).

## 5. PRANA

**Client:** `apps/shakti/src/api/pranaEndpoints.ts`
**Base URL:** `VITE_PRANA_SERVICE_URL` ?? `VITE_PRANA_URL` (default: `""`)
**Timeout:** 10,000 ms

| Method | Path | Client fn | Response type | Query params |
|---|---|---|---|---|
| GET | `/health` | `fetchPranaHealth` | `PranaHealthResponse` | — |
| GET | `/prana/system/health` | `fetchPranaSystemHealth` | `PranaSystemHealthResponse` | — |
| GET | `/prana/propagation-log` | `fetchPranaPropagationLog` | `PranaPropagationLogResponse` | `limit` (default 50) |

Types defined in `apps/shakti/src/types/prana.ts`. `fetchPranaPropagationLog`
normalizes both a bare-array backend response and a `{ logs: [...] }`
wrapper into one `PranaPropagationLogResponse` shape.

---

## Error handling per service

| Service | On 404 | On network error | On timeout | On 401/403 | Throws to caller? |
|---|---|---|---|---|---|
| Control Plane | Logged warning, rejected with a clearer `Error` | Logged error, rejected with a clearer `Error` | Logged error, rejected with a clearer `Error` | n/a | **Yes**, except the three `operations/*` functions, which catch and fall back to NIYANTRAN |
| Bucket | Propagates raw axios error | Propagates raw axios error | Propagates raw axios error | n/a | Yes — no interceptor/try-catch in this client |
| InsightFlow | Logged warning | Logged error | Logged error | n/a | **No** — every function catches and returns a resilient default |
| NIYANTRAN | Logged warning | Logged error | Logged error | Logged warning | **No** — every function catches and returns a resilient default |
| PRANA | Propagates raw axios error | Propagates raw axios error | Propagates raw axios error | n/a | Yes — no interceptor/try-catch in this client |

See `CAPABILITY_CONTRACT.md` §5 for the normalized error code contract
(`ENDPOINT_NOT_FOUND`, `SERVICE_UNAVAILABLE`, `REQUEST_TIMEOUT`,
`NETWORK_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`) these behaviors map onto, and
the recommended handling for each.

## Adding a new endpoint (backward-compatible)

1. Add the response type to the owning service's `apps/shakti/src/types/*.ts`
   file — new fields optional, existing fields untouched.
2. Add the fetch function to the matching `apps/shakti/src/api/*.ts` client,
   following that file's existing normalization/resilience pattern.
3. Add a row to this file's matching service table, and an entry to the
   matching array in `apps/shakti/src/api/contract.ts`.
4. If the widget consuming it should be independently discoverable/gated,
   register it via `WidgetRegistry` and declare its `capabilities` — see
   `CAPABILITY_CONTRACT.md` §6.

This keeps the platform plug-and-play: a new endpoint never requires
changing `@bhiv/dashboard-sdk`, `@bhiv/dashboard-layout`, or any other
service's client.

---

*Companion document: [`CAPABILITY_CONTRACT.md`](./CAPABILITY_CONTRACT.md) ·
Architecture background: [`RUNTIME_IDENTITY.md`](./RUNTIME_IDENTITY.md)*
