# SHAKTI Command Center — Reviewer Notes

## For the Reviewer

This document provides context for code reviewers evaluating the SHAKTI Command Center frontend application. It covers design rationale, intentional trade-offs, and areas that may benefit from future iteration.

---

## Architecture Rationale

### Why zone-based grid instead of a single monolithic page?

Each of the 10 dashboard zones is an independent React component that:
- Fetches its own data via a dedicated TanStack Query hook
- Is wrapped in its own `<ErrorBoundary>` for crash isolation
- Is lazy-loaded with `React.lazy()` for code splitting
- Can be toggled on/off or re-ordered via `DashboardConfig`

This means a crash in the Workflow zone will never take down the Executive Summary or Runtime Health zones. Each zone is also independently testable.

### Why `DashboardCard` as a universal wrapper?

Rather than duplicating loading/error/empty/data state logic in 10 layouts, `DashboardCard` centralizes this into one component with consistent props:
- `isLoading` → shows skeleton placeholders
- `isError` → shows red error panel with retry
- `isEmpty` → shows informational empty message
- `hasData` → gates child rendering
- `headerRight` → slot for status badges/counts

This guarantees visual consistency and reduces boilerplate per zone from ~30 lines to ~5 lines of state handling.

### Why `keepPreviousData` in every query hook?

Executive dashboards are viewed during incidents when networks are unstable. Blanking the entire UI on a failed refetch creates panic. `keepPreviousData` ensures the last known good data remains visible while TanStack Query retries in the background.

---

## Intentional Design Trade-offs

### Synthetic data padding
None of the layouts pad their data with synthetic/placeholder items — `WorkflowLayout` and `ReplayLayout` render real `Execution Registry`/`Replay Registry` records, `RuntimeHealthLayout` and `OperatorConsoleLayout` render real runtime/telemetry data. If a widget renders nothing, that's an accurate reflection of an empty or unreachable backend response (see each layout's `emptyMessage`/`errorMessage`), not a rendering gap being papered over.

### Configurable theme (dark/light)
`dashboard.config.ts#theme.mode` now drives `DashboardProvider`'s built-in `ThemeProvider`/`ThemeEngine` — no more hardcoded `"dark"` literal at the provider level, and `ThemeEngine.applyCSSVariables()` does update the CSS custom properties for `"light"` mode. The shipped SHAKTI default remains `"dark"`, matching standard practice for operational monitoring dashboards (Grafana, Datadog, PagerDuty) where operators work in low-light NOC environments.
**Caveat:** most layout components still use literal Tailwind classes (`bg-slate-900`, `text-slate-100`, ...) rather than the theme tokens/CSS variables `ThemeEngine` exposes, so setting `theme.mode: "light"` today changes the CSS variables but does not yet re-skin most of the UI. Retrofitting components to consume the theme tokens is the remaining work to make light mode actually usable.

### Typography uses arbitrary values
Font sizes like `text-[13.5px]`, `text-[12.5px]`, and `text-[21px]` are used instead of Tailwind's built-in scale (`text-xs`, `text-sm`, etc.). This is intentional — the standard Tailwind scale has 4px jumps (12→14→16) which are too coarse for the subtle hierarchy needed in a data-dense dashboard.

### No CSS-in-JS or Styled Components
All styling uses Tailwind CSS utility classes directly in JSX. This was chosen for:
- Zero runtime overhead
- Co-located styling (styles are visible next to the component)
- Easy Tailwind v4 compatibility

---

## Code Quality Notes

### TypeScript strictness
- `tsc --noEmit` returns **zero errors** across the entire codebase
- All API response types are defined in `src/types/runtime.ts`
- All primitive props interfaces are exported and documented with JSDoc comments
- Format utilities (`src/utils/format.ts`) provide type-safe mappers from raw API strings to UI enums

### Memoization
- All 15 primitive components use `React.memo()` to prevent unnecessary re-renders
- All 10 layout components use `memo()` as a default export wrapper
- `useMemo` is used for derived data (sorting, filtering, synthetic padding)

### Error boundaries
- Every zone in `Dashboard.tsx` is wrapped: `<ErrorBoundary fallbackTitle="..."><Suspense><Layout /></Suspense></ErrorBoundary>`
- The `ErrorBoundary` component logs errors via the `logger` utility and provides a "Reload Zone" recovery button

---

## Files Worth Close Review

| File | Reason |
|---|---|
| `src/config/dashboard.config.ts` | Central config — defines all zone visibility and column spans |
| `src/components/dashboard/DashboardCard.tsx` | Universal wrapper — any change here affects all 10 zones |
| `src/hooks/useQueries.ts` | All polling hooks — refetch intervals defined here |
| `src/api/client.ts` | Axios config — timeout and interceptors |
| `src/utils/format.ts` | Type mappers — conversion from backend strings to UI types |
| `src/pages/Dashboard.tsx` | Grid layout — zone ordering and column assignments |
| `src/config/ecosystemConnectors.ts` | Single declarative registry for all BHIV ecosystem systems (PRANA, BHEX, Karma, SETU, InsightFlow, plus 7 `"pending"` systems) — read by both `OperationsLayout` and the header's observability strip |
| `packages/dashboard-sdk/src/runtime/` | Shared `RuntimeConnector`, `ServiceObservabilityProvider`, and `buildTraceLineage` — product-agnostic connectivity/lineage primitives |

---

## Potential Future Improvements

1. **Automated testing** — Add Vitest unit tests for primitives and Playwright E2E tests for layout rendering
2. **WebSocket streaming** — `RuntimeConnector` (`@bhiv/dashboard-sdk/runtime`) is already transport-agnostic: it polls today via `poll()` and exposes `attachTransport()` for a future WebSocket/SSE client, with no consumer-side changes required when that lands. No real push transport is implemented yet — every connection today is still polling.
3. **Authentication gate** — Wire `useAuth` hook to a real OAuth/JWT provider
4. **Data export** — Add CSV/PDF download for operational data tables
5. **Keyboard shortcuts** — Add hotkeys for zone navigation and alert acknowledgment
6. **Internationalization** — Extract all UI strings for i18n support
7. **Accessibility audit** — Full WCAG 2.1 AA compliance review
8. **Storybook** — Component catalog for primitives with props playground
