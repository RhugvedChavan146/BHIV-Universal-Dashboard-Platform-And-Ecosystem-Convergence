# UI_ARCHITECTURE.md

**Project:** SHAKTI Runtime Integration and Operational Command Center
**Module:** UI Architecture
**Version:** 1.0
**Last Updated:** 2025

---

## 1. UI Architecture Principles

The SHAKTI Command Center UI is governed by five architectural principles:

| Principle | Description |
|---|---|
| Operational Density | Information is compact and dense. Every pixel serves a purpose. |
| Visual Hierarchy | Color, size, and position communicate priority without labels. |
| Independent Zones | Each dashboard zone is fully self-contained — it fetches, loads, errors, and renders independently. |
| Zero Business Logic | The UI renders API outputs. It does not compute, transform, or interpret operational data. |
| Dark-First | The entire application is designed for dark environments. No light mode toggle exists in v1. |

---

## 2. Layout Strategy

### Root Structure

```
<html>
  <body>
    <div id="root">
      <QueryClientProvider>
        <App>
          <Dashboard>
            <DashboardLayout>
              <Header />          ← Fixed top bar
              <main>              ← flex-1 overflow-auto p-3
                <div.grid>        ← 12-column CSS Grid
                  [Zone Components]
                </div>
              </main>
            </DashboardLayout>
          </Dashboard>
        </App>
      </QueryClientProvider>
    </div>
  </body>
</html>
```

The `<main>` element is `flex-1 overflow-auto`, meaning it fills all remaining vertical space after the header and scrolls independently. The header is always visible.

---

## 3. CSS Grid Usage

The dashboard grid is rendered in `src/pages/Dashboard.tsx` through
`@bhiv/dashboard-layout`'s `DashboardGrid`, which produces the same
`grid grid-cols-12` container as before:

```tsx
<div className="grid grid-cols-12 gap-2.5">
```

The table below is the **shipped default** column span for each zone. These
defaults render unchanged for every user until they explicitly enter edit
mode (via the toolbar above the grid) and drag or resize a zone — at that
point their arrangement is remembered per browser (see
`packages/dashboard-layout/README.md` for the persistence/template model),
and this table describes the starting point rather than a fixed layout.

### Column Span Reference (shipped defaults)

| Zone | Default | md (768px) | lg (1024px) |
|---|---|---|---|
| Executive Summary | col-span-12 | col-span-12 | col-span-12 |
| National Grid Status | col-span-12 | col-span-12 | col-span-7 |
| Live Alert Queue | col-span-12 | col-span-12 | col-span-5 |
| Risk Heatmap | col-span-12 | col-span-6 | col-span-4 |
| Forecast Panel | col-span-12 | col-span-6 | col-span-8 |
| Incident Queue | col-span-12 | col-span-6 | col-span-6 |
| Operational Timeline | col-span-12 | col-span-6 | col-span-6 |
| System Health | col-span-12 | col-span-7 | col-span-7 |
| Replay Status | col-span-12 | col-span-5 | col-span-5 |
| Evidence Panel | col-span-12 | col-span-12 | col-span-12 |

### Grid Gap

`gap-2.5` = 10px uniform gap. This provides visual separation without wasting screen space on a command center display.

### No Fixed Heights

Zone components do not use fixed pixel heights. They size to their content. Scrollable content areas within zones use `overflow-y-auto max-h-64` to cap internal scroll regions.

---

## 4. Responsive Design

The application uses Tailwind CSS responsive prefixes exclusively. No custom media queries are written.

| Breakpoint | Prefix | Width |
|---|---|---|
| Mobile (default) | none | < 768px |
| Tablet | `md:` | ≥ 768px |
| Desktop | `lg:` | ≥ 1024px |

**Mobile behavior:** All zones stack to `col-span-12`. The dashboard becomes a single-column scrollable list.

**Tablet behavior:** Zones pair into two-column layouts where appropriate (`col-span-6`).

**Desktop behavior:** Full asymmetric grid layout as designed (7/5, 4/8, 6/6, 7/5 splits).

The Executive Summary row uses its own internal responsive grid:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
```
This renders 2 columns on mobile and 4 columns on tablet and above.

---

## 5. Theme Strategy

### Color Palette

The entire application uses Tailwind CSS slate and semantic color scales:

| Role | Token | Hex Equivalent |
|---|---|---|
| Page background | `bg-slate-950` | #020817 |
| Card surface | `bg-slate-800/60` | rgba(30,41,59,0.6) |
| Card border | `border-slate-700/50` | rgba(51,65,85,0.5) |
| Primary text | `text-slate-100` | #f1f5f9 |
| Secondary text | `text-slate-300` | #cbd5e1 |
| Muted text | `text-slate-500` | #64748b |
| Disabled text | `text-slate-600` | #475569 |

### Semantic Status Colors

| Status | Color | Token |
|---|---|---|
| Online / Normal | Emerald | `text-emerald-400`, `bg-emerald-400` |
| Warning | Yellow | `text-yellow-400`, `bg-yellow-400` |
| Degraded | Orange | `text-orange-400`, `bg-orange-400` |
| Offline / Critical | Red | `text-red-400`, `bg-red-400` |

### Severity Colors

| Severity | Text | Background + Border |
|---|---|---|
| critical | `text-red-400` | `bg-red-500/15 border-red-500/30` |
| high | `text-orange-400` | `bg-orange-500/15 border-orange-500/30` |
| medium | `text-yellow-400` | `bg-yellow-500/15 border-yellow-500/30` |
| low | `text-blue-400` | `bg-blue-500/15 border-blue-500/30` |
| info | `text-slate-400` | `bg-slate-500/15 border-slate-500/30` |

All color decisions are centralized in `src/utils/format.ts`. Changing a severity color requires editing one function.

### CSS Variables

Base CSS variables are defined in `src/index.css`:

```css
:root {
  --background: 222 47% 5%;
  --foreground: 213 31% 91%;
  --card: 222 47% 8%;
  --muted: 223 47% 11%;
  --border: 216 34% 17%;
}
```

### Custom Scrollbars

Compact 4px scrollbars are defined globally to maintain the dense aesthetic:

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
```

---

## 6. Navigation

React Router DOM v7 is installed but the current implementation is a single-page dashboard with no client-side routing. The router is available for future multi-page expansion.

To add a new route:
1. Create a page component in `src/pages/`
2. Wrap `<App>` in `<BrowserRouter>` in `main.tsx`
3. Add `<Routes>` and `<Route>` definitions in `App.tsx`

---

## 7. Component Composition

### Zone Component Pattern

Every dashboard zone follows this pattern:

```tsx
export default function ZoneName() {
  const { data, isLoading, isError, refetch } = useZoneHook();

  return (
    <section aria-label="Zone Name" className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Zone Title</h2>

      {isLoading && <SkeletonState />}
      {isError && <ErrorState onRetry={refetch} />}
      {data && <DataState data={data} />}
    </section>
  );
}
```

### List Row Pattern

All list-row sub-components are memoized:

```tsx
const RowComponent = memo(({ item }: { item: ItemType }) => (
  <div>...</div>
));
```

This prevents re-renders of individual rows when the parent component re-renders due to a background refetch returning identical data.

---

## 8. State Management

| State Type | Solution | Location |
|---|---|---|
| Server state (API data) | TanStack Query | `src/hooks/useQueries.ts` |
| Local UI state (clock) | `useState` + `useEffect` | `Header.tsx` |
| Global UI state | None required in v1 | — |

### TanStack Query Configuration

Configured in `src/main.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,      // Data considered fresh for 10s
      retry: 2,               // Retry failed requests twice
      refetchOnWindowFocus: false,  // No refetch on tab focus
    },
  },
});
```

Each hook overrides `refetchInterval` based on data volatility:

| Data | Interval | Rationale |
|---|---|---|
| Alerts, Timeline | 15s | High-frequency operational events |
| System Health | 20s | Service status changes frequently |
| Replay Jobs | 10s | Progress updates rapidly |
| Most zones | 30s | Balanced freshness vs. request volume |
| Forecast, Evidence | 60s | Low-frequency analytical data |

---

## 9. Performance Considerations

### Code Splitting

`ForecastPanel` is lazy-loaded to isolate the Recharts library (~344KB) from the main bundle:

```tsx
const ForecastPanel = lazy(() => import("@/components/dashboard/ForecastPanel"));
```

This reduces initial load time for users who may not scroll to the forecast zone immediately.

### Memoization

All list-row sub-components use `React.memo()`. This is critical because TanStack Query refetches run on intervals — without memoization, every row in every list would re-render every 15–30 seconds even when data has not changed.

### React Compiler

The project uses `babel-plugin-react-compiler` (configured in `vite.config.ts`), which automatically applies memoization optimizations at compile time.

### Bundle Size

| Chunk | Minified | Gzip |
|---|---|---|
| `index.js` | ~338KB | ~105KB |
| `ForecastPanel.js` | ~344KB | ~100KB |
| `index.css` | ~33KB | ~7KB |

The main bundle is loaded immediately. The forecast chart bundle is loaded on demand.
