# SHAKTI Command Center — Testing Guide

## Overview

This document describes how to test the SHAKTI Operational Command Center dashboard. The application is built with React 19, TypeScript 6, Vite 8, TanStack Query 5, Recharts 3, and Tailwind CSS 4. It connects to a FastAPI backend at `http://127.0.0.1:8009`.

---

## 1. Environment Setup

### Prerequisites
- Node.js ≥ 20.x
- npm ≥ 10.x
- SHAKTI Backend running on port 8009 (or set `VITE_CONTROL_PLANE_URL`)

### Install and Start
```bash
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build (tsc -b && vite build)
npm run preview      # Preview production build
npm run lint         # ESLint checks
```

### Type Checking
```bash
npx tsc --noEmit     # Full TypeScript compile check (zero errors expected)
```

---

## 2. Component-Level Testing

### Primitives (`src/components/dashboard/primitives/`)

Each primitive is a stateless, memoized card component that renders based on props:

| Primitive | Key Props to Test | Expected Behavior |
|---|---|---|
| `ExecutiveMetricCard` | `value`, `trend`, `unit`, `variant` | Primary variant renders 30px value; compact variant renders 20px value |
| `AlertCard` | `severity`, `acknowledged` | Critical shows red icon/border; acknowledged reduces opacity to 50% |
| `StatusCard` | `severity`, `progress`, `statusTheme` | Progress bar color matches theme; priority dot matches severity |
| `DecisionCard` | `status`, `isAutomated` | Executed shows green shield; rejected shows red alert icon |
| `CapabilityCard` | `status`, `isEngaged` | Engaged shows pulsing indigo indicator and indigo border |
| `OperatorCard` | `status`, `taskCount` | Status dot color changes; task count badge appears when > 0 |
| `TelemetryCard` | `data`, `series`, `summaryMetrics` | Chart renders area fills; empty state shows "No telemetry data" |
| `IntegrationCard` | `status`, `latency` | Connected shows green; disconnected shows red |
| `TimelineCard` | `severity`, `isLast` | Timeline connector line hidden when `isLast=true` |
| `APIHealthCard` | `uptime`, `errorRate`, `latency` | Uptime ≥ 99.9% renders green; error rate > 1% renders red |

---

## 3. Layout-Level Testing

### Data Flow Verification

Each layout fetches data through a dedicated TanStack Query hook:

| Layout | Hook | API Endpoint | Refetch Interval |
|---|---|---|---|
| `ExecutiveLayout` | `useExecutiveDashboard` | `GET /dashboard/executive` | 15s |
| `OperationsLayout` | `useOperationsDashboard` | `GET /dashboard/operations` | 5s |
| `IntegrationLayout` | `useAlertsDashboard` | `GET /dashboard/alerts` | 5s |
| `DecisionIntelligenceLayout` | `useOperationsDashboard` | `GET /dashboard/operations` | 5s |
| `ObservabilityLayout` | `useTelemetryDashboard` | `GET /dashboard/telemetry` | 10s |
| `WorkflowLayout` | `useOperationsDashboard` | `GET /dashboard/operations` | 5s |
| `OperatorConsoleLayout` | `useAlertsDashboard` | `GET /dashboard/alerts` | 5s |
| `RuntimeHealthLayout` | `useSystemStatus` | `GET /system/status` | 5s |
| `ReplayLayout` | `useRuntimeDashboard` | `GET /dashboard/runtime` | 5s |
| `EvidenceLayout` | `useOperationsDashboard` | `GET /dashboard/operations` | 5s |

### State Rendering Verification

Every layout wraps content in `<DashboardCard>`, which handles five states:

1. **Loading** — Skeleton placeholders are displayed
2. **Error** — Red error panel with "Retry" button
3. **Empty** — Informational empty state message
4. **Data** — Normal rendered content
5. **Stale** — Previous data preserved via `keepPreviousData`

---

## 4. Resilience Testing (Chaos Engineering)

### Test 1: API Timeout
1. Start the dashboard with `npm run dev`.
2. In Chrome DevTools → Network tab, throttle to "Slow 3G" or block `/dashboard/*` requests.
3. **Expected:** The Axios 20-second timeout triggers. `<DashboardCard>` shows the red error state. App does not crash.

### Test 2: Mid-Session Network Loss
1. Let the dashboard load successfully with live data.
2. Disconnect internet (or toggle Offline in DevTools).
3. **Expected:** The `useNetworkState` hook triggers. A red "System Offline" banner drops from the header. Layouts continue showing the last cached data via `keepPreviousData`.

### Test 3: Zone-Level Crash
1. Temporarily inject `throw new Error("test")` inside any layout (e.g., `WorkflowLayout.tsx`).
2. **Expected:** Only the affected zone crashes with the localized `<ErrorBoundary>` fallback ("Zone Crashed" + "Reload Zone" button). All other zones continue updating normally.

### Test 4: Backend 404
1. Change the backend URL to a non-existent endpoint.
2. **Expected:** The Axios response interceptor logs `Endpoint not found`. Dashboard cards show error state with retry button.

### Test 5: Backend 503
1. Stop the backend server while the dashboard is running.
2. **Expected:** Interceptor logs `Service unavailable`. Existing data persists on screen. Error states appear on the next refetch cycle.

---

## 5. Responsive Layout Testing

Test at these breakpoints:

| Breakpoint | Resolution | Grid Behavior |
|---|---|---|
| Desktop XL | 1920×1080 | Full 12-column grid, all zones visible without scrolling |
| Desktop | 1440×900 | 12-column grid, minimal scrolling |
| Laptop | 1366×768 | Zones stack where needed, internal scroll active |
| Tablet (`md`) | 768×1024 | Integration tiles → 2 columns, some zones full-width |
| Mobile (`sm`) | 375×667 | All zones stack to single column, integration tiles → 1 column |

### Responsive Elements to Verify
- Integration tiles grid: 3 cols → 2 cols (< 1280px) → 1 col (< 768px)
- Header clock and operator name hidden below `sm` breakpoint
- Header divider hidden below `sm` breakpoint
- Table columns truncate with `text-overflow: ellipsis`

---

## 6. Performance Validation

### Build Output
```
npm run build
```
Expected: Build completes in < 500ms with zero TypeScript errors.

### Bundle Size Targets
| Asset | Target |
|---|---|
| Total CSS | < 50 KB (gzipped < 10 KB) |
| Main JS chunk | < 250 KB (gzipped < 70 KB) |
| Largest layout chunk | < 350 KB (ObservabilityLayout, includes Recharts) |

### Runtime Performance
- Dashboard should render first meaningful paint within 1.5 seconds on a fast connection
- TanStack Query `refetchInterval` values range from 5s–15s, preventing API overload
- All primitives use `React.memo()` to prevent unnecessary re-renders
- All layouts are lazy-loaded via `React.lazy()` with `<Suspense>` fallbacks
