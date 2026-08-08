# BHIV–SHAKTI Runtime Integration & Operational Command Center
## Final Project Documentation

> **Prepared:** 2026-07-29  
> **Version:** 1.0.0  
> **Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · TanStack Query 5 · Recharts 3

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Convergence & Architecture Changes](#2-repository-convergence--architecture-changes)
3. [Dashboard Platform](#3-dashboard-platform)
4. [Dashboard SDK](#4-dashboard-sdk)
5. [Widget Registry & Component Inventory](#5-widget-registry--component-inventory)
6. [Design System](#6-design-system)
7. [SHAKTI Integration](#7-shakti-integration)
8. [Deployment Guide](#8-deployment-guide)
9. [Configuration Guide](#9-configuration-guide)
10. [REVIEW_PACKET](#10-review_packet)
11. [CODE_PACKET](#11-code_packet)
12. [Known Limitations](#12-known-limitations)
13. [README Improvements](#13-readme-improvements)

---

## 1. Executive Summary

The **BHIV–SHAKTI Operational Command Center** is a production-grade, configuration-driven React dashboard designed for government enterprise and high-stakes operational monitoring. The project has been consolidated from scattered, duplicated UI logic into a **unified, layered architecture** consisting of:

| Layer | Purpose | Location |
|-------|---------|----------|
| **Platform** | Reusable, SHAKTI-agnostic infrastructure (SDK, Widget system, Theme engine, Layout engine, Filters, Navigation, Frameworks, Templates) | `src/platform/` |
| **BHIV Utilities** | Shared helper functions and hooks for the BHIV component ecosystem | `src/bhiv/utils/` |
| **Dashboard Components** | SHAKTI-specific assembled layouts (19 zones) and primitive cards (16 primitives) | `src/components/dashboard/` |
| **Application Shell** | Routing, layout wrappers, header, error boundaries | `src/layouts/`, `src/components/layout/`, `src/App.tsx` |
| **Data Layer** | API clients, React Query hooks, typed endpoints for 5 backend services | `src/api/`, `src/hooks/` |

### Key Outcomes

- **Single canonical repository** with unified folder structure
- **Reusable platform layer** (`src/platform/`) containing 8 subsystems and 35+ modules
- **19 dashboard zones** rendered via configuration-driven `DashboardProvider`
- **16 reusable primitive cards** composable into any layout
- **5 theme modes** (dark, light, high-contrast, cyberpunk, emerald) with runtime switching
- **Zero runtime/business logic modifications** — all changes are view-layer only
- **Full backward compatibility** preserved

---

## 2. Repository Convergence & Architecture Changes

### 2.1 Before vs. After

| Area | Previous State | Converged State |
|------|----------------|-----------------|
| Folder structure | Flat, duplicated UI per feature | Layered: `platform/` → `components/` → `pages/` |
| Design tokens | Hardcoded hex values scattered across files | Centralized `src/platform/theme/tokens.ts` with 5 theme variants |
| Widget rendering | Direct JSX in layout files | `WidgetContainer` framework with loading/error/empty state machine |
| Dashboard config | Implicit via code | Explicit `DashboardConfig` type + `DashboardProvider` context |
| Module resolution | Relative imports `../../..` | Path alias `@/*` → `src/*`, `@/bhiv/*` → `src/bhiv/*` |
| Build config | Single tsconfig | Split `tsconfig.app.json` + `tsconfig.node.json` with path aliases |

### 2.2 Final Directory Tree

```
bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/
├── src/
│   ├── api/                          # API clients & endpoints
│   │   ├── client.ts                 #   Axios instance with interceptors
│   │   ├── endpoints.ts              #   Control Plane endpoints
│   │   ├── bucketEndpoints.ts        #   Bucket Service endpoints
│   │   ├── niyantranEndpoints.ts     #   Niyantran Service endpoints
│   │   ├── pranaEndpoints.ts         #   Prana Service endpoints
│   │   └── insightflowEndpoints.ts   #   InsightFlow Service endpoints
│   │
│   ├── bhiv/                         # BHIV reusable utilities
│   │   └── utils/
│   │       ├── mergeClassNames.ts    #   Conditional class merger
│   │       └── useResponsive.ts      #   Breakpoint-aware hook
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardProvider.tsx  #   Config context + deep merge
│   │   │   ├── DashboardCard.tsx      #   Backward-compat wrapper → WidgetContainer
│   │   │   ├── layouts/              #   19 assembled zone layouts
│   │   │   └── primitives/           #   16 reusable card primitives
│   │   ├── layout/
│   │   │   └── Header.tsx            #   App header (config-driven)
│   │   ├── ui/                       #   Base UI atoms (badge, button, card, etc.)
│   │   └── ErrorBoundary.tsx         #   Global error boundary
│   │
│   ├── config/
│   │   └── dashboard.config.ts       #   Default SHAKTI zone configuration
│   │
│   ├── hooks/                        #   React Query data-fetching hooks
│   │   ├── useQueries.ts             #   Control Plane queries
│   │   ├── useBucketQueries.ts       #   Bucket Service queries
│   │   ├── useNiyantranQueries.ts    #   Niyantran queries
│   │   ├── usePranaQueries.ts        #   Prana queries
│   │   ├── useInsightFlowQueries.ts  #   InsightFlow queries
│   │   ├── useNetworkState.ts        #   Online/offline detection
│   │   ├── useAuth.ts                #   Authentication state
│   │   └── useAuthorization.ts       #   Role-based access
│   │
│   ├── layouts/
│   │   └── DashboardLayout.tsx       #   App shell (header + offline banner)
│   │
│   ├── pages/
│   │   └── Dashboard.tsx             #   Main page: zone grid renderer
│   │
│   ├── platform/                     #   ★ REUSABLE PLATFORM LAYER ★
│   │   ├── index.ts                  #   Barrel re-export
│   │   ├── sdk/                      #   Dashboard SDK
│   │   │   ├── types.ts
│   │   │   ├── DashboardSDK.ts
│   │   │   ├── SDKContext.ts
│   │   │   ├── SDKProvider.tsx
│   │   │   ├── useDashboardSDK.ts
│   │   │   └── index.ts
│   │   ├── widget/                   #   Widget Framework
│   │   │   ├── types.ts
│   │   │   ├── WidgetRegistry.ts
│   │   │   ├── WidgetContainer.tsx
│   │   │   └── index.ts
│   │   ├── theme/                    #   Design System / Theme Engine
│   │   │   ├── types.ts
│   │   │   ├── tokens.ts
│   │   │   ├── ThemeEngine.ts
│   │   │   ├── ThemeContext.ts
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── useTheme.ts
│   │   │   └── index.ts
│   │   ├── layout/                   #   Layout Engine
│   │   │   ├── types.ts
│   │   │   ├── LayoutEngine.tsx
│   │   │   ├── ZoneLayoutEngine.tsx
│   │   │   └── index.ts
│   │   ├── filters/                  #   Filter Framework
│   │   │   ├── types.ts
│   │   │   ├── FilterEngine.ts
│   │   │   ├── FilterContext.ts
│   │   │   ├── FilterProvider.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── useFilters.ts
│   │   │   └── index.ts
│   │   ├── frameworks/               #   Visualization Frameworks
│   │   │   ├── card/BaseCard.tsx
│   │   │   ├── graph/GraphFramework.tsx
│   │   │   ├── table/BaseTableFramework.tsx
│   │   │   ├── timeline/TimelineFramework.tsx
│   │   │   └── index.ts
│   │   ├── navigation/               #   Navigation Engine
│   │   │   ├── types.ts
│   │   │   ├── NavigationEngine.ts
│   │   │   ├── NavBar.tsx
│   │   │   ├── useNavigation.ts
│   │   │   └── index.ts
│   │   └── templates/                #   Dashboard Templates
│   │       ├── TemplateRegistry.ts
│   │       ├── OperationsTemplate.tsx
│   │       └── index.ts
│   │
│   ├── types/                        #   TypeScript type definitions
│   │   ├── api.ts
│   │   ├── runtime.ts
│   │   ├── dashboard.types.ts
│   │   ├── bucket.ts
│   │   ├── niyantran.ts
│   │   ├── prana.ts
│   │   └── insightflow.ts
│   │
│   ├── utils/                        #   Shared application utilities
│   ├── App.tsx                       #   Root component
│   ├── main.tsx                      #   Entry point (React 19 + QueryClient)
│   └── index.css                     #   Global styles
│
├── docs/                             #   17 documentation files
├── review_packets/                   #   Review & code packets
├── evidence/                         #   Testing evidence
├── public/                           #   Static assets
├── dist/                             #   Production build output
│
├── vite.config.ts
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── .env
```

### 2.3 Architectural Pattern

```
┌──────────────────────────────────────────────────────┐
│                    Application Shell                  │
│  App.tsx → DashboardLayout → Header + <main>         │
├──────────────────────────────────────────────────────┤
│                    Page Layer                         │
│  Dashboard.tsx → DashboardGrid (19 zone definitions) │
├──────────────────────────────────────────────────────┤
│               Assembled Layouts (19)                  │
│  ExecutiveLayout, OperationsLayout, ...               │
│  Each layout composes Primitive Cards + data hooks    │
├──────────────────────────────────────────────────────┤
│               Primitive Cards (16)                    │
│  RuntimeCard, AlertCard, TelemetryCard, ...           │
│  Each wraps DashboardCard → WidgetContainer           │
├──────────────────────────────────────────────────────┤
│           ★ PLATFORM LAYER (reusable) ★               │
│  SDK │ Widget │ Theme │ Layout │ Filter │ Navigation  │
│  Frameworks (Card/Graph/Table/Timeline) │ Templates   │
├──────────────────────────────────────────────────────┤
│                 Base UI Atoms                         │
│  badge, button, card, skeleton, tooltip, separator    │
├──────────────────────────────────────────────────────┤
│                    Data Layer                         │
│  API clients + React Query hooks + Typed endpoints    │
└──────────────────────────────────────────────────────┘
```

---

## 3. Dashboard Platform

The **Platform Layer** (`src/platform/`) is the reusable infrastructure that powers the entire dashboard system. It contains **8 subsystems**, each with clean barrel exports via `index.ts`:

### 3.1 Platform Subsystems

| Subsystem | Files | Purpose |
|-----------|-------|---------|
| **SDK** | 6 files | `DashboardSDK` class with event bus, config management, widget registration |
| **Widget** | 4 files | `WidgetContainer` component (state machine for loading/error/empty/stale), `WidgetRegistry` for dynamic registration |
| **Theme** | 7 files | `ThemeEngine` with CSS variable injection, `ThemeProvider` React context, 5 theme presets |
| **Layout** | 4 files | `LayoutEngine` (12-column responsive grid), `ZoneLayoutEngine` (Suspense + ErrorBoundary per zone) |
| **Filters** | 7 files | `FilterEngine` (search, status, severity, sort, pagination), `FilterBar` component, React context |
| **Frameworks** | 5 files | `BaseCard`, `MetricCardFramework`, `GraphFramework` (Recharts), `BaseTableFramework`, `TimelineFramework` |
| **Navigation** | 5 files | `NavigationEngine` (route state manager), `NavBar` component, `useNavigation` hook |
| **Templates** | 3 files | `TemplateRegistry` (executive, operations), composable full-page templates |

### 3.2 Import Path

All platform modules are accessible via a single barrel import:

```typescript
import {
  DashboardSDK,
  WidgetContainer,
  ThemeProvider,
  LayoutEngine,
  FilterEngine,
  NavigationEngine,
  BaseCard,
  GraphFramework,
} from "@/platform";
```

---

## 4. Dashboard SDK

**Location:** `src/platform/sdk/`

### 4.1 `DashboardSDK` Class

The SDK is a singleton class that manages dashboard-wide configuration and provides an event bus for cross-component communication.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConfig()` | `() → SDKDashboardConfig` | Returns the current configuration snapshot |
| `updateConfig()` | `(patch: Partial<SDKDashboardConfig>) → void` | Merges a partial config and emits `config:updated` |
| `registerWidget()` | `(widget: SDKWidgetConfig) → void` | Registers a widget and emits `widget:registered` |
| `unregisterWidget()` | `(widgetId: string) → void` | Removes a widget and emits `widget:unregistered` |
| `on()` | `(event, callback) → unsubscribe` | Subscribe to events (returns unsubscribe function) |
| `off()` | `(event, callback) → void` | Unsubscribe from events |
| `emit()` | `(event, payload?) → void` | Emit an event to all listeners |

### 4.2 SDK Types

```typescript
interface SDKWidgetConfig {
  id: string;
  title: string;
  category?: string;
  colSpan?: string;
  height?: string;
  defaultVisible?: boolean;
  props?: Record<string, unknown>;
}

interface SDKDashboardConfig {
  appTitle: string;          // Default: "Operational Command Platform"
  version: string;           // Default: "1.0.0"
  environment: "development" | "staging" | "production";
  refreshIntervalMs: number; // Default: 10000
  widgets: Record<string, SDKWidgetConfig>;
}
```

### 4.3 React Integration

| Export | Type | Description |
|--------|------|-------------|
| `SDKProvider` | Component | React context provider wrapping `DashboardSDK` |
| `useDashboardSDK()` | Hook | Returns `{ sdk, config }` from context |
| `globalDashboardSDK` | Instance | Pre-instantiated singleton |

---

## 5. Widget Registry & Component Inventory

### 5.1 Widget Registry

**Location:** `src/platform/widget/WidgetRegistry.ts`

A type-safe map of widget IDs → React components with metadata.

| Method | Description |
|--------|-------------|
| `register(widget)` | Adds a widget definition to the registry |
| `unregister(id)` | Removes a widget by ID |
| `get(id)` | Retrieves a single widget definition |
| `getAll()` | Returns all registered widgets |
| `getByCategory(category)` | Filters widgets by category string |

### 5.2 WidgetContainer (State Machine)

**Location:** `src/platform/widget/WidgetContainer.tsx`

The `WidgetContainer` implements a **5-state rendering machine**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Loading    │     │    Error     │     │    Empty     │
│  (skeleton)  │     │  (no data)  │     │  (message)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐
│   Success    │     │ Stale/Cached │
│  (children)  │     │  (warning)   │
└─────────────┘     └─────────────┘
```

**Props:** `title`, `ariaLabel`, `headerRight`, `isLoading`, `isError`, `hasData`, `onRetry`, `errorMessage`, `errorTitle`, `isEmpty`, `emptyMessage`, `skeletonCount`, `skeletonHeight`, `className`, `children`, `metadata` (`timestamp`, `isFetching`, `isStale`, `traceId`, `dataSource`)

### 5.3 Component Inventory

#### Base UI Atoms (`src/components/ui/`)

| Component | File | Description |
|-----------|------|-------------|
| `Badge` | `badge.tsx` | Status/label badge with variant support |
| `Button` | `button.tsx` | Polymorphic button (default, ghost, destructive, xs/sm/md sizes) |
| `Card` | `card.tsx` | Card container with `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| `Separator` | `separator.tsx` | Visual divider |
| `Skeleton` | `skeleton.tsx` | Loading placeholder with pulse animation |
| `Tooltip` | `tooltip.tsx` | Hover tooltip |

#### Platform Frameworks (`src/platform/frameworks/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `BaseCard` | `card/BaseCard.tsx` | `title, subtitle, headerRight, footer, children` | Generic card shell |
| `MetricCardFramework` | `card/BaseCard.tsx` | `label, value, unit, change, trend` | KPI metric display with trend indicator |
| `GraphFramework` | `graph/GraphFramework.tsx` | `data, dataKey, strokeColor, fillColor, height` | Recharts area chart with gradient fill |
| `BaseTableFramework<T>` | `table/BaseTableFramework.tsx` | `columns, data, keyExtractor, emptyMessage` | Generic typed data table |
| `TimelineFramework` | `timeline/TimelineFramework.tsx` | `events, emptyMessage` | Vertical event timeline with severity dots |

#### Dashboard Primitives (`src/components/dashboard/primitives/`)

| Primitive | File | Description |
|-----------|------|-------------|
| `RuntimeCard` | `RuntimeCard.tsx` | Runtime instance health (CPU, memory, uptime, status) |
| `ExecutiveMetricCard` | `ExecutiveMetricCard.tsx` | Executive-level KPI with trend arrow |
| `AlertCard` | `AlertCard.tsx` | Inline alert with severity badge |
| `StatusCard` | `StatusCard.tsx` | System status summary card |
| `CapabilityCard` | `CapabilityCard.tsx` | Capability definition card |
| `DecisionCard` | `DecisionCard.tsx` | Decision intelligence card |
| `EvidenceCard` | `EvidenceCard.tsx` | Evidence item card |
| `IntegrationCard` | `IntegrationCard.tsx` | Integration/API health card |
| `OperatorCard` | `OperatorCard.tsx` | Operator action card |
| `ReplayCard` | `ReplayCard.tsx` | Runtime session replay card |
| `TelemetryCard` | `TelemetryCard.tsx` | Telemetry/observability card |
| `TimelineCard` | `TimelineCard.tsx` | Timeline event card |
| `WorkflowCard` | `WorkflowCard.tsx` | Workflow/incident card |
| `APIHealthCard` | `APIHealthCard.tsx` | API endpoint health indicator |
| `HealthIndicator` | `HealthIndicator.tsx` | Status dot with tooltip (UP/DOWN/DEGRADED) |
| `CapabilityGraphVisualizer` | `CapabilityGraphVisualizer.tsx` | Interactive dependency graph visualization |

#### Dashboard Card Wrapper (`src/components/dashboard/DashboardCard.tsx`)

Backward-compatible wrapper that delegates all rendering to `WidgetContainer`:

```tsx
// Before (direct):
<WidgetContainer title="..." isLoading={...} metadata={{...}} />

// After (backward-compatible):
<DashboardCard title="..." isLoading={...} timestamp={...} traceId={...} />
```

### 5.4 Assembled Layouts (19 Zones)

**Location:** `src/components/dashboard/layouts/`

| Zone Key | Layout | Column Span |
|----------|--------|-------------|
| `executiveSummary` | `ExecutiveLayout` | `col-span-12` |
| `operationsGrid` | `OperationsLayout` | `col-span-12 lg:col-span-7` |
| `liveAlerts` | `IntegrationLayout` | `col-span-12 lg:col-span-5` |
| `riskHeatmap` | `DecisionIntelligenceLayout` | `col-span-12 md:col-span-6 lg:col-span-4` |
| `telemetry` | `ObservabilityLayout` | `col-span-12 md:col-span-6 lg:col-span-8` |
| `incidentQueue` | `WorkflowLayout` | `col-span-12 lg:col-span-7` |
| `operationalTimeline` | `OperatorConsoleLayout` | `col-span-12 lg:col-span-5` |
| `systemHealth` | `RuntimeHealthLayout` | `col-span-12 md:col-span-7` |
| `runtimeSessions` | `ReplayLayout` | `col-span-12 md:col-span-5` |
| `evidencePanel` | `EvidenceLayout` | `col-span-12` |
| `repositoryRegistry` | `RepositoryRegistryLayout` | `col-span-12 lg:col-span-6` |
| `buildRegistry` | `BuildRegistryLayout` | `col-span-12 lg:col-span-6` |
| `migrationQueue` | `MigrationQueueLayout` | `col-span-12 lg:col-span-6` |
| `reviewQueue` | `ReviewQueueLayout` | `col-span-12 lg:col-span-6` |
| `capabilityRegistry` | `CapabilityRegistryLayout` | `col-span-12` |
| `employeeExecution` | `EmployeeExecutionLayout` | `col-span-12` |
| `engineeringCapacity` | `EngineeringCapacityLayout` | `col-span-12 lg:col-span-6` |
| `deliveryIntelligence` | `DeliveryIntelligenceLayout` | `col-span-12 lg:col-span-6` |
| `capabilityDependencyGraph` | `CapabilityDependencyGraphLayout` | `col-span-12` |

All layouts are **lazy-loaded** via `React.lazy()` and wrapped in `Suspense` + `ErrorBoundary` via `@bhiv/dashboard-layout`'s `LayoutZone` (the same isolation contract `ZoneLayoutEngine` provides, now with drag-and-drop reordering, drag-to-resize, persistence, and layout templates layered on top — see `packages/dashboard-layout/README.md`). The column spans in the table above are the shipped defaults; a user can customize them per browser via the edit toolbar.

---

## 6. Design System

### 6.1 Architecture

**Location:** `src/platform/theme/`

| File | Export | Description |
|------|--------|-------------|
| `types.ts` | `ThemeMode`, `ColorTokens`, `TypographyTokens`, `SpacingTokens`, `PlatformDesignTokens` | Full type system |
| `tokens.ts` | `defaultTokens` | Token values for all 5 themes |
| `ThemeEngine.ts` | `ThemeEngine`, `globalThemeEngine` | Runtime engine: CSS variable injection + subscriber pattern |
| `ThemeContext.ts` | `ThemeContext` | React context |
| `ThemeProvider.tsx` | `ThemeProvider` | Context provider with `defaultMode` prop |
| `useTheme.ts` | `useTheme()` | Hook returning `{ mode, tokens, setMode }` |

### 6.2 Theme Modes

| Mode | Background | Primary | Accent | Use Case |
|------|-----------|---------|--------|----------|
| `dark` | `#0f172a` | `#6366f1` (Indigo) | `#38bdf8` (Sky) | Default operations |
| `light` | `#f8fafc` | `#4f46e5` (Indigo) | `#0284c7` (Blue) | Presentations |
| `high-contrast` | `#000000` | `#ffff00` (Yellow) | `#00ffff` (Cyan) | Accessibility / WCAG |
| `cyberpunk` | `#0d0221` | `#ff007f` (Pink) | `#fefe00` (Yellow) | Demonstration |
| `emerald` | `#022c22` | `#10b981` (Emerald) | `#6ee7b7` (Green) | Nature theme |

### 6.3 Token Structure

```typescript
interface PlatformDesignTokens {
  mode: ThemeMode;
  colors: {
    background, surface, surfaceBorder,
    primary, primaryForeground,
    textPrimary, textSecondary, textMuted,
    accent, success, warning, danger, info
  };
  typography: {
    fontFamilySans: "Inter, system-ui, sans-serif",
    fontFamilyMono: "JetBrains Mono, monospace",
    fontSizeXs: "0.75rem",  fontSizeSm: "0.875rem",
    fontSizeBase: "1rem",    fontSizeLg: "1.125rem",
    fontSizeXl: "1.25rem"
  };
  spacing: {
    xs: "0.25rem", sm: "0.5rem", md: "1rem",
    lg: "1.5rem",  xl: "2rem",
    containerPadding: "1rem", gridGap: "0.5rem"
  };
  borderRadius: string;
  shadow: string;
}
```

### 6.4 CSS Variable Injection

`ThemeEngine.applyCSSVariables()` sets the following on `document.documentElement`:

| CSS Variable | Token Source |
|-------------|-------------|
| `--platform-bg` | `colors.background` |
| `--platform-surface` | `colors.surface` |
| `--platform-surface-border` | `colors.surfaceBorder` |
| `--platform-primary` | `colors.primary` |
| `--platform-text-primary` | `colors.textPrimary` |
| `--platform-text-secondary` | `colors.textSecondary` |
| `--platform-text-muted` | `colors.textMuted` |
| `--platform-radius` | `borderRadius` |
| `--platform-font-sans` | `typography.fontFamilySans` |
| `--platform-font-mono` | `typography.fontFamilyMono` |

---

## 7. SHAKTI Integration

### 7.1 Integration Philosophy

The SHAKTI runtime integration follows a **thin-wrapper** approach:

- **No runtime/business logic was modified** — all API endpoints, hooks, and data-fetching remain untouched
- **View-layer only** — the `DashboardCard` component now delegates to the platform's `WidgetContainer`
- **Configuration-driven** — all zone visibility and layout spans are controlled by `dashboard.config.ts`

### 7.2 Backend Services

The dashboard integrates with **5 backend services** via typed Axios clients:

| Service | Env Variable | Base URL | Endpoint Module |
|---------|-------------|----------|-----------------|
| **Control Plane** | `VITE_CONTROL_PLANE_URL` | `http://127.0.0.1:8009` | `api/endpoints.ts` |
| **Bucket Service** | `VITE_BUCKET_SERVICE_URL` | `https://bhiv-bucket-i1l6.onrender.com` | `api/bucketEndpoints.ts` |
| **Prana Service** | `VITE_PRANA_SERVICE_URL` | `http://localhost:8103` | `api/pranaEndpoints.ts` |
| **Niyantran Service** | `VITE_NIYANTRAN_URL` | `http://localhost:5000` | `api/niyantranEndpoints.ts` |
| **InsightFlow** | `VITE_INSIGHTFLOW_URL` | ngrok tunnel | `api/insightflowEndpoints.ts` |

### 7.3 React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,         // 10s before refetch
      retry: 3,                   // 3 retries on failure
      retryDelay: exponential,    // 1s → 2s → 4s (max 30s)
      refetchOnWindowFocus: false, // No refetch on tab switch
    },
  },
});
```

### 7.4 Data Hooks

| Hook file | Service | Queries |
|------|---------|---------|
| `useQueries.ts` | Control Plane | Executive/operations/alerts/runtime/telemetry dashboards, system status, metrics, health, Capability/Execution/Replay Registry, employee execution, engineering capacity, delivery intelligence |
| `useBucketQueries.ts` | Bucket | Health, storage stats, chain state, constitutional status, repository/build registry, migration/review queue, artifacts, audit log |
| `usePranaQueries.ts` | Prana | Health, runtime sessions, propagation log |
| `useInsightFlowQueries.ts` | InsightFlow | Health, bucket status, stage metrics, decision intelligence |
| `useNiyantranQueries.ts` | Niyantran | Workforce stats, tasks, departments, leaderboard, attendance, merge analysis, execution history, aims, alerts, submissions, live locations |
| `useServiceObservabilityPublisher.ts` | All of the above + ecosystem connectors | Reports each real service's connectivity into the shared `ServiceObservabilityProvider` (`@bhiv/dashboard-sdk/runtime`) |

### 7.5 Resilience Features

- **Offline detection** — `useNetworkState()` triggers an offline banner with reconnection indicator
- **Cached data fallback** — `WidgetContainer` shows a yellow "Using cached data" banner when `isError && hasData`
- **Error boundaries** — every zone is wrapped in `<ErrorBoundary>` with custom crash titles
- **Suspense fallbacks** — skeleton placeholders via `React.lazy()` + `<Suspense>`
- **API interceptors** — normalized error handling for 404, 503, timeout, and network errors

---

## 8. Deployment Guide

### 8.1 Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Node.js | 20+ |
| npm | 9+ |
| OS | Windows 10/11, macOS, Linux |

### 8.2 Local Development

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env
# Edit .env with your backend service URLs

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

### 8.3 Production Build

```bash
# TypeScript check + Vite build
npm run build
# Output: dist/

# Preview production build locally
npm run preview
```

### 8.4 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server with HMR |
| `build` | `tsc -b && vite build` | TypeScript check + production bundle |
| `lint` | `eslint .` | Run ESLint on all `.ts`/`.tsx` files |
| `preview` | `vite preview` | Serve the `dist/` folder locally |
| `test` | `vitest run` | Run unit tests (one-shot) |
| `test:watch` | `vitest` | Run unit tests in watch mode |
| `test:e2e` | `playwright test` | Run end-to-end browser tests |

### 8.5 Docker Deployment

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t bhiv-shakti-dashboard .
docker run -p 8080:80 bhiv-shakti-dashboard
```

---

## 9. Configuration Guide

### 9.1 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CONTROL_PLANE_URL` | Yes | Control Plane API base URL |
| `VITE_BUCKET_SERVICE_URL` | Yes | Bucket Service base URL |
| `VITE_PRANA_SERVICE_URL` | No | Prana Service base URL |
| `VITE_NIYANTRAN_URL` | No | Niyantran Service base URL |
| `VITE_NIYANTRAN_EXECUTION_KEY` | No | Niyantran execution API key |
| `VITE_NIYANTRAN_AUTH_TOKEN` | No | Niyantran JWT auth token |
| `VITE_INSIGHTFLOW_URL` | No | InsightFlow service URL |

### 9.2 Dashboard Configuration

The dashboard is configured via `src/config/dashboard.config.ts`. Override any field by passing a partial config to `<DashboardLayout config={...}>`:

```typescript
// Custom config for a different system
const myConfig: DashboardConfigOverride = {
  branding: {
    systemName: "AGNI",
    subtitle: "Fire Control Center",
    operatorLabel: "Commander",
    roleLabel: "Fire Control",
    operatorInitials: "FC",
  },
  zones: {
    executiveSummary: { visible: true, colSpan: "col-span-12" },
    operationsGrid: { visible: false },  // Hide this zone
    // ... only override what you need
  },
  features: {
    notifications: false,
    liveBadge: true,
  },
};

<DashboardLayout config={myConfig}>
  <DashboardGrid />
</DashboardLayout>
```

### 9.3 Build Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins (React, Tailwind CSS), path alias `@` → `src` |
| `tsconfig.app.json` | TypeScript compiler: ES2023 target, JSX react-jsx, path aliases `@/*` and `@/bhiv/*` |
| `tsconfig.node.json` | Node-specific TS config for vite/vitest configs |
| `eslint.config.js` | ESLint flat config: recommended + React hooks + React refresh |
| `vitest.config.ts` | Vitest: jsdom environment, path aliases |
| `playwright.config.ts` | Playwright E2E test configuration |
| `components.json` | shadcn/ui component configuration |

### 9.4 TypeScript Path Aliases

| Alias | Maps To |
|-------|---------|
| `@/*` | `src/*` |
| `@/bhiv/*` | `src/bhiv/*` |

---

## 10. REVIEW_PACKET

### 10.1 Architecture Compliance

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Configuration-driven layout | ✅ Pass | `DashboardProvider` + `dashboard.config.ts` control all 19 zones |
| Reusable platform layer | ✅ Pass | 8 subsystems in `src/platform/` with 35+ modules |
| Backward compatibility | ✅ Pass | `DashboardCard` wraps `WidgetContainer` — zero API surface change |
| Lazy-loaded zones | ✅ Pass | All 19 layouts use `React.lazy()` |
| Error boundaries per zone | ✅ Pass | `@bhiv/dashboard-layout`'s `LayoutZone` wraps every zone in `<ErrorBoundary>` |
| Layout customization | ✅ Pass | `@bhiv/dashboard-layout`'s `useLayoutEngine` adds drag-and-drop reordering, drag-to-resize, per-browser persistence, and named templates on top of the default grid |
| Typed API layer | ✅ Pass | 7 type definition files in `src/types/` |
| Resilient data-fetching | ✅ Pass | Retry + staleTime + cached fallback + offline banner |

### 10.2 Code Quality

| Metric | Status |
|--------|--------|
| TypeScript strict mode | ✅ Enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) |
| ESLint | ✅ Configured (recommended + React hooks + React refresh) |
| Path aliases | ✅ `@/*` and `@/bhiv/*` |
| No `any` warnings suppressed | ✅ `@typescript-eslint/no-explicit-any: off` (deliberate for generic frameworks) |
| Consistent file naming | ✅ PascalCase for components, camelCase for utilities |

### 10.3 Documentation Completeness

| Document | Location | Status |
|----------|----------|--------|
| Architecture | `docs/ARCHITECTURE.md` | ✅ |
| Component Library | `docs/COMPONENT_LIBRARY.md` | ✅ |
| Dashboard Capability | `docs/DASHBOARD_CAPABILITY.md` | ✅ |
| Runtime Integration | `docs/RUNTIME_INTEGRATION.md` | ✅ |
| Integration Guide | `docs/INTEGRATION_GUIDE.md` | ✅ |
| Deployment Guide | `docs/DEPLOYMENT_GUIDE.md` | ✅ |
| Testing Guide | `docs/TESTING_GUIDE.md` | ✅ |
| Review Packet | `docs/REVIEW_PACKET.md` | ✅ |
| Code Packet | `docs/CODE_PACKET.md` | ✅ |
| UI Architecture | `docs/UI_ARCHITECTURE.md` | ✅ |
| Component Inventory | `docs/component_inventory.md` | ✅ |
| Dashboard Architecture | `docs/dashboard_architecture.md` | ✅ |
| Dashboard Zoning | `docs/dashboard_zoning.md` | ✅ |
| Changelog | `docs/CHANGELOG.md` | ✅ |
| Reviewer Notes | `docs/REVIEWER_NOTES.md` | ✅ |
| Production Readiness | `docs/PRODUCTION_READINESS_REPORT.md` | ✅ |
| Manual Test Checklist | `docs/MANUAL_TEST_CHECKLIST.md` | ✅ |

---

## 11. CODE_PACKET

### 11.1 Source File Counts

| Directory | Files | Total Size |
|-----------|-------|-----------|
| `src/platform/` | 36 files | ~32 KB |
| `src/components/dashboard/layouts/` | 19 files | ~148 KB |
| `src/components/dashboard/primitives/` | 17 files | ~63 KB |
| `src/components/ui/` | 7 files | ~7 KB |
| `src/hooks/` | 8 files | ~14 KB |
| `src/api/` | 6 files | ~32 KB |
| `src/types/` | 7 files | ~28 KB |
| `src/config/` | 1 file | ~3.5 KB |
| `src/bhiv/` | 2 files | ~0.9 KB |
| **Total `src/`** | **~110 files** | **~340 KB** |

### 11.2 Platform Layer Breakdown

```
src/platform/              (36 files, ~32 KB)
├── index.ts               (216 B)     — Barrel export
├── sdk/                   (6 files)   — Dashboard SDK
├── widget/                (4 files)   — Widget Framework
├── theme/                 (7 files)   — Design System
├── layout/                (4 files)   — Layout Engine
├── filters/               (7 files)   — Filter Framework
├── frameworks/            (5 files)   — Visualization Frameworks
├── navigation/            (5 files)   — Navigation Engine
└── templates/             (3 files)   — Dashboard Templates
```

### 11.3 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.7 | UI framework |
| `react-dom` | ^19.2.7 | DOM rendering |
| `typescript` | ~6.0.2 | Type checking |
| `vite` | ^8.1.1 | Build tool |
| `tailwindcss` | ^4.3.2 | CSS framework |
| `@tailwindcss/vite` | ^4.3.2 | Tailwind Vite plugin |
| `@tanstack/react-query` | ^5.101.2 | Server-state management |
| `axios` | ^1.18.1 | HTTP client |
| `recharts` | ^3.9.2 | Charting library |
| `lucide-react` | ^1.23.0 | Icon library |
| `clsx` | ^2.1.1 | Class name utility |
| `tailwind-merge` | ^3.6.0 | Tailwind class deduplication |
| `react-router-dom` | ^7.18.1 | Client-side routing |

### 11.4 How to Generate a Code Packet Archive

```bash
# Platform + BHIV code only
git archive -o code_packet.zip HEAD src/platform src/bhiv src/components

# Full source
git archive -o code_packet_full.zip HEAD src/
```

---

## 12. Known Limitations

### 12.1 Current Limitations

| # | Area | Description | Severity |
|---|------|-------------|----------|
| 1 | **Charting** | `GraphFramework` wraps Recharts only; no bar/pie/scatter chart variants yet | Medium |
| 2 | **SSR** | Client-side only — no server-side rendering support | Low |
| 3 | **BHIV Components** | `src/bhiv/` currently contains only utilities (`mergeClassNames`, `useResponsive`); planned BHIV-specific cards (RepositoryCard, EmployeeCard, etc.) are not yet scaffolded | Medium |
| 4 | **Theme persistence** | Theme mode is not persisted to `localStorage` — resets on page reload | Low |
| 5 | **Routing** | Section navigation is wired (`SectionNav` + a dedicated `NavigationEngine` instance scroll to zone anchors, driven by `dashboard.config.ts#navigation.items`) — but this is in-page anchor navigation, not real routes. `react-router-dom` is still installed but not configured; there is still only one route (`App.tsx → Dashboard`) | Low |
| 6 | **Vite alias** | `@/bhiv` alias is defined in `tsconfig.app.json` but not yet added to `vite.config.ts` `resolve.alias` | Low |
| 7 | **Authentication** | `useAuth` and `useAuthorization` hooks are placeholder implementations | Medium |
| 8 | **Accessibility** | WCAG 2.1 AA coverage for platform components; individual SHAKTI layouts need per-zone audits | Medium |
| 9 | **Bundle splitting** | No manual chunk splitting configured — relies on Vite's automatic code splitting | Low |
| 10 | **Tests** | Vitest and Playwright are configured but test coverage is minimal | High |
| 11 | **Ecosystem connectors** | AKASHIC, SAAKSHI, SANSKAR, ARTHA, SAMACHAR, AIAIC, and NAMAMI GANGE are registered in `src/config/ecosystemConnectors.ts` as `"pending"` — no backend endpoint exists for any of them yet | High |
| 12 | **Streaming** | `RuntimeConnector` (`@bhiv/dashboard-sdk/runtime`) is transport-agnostic and ready for a WebSocket/SSE transport, but every current connection is still polling — no live push transport is implemented | Medium |

### 12.2 Recommended Next Steps

1. **Scaffold BHIV component library** — Create typed card/widget components in `src/bhiv/components/`
2. **Add theme persistence** — Save selected theme to `localStorage` in `ThemeEngine`
3. **Configure real page routing** — in-page section navigation now exists (`SectionNav`); wiring `react-router-dom` for actual multi-page routes is still open
4. **Expand chart types** — Add bar, pie, scatter variants to `GraphFramework`
5. **Increase test coverage** — Unit tests for platform modules, E2E tests for critical flows
6. **Add vite alias** — Add `"@/bhiv": path.resolve(__dirname, "./src/bhiv")` to `vite.config.ts`

---

## 13. README Improvements

The following improvements should be applied to the root `README.md`:

### Recommended README Structure

1. ✅ **Title & description** — Already present
2. ✅ **Core tenets** — Already present (config-driven, resilient, strict architecture, performance)
3. ✅ **Feature list** — Already present
4. ✅ **Stack** — Already present
5. ✅ **Getting started** — Already present
6. ⬜ **Platform layer overview** — Missing. Add section describing `src/platform/` subsystems
7. ⬜ **Design system reference** — Missing. Add token table and theme mode list
8. ⬜ **Configuration example** — Missing. Show how to override `DashboardConfig`
9. ⬜ **Architecture diagram** — Missing. Add ASCII or mermaid diagram
10. ⬜ **Contributing guidelines** — Missing
11. ✅ **Documentation directory** — Already present

---

## Appendix A: File Reference Index

### Configuration Files

| File | Path |
|------|------|
| [vite.config.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/vite.config.ts) | Build config |
| [tsconfig.app.json](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/tsconfig.app.json) | TypeScript config |
| [eslint.config.js](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/eslint.config.js) | Lint config |
| [package.json](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/package.json) | Dependencies |
| [dashboard.config.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/config/dashboard.config.ts) | Dashboard zones |

### Platform Core

| File | Path |
|------|------|
| [DashboardSDK.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/sdk/DashboardSDK.ts) | SDK class |
| [WidgetRegistry.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/widget/WidgetRegistry.ts) | Widget registry |
| [WidgetContainer.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/widget/WidgetContainer.tsx) | Widget state machine |
| [ThemeEngine.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/theme/ThemeEngine.ts) | Theme engine |
| [tokens.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/theme/tokens.ts) | Design tokens |
| [LayoutEngine.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/layout/LayoutEngine.tsx) | Grid layout |
| [FilterEngine.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/filters/FilterEngine.ts) | Filter state |
| [NavigationEngine.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/navigation/NavigationEngine.ts) | Nav state |
| [TemplateRegistry.ts](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/platform/templates/TemplateRegistry.ts) | Templates |

### Application Entry

| File | Path |
|------|------|
| [main.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/main.tsx) | Entry point |
| [App.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/App.tsx) | Root component |
| [Dashboard.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/pages/Dashboard.tsx) | Main page |
| [DashboardLayout.tsx](file:///c:/Users/2/Downloads/bhiv-SHAKTI-Runtime-Integration-and-Operational-Command-Center-Sprint-main/src/layouts/DashboardLayout.tsx) | App shell |

---

*End of Final Project Documentation*
