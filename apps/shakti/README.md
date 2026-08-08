# BHIV–SHAKTI Runtime Integration & Operational Command Center

A production-grade, highly resilient, and configuration-driven React dashboard capability designed for government enterprise and high-stakes operations.

## Overview

This is **NOT** a bespoke dashboard. This is a reusable, composable dashboard *capability* powered by:

- A **Platform Layer** (`src/platform/`) with 8 reusable subsystems (SDK, Widget Framework, Theme Engine, Layout Engine, Filters, Navigation, Visualization Frameworks, Templates)
- A robust **configuration schema** (`DashboardProvider.tsx`) for deep-merge zone overrides
- **19 assembled layouts** and **16 reusable primitives**
- **5 design-system themes** with runtime switching

## Core Tenets

- **Configuration-Driven:** Layout visibility and structural spans controlled via `DashboardProvider` + `dashboard.config.ts`
- **Graceful Degradation:** Frontend never crashes if backends fail — caching, retries, offline banners, and stale-data fallbacks ensure maximum data retention
- **Strict Architecture:** `Atom → Primitive → Layout → Zone → Grid` composition pattern
- **Performance First:** `React.lazy`, `<Suspense>`, `useMemo`, lazy-loaded zone layouts
- **Reusable Platform:** Every platform module is SHAKTI-agnostic and can power any BHIV dashboard

## Architecture

```
Application Shell (App.tsx → DashboardLayout → Header)
    │
    ├── Page Layer (Dashboard.tsx → DashboardGrid)
    │       │
    │       ├── 19 Zone Layouts (lazy-loaded, ErrorBoundary-wrapped)
    │       │       │
    │       │       └── 16 Primitive Cards (RuntimeCard, AlertCard, ...)
    │       │               │
    │       │               └── DashboardCard → WidgetContainer (state machine)
    │       │
    │       └── @bhiv/dashboard-layout (DashboardGrid + useLayoutEngine:
    │               12-col grid, drag/resize/persist/templates)
    │
    └── Platform Layer (src/platform/)
            ├── SDK (DashboardSDK, SDKProvider, event bus)
            ├── Widget (WidgetRegistry, WidgetContainer)
            ├── Theme (ThemeEngine, 5 modes, CSS variables)
            ├── Layout (LayoutEngine, ZoneLayoutEngine)
            ├── Filters (FilterEngine, FilterBar, FilterProvider)
            ├── Frameworks (BaseCard, GraphFramework, BaseTable, Timeline)
            ├── Navigation (NavigationEngine, NavBar)
            └── Templates (TemplateRegistry, OperationsTemplate)
```

> `Layout (LayoutEngine, ZoneLayoutEngine)` above is `@bhiv/dashboard-sdk`'s own module — unchanged and still available for direct use. `Dashboard.tsx` itself renders through `@bhiv/dashboard-layout` instead (see `packages/dashboard-layout/README.md`), which adds drag-and-drop reordering, drag-to-resize, persistence, and templates on top of the same 12-column grid contract.

## Design System

**5 theme modes** with runtime switching via `ThemeProvider`:

| Theme | Background | Primary | Use Case |
|-------|-----------|---------|----------|
| Dark | `#0f172a` | Indigo `#6366f1` | Default operations |
| Light | `#f8fafc` | Indigo `#4f46e5` | Presentations |
| High-contrast | `#000000` | Yellow `#ffff00` | Accessibility (WCAG) |
| Cyberpunk | `#0d0221` | Pink `#ff007f` | Demonstration |
| Emerald | `#022c22` | Emerald `#10b981` | Alternative operations |

Tokens: `colors` (13), `typography` (7), `spacing` (7), `borderRadius`, `shadow`.

## Features

- **19 Assembled Layouts:** Executive, Operations, Integrations, Decision Intelligence, Observability, Workflow, Operator Console, Runtime Health, Replay, Evidence, Repository Registry, Build Registry, Migration Queue, Review Queue, Capability Registry, Employee Execution, Engineering Capacity, Delivery Intelligence, Capability Dependency Graph
- **Resilience:** Global Error Boundaries, exponential API backoff, 250s timeouts, offline detection
- **Accessibility:** ARIA-live announcements, focus management, high-contrast theme
- **Responsive:** Tailwind CSS 12-column grid, mobile → 4K display adaptation
- **5 Backend Integrations:** Control Plane, Bucket Service, Prana, Niyantran, InsightFlow

## Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first CSS |
| TanStack Query | 5 | Server-state management |
| Recharts | 3 | Data visualization |
| Axios | 1.18 | HTTP client |
| Lucide React | 1.23 | Icon library |

## Getting Started

```bash
# Install dependencies
npm ci

# Edit apps/shakti/.env with your backend URLs (no template to copy —
# the app validates this file at startup and tells you exactly what's
# missing or malformed if something's wrong)

# Start development server
npm run dev
# → http://localhost:5173

# Production build
npm run build

# Run tests
npm run test          # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

### Docker (containerized deploy)

```bash
cp apps/shakti/.env .env    # root .env — docker-compose reads it for build args
docker compose up --build
curl http://localhost:8080/health   # {"status":"ok"}
```

Serves the production build behind nginx with a real `/health` endpoint, SPA fallback, and gzip. Full detail in `HARDENING.md` at the repo root.

## Configuration Example

Override the default SHAKTI config to create a dashboard for a different system:

```typescript
import DashboardLayout from "@/layouts/DashboardLayout";

const myConfig = {
  branding: {
    systemName: "AGNI",
    subtitle: "Fire Control Center",
  },
  zones: {
    executiveSummary: { visible: true },
    operationsGrid: { visible: false },  // Hide this zone
  },
};

<DashboardLayout config={myConfig}>
  <DashboardGrid />
</DashboardLayout>
```

## Platform Import

All platform modules are accessible via barrel export:

```typescript
import {
  DashboardSDK, SDKProvider, useDashboardSDK,
  WidgetContainer, WidgetRegistry,
  ThemeProvider, useTheme, globalThemeEngine,
  LayoutEngine, ZoneLayoutEngine,
  FilterEngine, FilterBar,
  NavigationEngine, NavBar,
  BaseCard, GraphFramework, BaseTableFramework, TimelineFramework,
  TemplateRegistry,
} from "@/platform";
```

## Documentation Directory

| Document | Location | Description |
|----------|----------|-------------|
| **Project Documentation** | `PROJECT_DOCUMENTATION.md` | Complete final documentation (this sprint) |
| Architecture | `docs/ARCHITECTURE.md` | Core structural paradigms |
| Component Library | `docs/COMPONENT_LIBRARY.md` | Available primitives and usage |
| Dashboard Capability | `docs/DASHBOARD_CAPABILITY.md` | DashboardProvider configuration |
| Runtime Integration | `docs/RUNTIME_INTEGRATION.md` | Control Plane API hook integration |
| Integration Guide | `docs/INTEGRATION_GUIDE.md` | Connecting to backend services |
| Deployment Guide | `docs/DEPLOYMENT_GUIDE.md` | CI/CD and production build steps |
| Testing Guide | `docs/TESTING_GUIDE.md` | Quality assurance requirements |
| Review Packet | `docs/REVIEW_PACKET.md` | Executive review and sign-off criteria |
| Code Packet | `docs/CODE_PACKET.md` | File index for developers onboarding |
| Handover | `docs/HANDOVER.md` | Current state, what changed, how to run, known issues |
| UI Architecture | `docs/UI_ARCHITECTURE.md` | Detailed UI layer design |
| Component Inventory | `docs/component_inventory.md` | Full component catalog |
| Dashboard Architecture | `docs/dashboard_architecture.md` | Zone-level architecture |
| Dashboard Zoning | `docs/dashboard_zoning.md` | Zone layout specifications |
| Changelog | `docs/CHANGELOG.md` | Version history |
| Production Readiness | `docs/PRODUCTION_READINESS_REPORT.md` | Production checklist |
| Manual Test Checklist | `docs/MANUAL_TEST_CHECKLIST.md` | QA test procedures |

## License

Proprietary — BHIV Internal Use Only.
