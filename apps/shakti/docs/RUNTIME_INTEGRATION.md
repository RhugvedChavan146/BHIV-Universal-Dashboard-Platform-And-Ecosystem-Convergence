# Runtime Integration

The frontend operates completely decoupled from backend constraints, but it relies on a standardized set of Control Plane APIs to retrieve data.

## API Architecture
All API calls are brokered through an Axios instance (`src/api/client.ts`) and wrapped in TanStack React Query (`src/hooks/useQueries.ts`).

### The Axios Client
The client intercepts every response.
- **Timeout:** Hardcoded at 8000ms.
- **Error Interception:** 404, 503, and ECONNABORTED are caught and forwarded to the frontend `logger.ts`.
- **Global Error Handling:** Promise rejections are safely propagated back to React Query for retry logic.

### React Query Hooks
Every dashboard zone has a corresponding custom hook, backed by a typed service function in `src/api/endpoints.ts` and a typed contract in `src/types/runtime.ts`:
- `useExecutiveDashboard()` -> `GET /dashboard/executive`
- `useOperationsDashboard()` -> `GET /dashboard/operations`
- `useAlertsDashboard()` -> `GET /dashboard/alerts`
- `useRuntimeDashboard()` -> `GET /dashboard/runtime`
- `useTelemetryDashboard()` -> `GET /dashboard/telemetry`
- `useCapabilityRegistry()` -> `GET /registry/capabilities` (BHIV Capability Registry)
- `useExecutionRegistry()` -> `GET /registry/executions` (BHIV Execution Registry — powers the Workflows zone)
- `useReplayRegistry()` -> `GET /registry/replays` (BHIV Replay Registry — powers the Replay zone)

Bucket (artifact/audit storage) and InsightFlow (telemetry/event stream) are separate services with their own typed clients — see `src/api/bucketEndpoints.ts` / `src/hooks/useBucketQueries.ts` and `src/api/insightflowEndpoints.ts` / `src/hooks/useInsightFlowQueries.ts` respectively.

### Resilience Mechanism (`keepPreviousData`)
All hooks are configured with `@tanstack/react-query`'s `placeholderData: keepPreviousData`. 
If a polling interval triggers and the backend is down, React Query will fail the request, but the hook will **continue returning the last cached `data` object**. The `isError` flag flips to true, allowing the UI to render an "Offline / Cached Data" warning without destroying the existing rendered components.

## Shared Runtime Infrastructure (`@bhiv/dashboard-sdk/runtime`)
Product-agnostic building blocks any BHIV product can reuse instead of re-deriving connectivity/lineage per widget:
- **`RuntimeConnector`** — polls today via any `poll()` function and exposes a transport-agnostic `subscribe()`. Attaching a `RuntimeStreamTransport` (WebSocket/SSE) later upgrades delivery to push without changing any consumer.
- **`ServiceObservabilityProvider` / `useReportServiceHealth` / `useServiceObservability`** — cross-service connectivity aggregation. Each real query hook reports its own state (`useServiceObservabilityPublisher.ts`); nothing is inferred. Rendered in the header via `ServiceObservabilityStrip` as a compact per-state dot count.
- **`buildTraceLineage`** — correlates records sharing a `trace_id` across any typed sources (Execution Registry, Replay Registry, Bucket artifacts, PRANA propagation log, audit records). Used by `EvidenceLayout`'s "Provenance Lineage" panel — one correlation implementation instead of a per-widget lookup.

## BHIV Ecosystem Connectors (`src/config/ecosystemConnectors.ts`)
`resolveEcosystemConnectors()` is the single declarative registry for every BHIV ecosystem system — PRANA, BHEX (Bucket), Karma, SETU, InsightFlow, MASTERDB, Workflow Executor, Capability Registry, Execution Engine, plus AKASHIC, SAAKSHI, SANSKAR, ARTHA, SAMACHAR, AIAIC, and NAMAMI GANGE. Systems with a real typed service or a matching `/system/status` component report real state; the remaining systems are registered with `status: "pending"` (no fabricated data) so they're visible and ready to wire up. `OperationsLayout`'s capability grid and `useServiceObservabilityPublisher` (header strip) both read from this one registry — adding or connecting a system means editing this one file.

## Configuration-Driven Composition
`Dashboard.tsx` composes the page entirely from `dashboard.config.ts` and the shared registry/layout engines — no hardcoded zone list:
- **Zones/layout** — `registerShaktiDashboard()` registers every widget once; `useProductLayout()` resolves the visible, role-filtered zone list (JSON-shaped `LayoutZoneDefinition[]`); `useLayoutEngine()`/`DashboardGrid` (from `@bhiv/dashboard-layout`) render and persist it.
- **Theme** — `dashboard.config.ts#theme.mode` drives `DashboardProvider`'s built-in `ThemeProvider` (`packages/dashboard-sdk/src/theme`).
- **Navigation** — `dashboard.config.ts#navigation.items` seeds a dedicated `NavigationEngine` instance (`src/config/navigation.ts`), rendered by `SectionNav` below the header; each item's `path` matches a zone id and scrolls to `#zone-<id>` (stamped by `LayoutZone`).
- **Permissions** — role/capability filtering happens inside `useProductLayout(..., { context: { role: user?.role } })`, driven by each widget's registered requirements, not per-component checks.
