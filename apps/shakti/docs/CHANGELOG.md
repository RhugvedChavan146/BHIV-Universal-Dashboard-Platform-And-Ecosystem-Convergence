# SHAKTI Command Center — Changelog

All notable changes to the SHAKTI Operational Command Center are documented in this file.

---

## [Unreleased] — 2026-08-02

### Registries: Execution & Replay
- Added `ExecutionRegistryItem`/`ExecutionRegistryResponse` and `ReplayRegistryItem`/`ReplayRegistryResponse` typed contracts (`src/types/runtime.ts`)
- Added `fetchExecutionRegistry()`/`fetchReplayRegistry()` (`src/api/endpoints.ts`) and `useExecutionRegistry()`/`useReplayRegistry()` hooks (`src/hooks/useQueries.ts`), hitting `GET /registry/executions` and `GET /registry/replays`
- `WorkflowLayout` now renders real per-execution `steps` from the Execution Registry instead of deriving synthetic step state from an Operations-dashboard progress heuristic
- `ReplayLayout` now reads from the Replay Registry instead of repurposing `useRuntimeDashboard()`'s generic runtime sessions under a `"Replay Service"` label
- Corrected `dashboard_architecture.md`'s stale claim of a mock-data fallback mode — the service layer has never had one; it now documents the actual typed-client-only / explicit-error-state behavior

### Shared Runtime Infrastructure
- New `@bhiv/dashboard-sdk` `runtime` module: `RuntimeConnector` (polling now, transport-agnostic `subscribe()` for future WebSocket/SSE upgrade), `ServiceObservabilityProvider`/`useReportServiceHealth`/`useServiceObservability` (cross-service connectivity aggregation), `buildTraceLineage` (generic trace correlation across typed sources)
- `useServiceObservabilityPublisher` reports each real service's health into the shared context; `ServiceObservabilityStrip` renders it in the header
- `EvidenceLayout` gained a "Provenance Lineage" panel correlating the active trace across Execution Registry, Replay Registry, Bucket artifacts, PRANA propagation, and audit records via `buildTraceLineage`

### Configuration-Driven Composition
- Added `theme` and `navigation` to the platform `DashboardConfig` contract (`@bhiv/dashboard-sdk`)
- `DashboardProvider`'s built-in `ThemeProvider` now defaults its mode from `overrides.theme.mode` → `defaultConfig.theme.mode` → `"dark"`, instead of a hardcoded `"dark"` literal
- `LayoutZone` (`@bhiv/dashboard-layout`) now stamps `id="zone-<id>"` on every rendered zone
- New `SectionNav` component + a dedicated `NavigationEngine` instance (`src/config/navigation.ts`), seeded from `dashboard.config.ts#navigation.items`, scrolling to the matching zone anchor — replaces the previously-unused `react-router-dom` dependency and the SDK's generic (unwired) `globalNavigationEngine` defaults

### BHIV Ecosystem Connectors
- New `src/config/ecosystemConnectors.ts` — one declarative registry (`resolveEcosystemConnectors()`) for every BHIV ecosystem system: PRANA, BHEX (Bucket), Karma, SETU, InsightFlow, MASTERDB, Workflow Executor, Capability Registry, and Execution Engine report real state; AKASHIC, SAAKSHI, SANSKAR, ARTHA, SAMACHAR, AIAIC, and NAMAMI GANGE are registered as `"pending"` (no backend endpoint configured yet — no fabricated data)
- `OperationsLayout`'s capability grid now reads from this registry instead of its own inline `findComp()` heuristics
- `useServiceObservabilityPublisher` reports the same registry into the header's cross-service strip, so both surfaces agree
- Added a `"pending"` `ConnectionState` to the shared runtime types
- `ServiceObservabilityStrip` reworked from a per-service label list into a compact per-state dot count (with a hover tooltip for the full breakdown), since the ecosystem registry alone reports 15+ connectors

---

## [Unreleased] — 2026-07-14

### Phase 1: Foundation & Architecture

#### Added
- React 19 + TypeScript 6 + Vite 8 project scaffolding
- Tailwind CSS 4 with `@tailwindcss/vite` plugin
- TanStack Query 5 for data fetching and cache management
- Recharts 3 for telemetry chart visualization
- Axios HTTP client with response interceptors (404, 503, timeout)
- React Router DOM v7 for routing

#### Architecture
- Zone-based 12-column CSS grid dashboard layout (`Dashboard.tsx`)
- `DashboardProvider` with deep-merge configuration system
- `DashboardCard` universal wrapper handling loading/error/empty/data/stale states
- `ErrorBoundary` component for zone-isolated crash recovery
- `DashboardLayout` root layout with offline detection banner
- `useNetworkState` hook for online/offline detection

#### API Integration
- 8 typed endpoint functions in `src/api/endpoints.ts`
- 8 TanStack Query hooks in `src/hooks/useQueries.ts` with `keepPreviousData`
- Polling intervals: 5s (operational), 10s (metrics/telemetry), 15s (executive)
- Axios client with 20-second timeout and centralized error logging

#### Type System
- `src/types/api.ts` — Severity, OperationalStatus, TrendDirection, IncidentStatus, ReplayState
- `src/types/runtime.ts` — All 8 API response types with nested interfaces
- `src/types/dashboard.types.ts` — DashboardConfig, ZoneConfig, BrandingConfig, FeatureFlags
- Type-safe mapper utilities in `src/utils/format.ts`

---

### Phase 2: Component Library

#### Primitives (15 components)
- `ExecutiveMetricCard` — KPI display with trend indicator and unit label
- `AlertCard` — Severity-coded alert with source badge and timestamp
- `StatusCard` — Progress bar with priority dot and secondary text
- `DecisionCard` — Decision action with execution status badge
- `CapabilityCard` — Capability with engaged/idle indicator
- `OperatorCard` — Agent profile with status dot and task count
- `TelemetryCard` — Recharts area chart with summary metrics and legend
- `IntegrationCard` — Connection tile with status and latency
- `TimelineCard` — Timeline event with severity connector line
- `APIHealthCard` — Endpoint health with uptime, errors, latency, RPM
- `EvidenceCard` — Evidence item with category and confidence score
- `RuntimeCard` — Runtime component status display
- `ReplayCard` — Replay session with progress indicator
- `WorkflowCard` — Multi-step workflow pipeline
- `HealthIndicator` — Simple health status dot

#### Layouts (10 zones)
- `ExecutiveLayout` — 6 KPI cards in responsive grid
- `OperationsLayout` — API health cards + active operations list (top 4 + N more)
- `IntegrationLayout` — Integration tile grid + live alert feed
- `DecisionIntelligenceLayout` — Capability cards + recent decisions
- `ObservabilityLayout` — Telemetry area chart with summary metrics
- `WorkflowLayout` — Compact workflow table with View All toggle
- `OperatorConsoleLayout` — Agent cards + activity timeline feed
- `RuntimeHealthLayout` — Health bar + component table with View All toggle
- `ReplayLayout` — Simulation session table with View All toggle
- `EvidenceLayout` — Evidence cards with confidence metrics

---

### Phase 3: Layout Density Optimization

#### Changed
- Reduced Executive Summary KPI card padding for 1920×1080 viewport fit
- Converted Active Workflows from stacked cards to compact table format
- Converted Runtime Health from stacked cards to compact status table
- Converted Simulation & Replay from cards to compact session table
- Limited Active Operations to top 4 items with "+N more" indicator
- Condensed Decision Intelligence to show latest decision only
- Compressed Evidence & Intelligence into concise summary rows
- Applied fixed max-heights with internal scrolling to all large panels
- Reduced overall page scrolling to ~90–95% visible at 1920×1080

#### Grid Rebalancing
- Operations & Compute ↔ Integrations & Alerts: equal height (7:5 split)
- Decision Intelligence ↔ Observability: equal height (4:8 split)
- Active Workflows ↔ Operator Console: equal height (7:5 split)
- Runtime Health ↔ Simulation & Replay: equal height (7:5 split)

---

### Phase 4: Responsive Layout Fixes

#### Fixed
- Integration tiles grid: 3 cols → 2 cols (< 1280px) → 1 col (< 768px)
- Added `min-width: 0` to card content containers to prevent text overlap
- Truncated long secondary text with text-overflow ellipsis

---

### Phase 5: Content Density Optimization

#### Changed
- Active Workflows: 8 rows visible by default, View All toggle for 10 total
- Runtime Health: 6 components visible by default, View All toggle for 9 total
- Simulation & Replay: 6 sessions visible by default, View All toggle for 8 total
- Operator Console: Synthetic timeline placeholders (last command, last ack, last deploy, last alert cleared) fill empty space; minimum 8 activity items

---

### Phase 6: Typography Refinement

#### Changed
- Dashboard title: `text-base` → `text-[21px] font-bold`
- Dashboard subtitle: `text-xs text-slate-500` → `text-[13px] text-slate-400`
- Card titles: `text-xs uppercase tracking-wide` → `text-[13.5px] font-semibold`
- Section headers: `text-[10px] uppercase` → `text-sm font-semibold text-slate-300`
- KPI values: standardized to `text-3xl font-extrabold` (30px)
- KPI labels: standardized to `text-[12.5px] font-semibold text-slate-400`
- Table headers: standardized to `text-[12px] font-semibold text-slate-400`
- Table body rows: standardized to `text-[13px]`
- Secondary columns: standardized to `text-[11px]`
- Chart axis labels: `fontSize: 9` → `fontSize: 11`
- Chart legends: `text-[10px]` → `text-[12px] font-medium`
- Chart tooltips: `text-xs` → `text-[12.5px]`
- AlertCard message: `text-xs` → `text-[13px]`
- AlertCard metadata: `text-[10px]` → `text-[11px]`
- DecisionCard action: `text-xs` → `text-[13px]`
- DecisionCard reason: `text-[11px]` → `text-[12px]`
- CapabilityCard name: `text-xs` → `text-[13px]`
- CapabilityCard description: `text-[11px]` → `text-[12px]`
- OperatorCard name: `text-xs` → `text-[13px]`
- StatusCard label: `text-sm` → `text-[13px] font-medium`

---

### Phase 7: Final Submission Documentation

#### Added
- `docs/TESTING_GUIDE.md` — Comprehensive testing guide
- `docs/MANUAL_TEST_CHECKLIST.md` — 50+ manual test cases with pass/fail tracking
- `docs/REVIEW_PACKET.md` — Architecture summary and component inventory
- `docs/PRODUCTION_READINESS_REPORT.md` — Readiness assessment with deployment checklist
- `docs/REVIEWER_NOTES.md` — Design rationale and trade-off documentation
- `docs/CHANGELOG.md` — This file

---

### Phase 8: Reusable Dashboard Layout Engine

#### Added
- `packages/dashboard-layout` (`@bhiv/dashboard-layout`) — new standalone, system-agnostic package (depends only on `@bhiv/utils` + `@bhiv/ui`, not on `@bhiv/dashboard-sdk`):
  - `GridLayoutEngine` / `LayoutZone` — drop-in replacements for `@bhiv/dashboard-sdk`'s `LayoutEngine`/`ZoneLayoutEngine`, byte-identical output by default
  - `useLayoutEngine` — zone ordering, edit mode, persisted customization, templates
  - Drag-and-drop zone reordering (native HTML5 DnD, no external dependency)
  - Drag-to-resize (pointer events, live grid-width measurement, per-zone `minCols`/`maxCols`)
  - Per-dashboard persistence via a pluggable `PersistenceAdapter` (`localStorage` by default)
  - Layout templates — save the current arrangement, list, and re-apply
  - `DashboardGrid` — high-level component wiring the above together
  - `LayoutEditToolbar` — optional pre-built edit/reset/template UI
  - Full README at `packages/dashboard-layout/README.md`

#### Changed
- `src/pages/Dashboard.tsx` — now builds its `LayoutZoneDefinition[]` from the existing zone config and renders through `@bhiv/dashboard-layout`'s `useLayoutEngine` + `DashboardGrid` instead of calling `@bhiv/dashboard-sdk`'s `LayoutEngine`/`ZoneLayoutEngine` directly. Zone order and default column spans are unchanged — the new engine reproduces the previous static grid exactly until a user opts into edit mode via the added `LayoutEditToolbar` and customizes their layout.
- `apps/shakti/package.json` — added `@bhiv/dashboard-layout` as a workspace dependency.

#### Notes
- `@bhiv/dashboard-sdk`'s own `LayoutEngine`/`ZoneLayoutEngine` were left in place, unmodified, for any other consumer still using them directly.
- Known limitations (tracked for follow-up): the new package's drag/resize/toolbar chrome uses fixed dark-palette Tailwind classes rather than `@bhiv/dashboard-sdk`'s theme tokens; resize is desktop (`lg`) only; drag-and-drop touch support on mobile is unverified. See `packages/dashboard-layout/README.md#known-limitations`.
