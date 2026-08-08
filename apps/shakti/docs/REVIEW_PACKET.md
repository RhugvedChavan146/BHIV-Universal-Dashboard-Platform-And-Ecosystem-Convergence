# SHAKTI Command Center — Review Packet

## Project Identity

| Field | Value |
|---|---|
| **Project** | SHAKTI Runtime Integration and Operational Command Center |
| **Repository** | `blackholeinfiverse145/SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint` |
| **Stack** | React 19 · TypeScript 6 · Vite 8 · TanStack Query 5 · Recharts 3 · Tailwind CSS 4 |
| **Backend** | FastAPI on `http://127.0.0.1:8009` |
| **Build Status** | ✅ Zero TypeScript errors · ✅ Production build passes |
| **Container** | ✅ Dockerized (multi-stage build → nginx) · ✅ `GET /health` endpoint |

---

## Production Hardening

Applied in a repository-hardening pass — full detail and run instructions in `HARDENING.md` at the repo root. Summary:

| Area | What's in place |
|---|---|
| Docker | Multi-stage `Dockerfile` (deps → build → nginx serve) + `docker-compose.yml`. Builds from the repo root so npm workspace resolution (`@bhiv/*`) works. |
| Health endpoint | `GET /health` served by nginx (real, used by the `Dockerfile`'s `HEALTHCHECK`), plus a static `public/health.json` fallback for hosts without custom nginx config. |
| Config validation | `src/config/env.ts` checks required `VITE_*` vars are set and optional ones are valid URLs, collecting every issue before reporting. |
| Startup validation | `src/main.tsx` runs validation before rendering; a missing/malformed var shows a readable error screen instead of a blank page. |
| Structured logging | `packages/utils/src/logger.ts` (`@bhiv/utils`) emits JSON log records in production, readable console output in dev — same call signatures used throughout the app. |
| Repository hygiene | Root `.gitignore` / `.dockerignore` covering `node_modules`, `dist`, `.env`, logs, coverage. |
| Dependency cleanup | 4 unused devDependencies removed (dead React Compiler wiring); see `DEPENDENCY_AUDIT.md`. |

## Architecture Summary

### Application Structure
```
src/
├── api/              # Axios client + typed endpoint functions
├── components/
│   ├── dashboard/
│   │   ├── DashboardCard.tsx       # Universal card wrapper (5 states)
│   │   ├── DashboardProvider.tsx   # Config context provider
│   │   ├── layouts/                # 10 zone layout components
│   │   └── primitives/             # 15 reusable primitive cards
│   ├── layout/
│   │   └── Header.tsx              # Global dashboard header
│   ├── ui/
│   │   └── skeleton.tsx            # Loading skeleton component
│   └── ErrorBoundary.tsx           # Zone-isolated crash recovery
├── config/
│   └── dashboard.config.ts         # Default SHAKTI configuration
├── hooks/                          # 4 custom hooks
├── layouts/
│   └── DashboardLayout.tsx         # Root layout with offline banner
├── pages/
│   └── Dashboard.tsx               # Main dashboard grid page
├── types/                          # 3 type definition files
└── utils/                          # Format helpers + logger
```

### Key Design Decisions

1. **Zone-based grid architecture** — 10 independent zones in a 12-column CSS grid, each lazy-loaded and wrapped in `<ErrorBoundary>`.

2. **Configuration-driven layout** — All zone visibility, column spans, branding, and features are controlled by `DashboardConfig`, enabling reuse across different operational systems without code changes.

3. **DashboardCard as universal wrapper** — Every zone content is wrapped in `<DashboardCard>`, which handles loading/error/empty/data/stale states uniformly.

4. **Primitive composition** — 15 stateless, memoized primitive components (`ExecutiveMetricCard`, `AlertCard`, `StatusCard`, etc.) that layouts compose together.

5. **TanStack Query for data management** — All API calls use `useQuery` with `keepPreviousData` to prevent UI blanking during refetches. Intervals range from 5s (critical operational data) to 15s (executive summary).

---

## Component Inventory

### Layouts (10 zones)

| Zone | File | Data Source | Description |
|---|---|---|---|
| Executive Summary | `ExecutiveLayout.tsx` | `/dashboard/executive` | 6 KPI cards in responsive grid |
| Operations & Compute | `OperationsLayout.tsx` | `/dashboard/operations` | API health cards + active operations list |
| Integrations & Alerts | `IntegrationLayout.tsx` | `/dashboard/alerts` | Integration tile grid + live alert feed |
| Decision Intelligence | `DecisionIntelligenceLayout.tsx` | `/dashboard/operations` | Capability status + recent decisions |
| Observability & Telemetry | `ObservabilityLayout.tsx` | `/dashboard/telemetry` | Area chart with summary metrics |
| Active Workflows | `WorkflowLayout.tsx` | `/registry/executions` (Execution Registry) | Compact workflow table with real per-execution steps |
| Operator Console | `OperatorConsoleLayout.tsx` | `/dashboard/alerts` | Agent cards + activity timeline feed |
| Runtime Health | `RuntimeHealthLayout.tsx` | `/system/status` | Health bar + component status table (6 visible, View All) |
| Simulation & Replay | `ReplayLayout.tsx` | `/registry/replays` (Replay Registry) | Replay session table with a selectable Replay Explorer detail panel |
| Evidence & Intelligence | `EvidenceLayout.tsx` | `/dashboard/operations` | Evidence cards with confidence metrics |

### Primitives (15 components)

| Primitive | Props Interface | Purpose |
|---|---|---|
| `ExecutiveMetricCard` | `ExecutiveMetricCardProps` | KPI display with trend and unit |
| `AlertCard` | `AlertCardProps` | Severity-coded alert with source |
| `StatusCard` | `StatusCardProps` | Progress bar with priority indicator |
| `DecisionCard` | `DecisionCardProps` | Decision action with status badge |
| `CapabilityCard` | `CapabilityCardProps` | Capability with engaged indicator |
| `OperatorCard` | `OperatorCardProps` | Agent profile with status dot |
| `TelemetryCard` | `TelemetryCardProps` | Area chart with summary metrics |
| `IntegrationCard` | `IntegrationCardProps` | Integration tile with connection status |
| `TimelineCard` | `TimelineCardProps` | Timeline event with connector line |
| `APIHealthCard` | `APIHealthCardProps` | Endpoint health with uptime/latency |
| `EvidenceCard` | `EvidenceCardProps` | Evidence item with confidence score |
| `RuntimeCard` | `RuntimeCardProps` | Runtime component status |
| `ReplayCard` | `ReplayCardProps` | Replay session with progress |
| `WorkflowCard` | `WorkflowCardProps` | Workflow step pipeline |
| `HealthIndicator` | `HealthIndicatorProps` | Simple health dot indicator |

---

## API Integration

| Endpoint | Method | Hook | Interval | Response Type |
|---|---|---|---|---|
| `/health` | GET | `useHealth` | 10s | `HealthResponse` |
| `/system/status` | GET | `useSystemStatus` | 5s | `SystemStatusResponse` |
| `/metrics` | GET | `useMetrics` | 10s | `MetricsResponse` |
| `/dashboard/executive` | GET | `useExecutiveDashboard` | 15s | `ExecutiveDashboardResponse` |
| `/dashboard/operations` | GET | `useOperationsDashboard` | 5s | `OperationsDashboardResponse` |
| `/dashboard/alerts` | GET | `useAlertsDashboard` | 5s | `AlertsDashboardResponse` |
| `/dashboard/runtime` | GET | `useRuntimeDashboard` | 5s | `RuntimeDashboardResponse` |
| `/dashboard/telemetry` | GET | `useTelemetryDashboard` | 10s | `TelemetryDashboardResponse` |
| `/registry/capabilities` | GET | `useCapabilityRegistry` | 10s | `CapabilityRegistryResponse` |
| `/registry/executions` | GET | `useExecutionRegistry` | 5s | `ExecutionRegistryResponse` |
| `/registry/replays` | GET | `useReplayRegistry` | 5s | `ReplayRegistryResponse` |

---

## Error Handling Strategy

| Layer | Mechanism | Recovery |
|---|---|---|
| Network | `useNetworkState` hook | Offline banner + cached data |
| HTTP 404 | Axios response interceptor | Logged + Promise rejection |
| HTTP 503 | Axios response interceptor | Logged + Promise rejection |
| Timeout | Axios 20s timeout | Logged + error state in card |
| Render crash | `<ErrorBoundary>` per zone | "Reload Zone" button |
| Empty data | `<DashboardCard>` empty state | Informational message |

---

## Typography System

| Element | Size | Weight | Color |
|---|---|---|---|
| Dashboard title | 21px | Bold | `text-slate-100` |
| Dashboard subtitle | 13px | Normal | `text-slate-400` |
| Card titles | 13.5px | Semibold | `text-slate-200` |
| Section headers | 14px | Semibold | `text-slate-300` |
| KPI values | 30px | Extrabold | `text-slate-100` |
| KPI labels | 12.5px | Semibold | `text-slate-400` |
| Table headers | 12px | Semibold | `text-slate-400` |
| Table body | 13px | Regular | `text-slate-200` |
| Secondary text | 11px | Regular | `text-slate-500` |
| Chart axis labels | 11px | Regular | `#64748b` |
| Chart legends | 12px | Medium | `text-slate-400` |
| Chart tooltips | 12.5px | Regular | Mixed |
