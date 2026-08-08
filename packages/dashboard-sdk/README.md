# @bhiv/dashboard-sdk

The reusable dashboard SDK: a composable `DashboardProvider`, hooks, and a
set of config-driven "framework" components for building widgets (cards,
KPIs, charts, tables, timelines), plus filters, theming, navigation, layout,
and template registries. Built on top of `@bhiv/ui` (generic primitives) and
`@bhiv/utils`.

See the root [README.md](../../README.md) for how this package fits into
the monorepo, and [packages/dashboard-layout/README.md](../dashboard-layout/README.md)
for the drag/resize/persistence grid engine used alongside it.

```tsx
import { DashboardProvider } from "@bhiv/dashboard-sdk";

<DashboardProvider config={myDashboardConfig}>
  <App />
</DashboardProvider>;
```

## Widget frameworks (`frameworks/`)

Config-driven building blocks for the content that goes *inside* a
`WidgetContainer` zone. Each one owns just its content type — composition
(loading/error/empty states, metadata footer) is `WidgetContainer`'s job.

| Framework | Renders | Notes |
| --- | --- | --- |
| `BaseCard` | Titled card shell (header, body, optional footer) | Generic widget wrapper when you don't need `WidgetContainer`'s runtime-status footer. |
| `MetricCardFramework` | A single label/value/change stat | Lightweight; for a full KPI grid see `KPIFrameworkGrid` below. |
| `KPIFrameworkGrid` | A responsive grid of KPI stats, each with an optional sparkline | Wraps `@bhiv/ui`'s `KPIGrid`/`KPIStat` and wires `GraphFramework` in as the sparkline automatically. |
| `GraphFramework` | A single-series area chart (recharts) | Dedicated area-chart primitive — kept separate from `ChartFramework` for backwards compatibility. |
| `ChartFramework` | Bar, line, pie, or donut charts (recharts) | One configurable component for every non-area chart kind; multi-series support for bar/line. |
| `BaseTableFramework<T>` | Column-config table | Thin, backward-compatible wrapper around `@bhiv/ui`'s `DataTable`. |
| `TimelineFramework` | A vertical event timeline with severity dots | For activity feeds, audit logs, incident timelines. |

### `KPIFrameworkGrid`

```tsx
<KPIFrameworkGrid
  columns={3}
  items={[
    {
      label: "Throughput", value: 1240, unit: "req/s", trend: "up", change: "+6.1%",
      sparklineData: last24hSeries, sparklineDataKey: "value",
    },
    { label: "Error Budget", value: "92", unit: "%", trend: "neutral", goal: "Target: > 90%" },
  ]}
/>
```

Use plain `KPIStat`/`KPIGrid` from `@bhiv/ui` directly if you don't need
the sparkline wiring or any dashboard-SDK context.

### `ChartFramework`

```tsx
<ChartFramework
  kind="bar"
  data={[{ region: "US", requests: 420 }, { region: "EU", requests: 310 }]}
  categoryKey="region"
  series={[{ dataKey: "requests", label: "Requests" }]}
/>

<ChartFramework
  kind="donut"
  data={[{ tier: "P0", count: 4 }, { tier: "P1", count: 12 }]}
  categoryKey="tier"
  series={[{ dataKey: "count" }]}
/>
```

`kind` is one of `"bar" | "line" | "pie" | "donut"`. Series colors default
to the design system's indigo/accent palette (`DEFAULT_CHART_PALETTE`) and
are overridable per-series via `series[i].color`. For a single-series area
chart, use `GraphFramework` instead.

## Widgets (`widget/`)

- `WidgetContainer` — the standard zone shell: title, header-right slot, loading skeleton, error/empty states with retry, and a metadata footer (runtime status, last-updated timestamp, trace id, data source, stale/fetching indicators).
- `WidgetRegistry` — register widget components by key so zones/templates can reference them by id instead of importing components directly.

## Filters (`filters/`)

- `FilterEngine` / `FilterProvider` / `useFilters` — state container for the full `FilterState` contract (search, status, severity, date range, sort, pagination, custom filters).
- `FilterBar` — single-row toolbar: search input + status chips + a conditional "Clear filters" action. Best for a page/table header.
- `FilterPanel` — expanded panel surface driving the *full* `FilterState` (search, status, severity, date range, sort direction), suited to a sidebar or drawer rather than an inline header. Purely presentational/controlled, like `FilterBar`.

```tsx
const { state, actions } = useFilters();

<FilterPanel
  state={state}
  onSearchChange={actions.setSearchQuery}
  statusOptions={[{ label: "Active", value: "active" }, { label: "Paused", value: "paused" }]}
  onToggleStatus={actions.toggleStatusFilter}
  sortOptions={[{ label: "Newest", value: "timestamp" }, { label: "Name", value: "name" }]}
  onSortChange={actions.setSort}
  onReset={actions.reset}
/>
```

## Also in this package

- **theme/** — `ThemeProvider`/`useTheme`, `PlatformDesignTokens`, and five built-in token sets (`dark`, `light`, `high-contrast`, `cyberpunk`, `emerald`).
- **navigation/** — `NavigationEngine`, `useNavigation`, built on `@bhiv/ui`'s `NavItem`.
- **layout/** — `LayoutEngine`/`ZoneLayoutEngine` (static zone rendering); for drag/resize/persistence, use `@bhiv/dashboard-layout` instead.
- **templates/** — `TemplateRegistry` plus `ExecutiveTemplate`/`OperationsTemplate` starting points.
- **config/** — `DashboardConfigProvider`, `useDashboardConfig`, `deepMerge`, the `DashboardConfig` contract.
- **sdk/** — `SDKProvider`/`useDashboardSDK`, the underlying event-bus/registry composition root that `DashboardProvider` wraps.

Command search/palette UI (`CommandPanel`), the standalone `SearchInput`,
and generic `Toolbar` primitives live in `@bhiv/ui` since they have no
dependency on dashboard-specific state — import them from there and wire
them to this package's hooks (e.g. `useNavigation`, `useDashboardSDK`) as
needed.
