# @bhiv/ui

Generic, domain-agnostic UI primitives shared by every dashboard built on
this platform. Every component is a typed React function component styled
with Tailwind utility classes via `cn()` (from `@bhiv/utils`), following the
dark slate/indigo surface language used across the whole monorepo — no
component here knows anything about SHAKTI or any other specific app.

Import everything from the package root:

```tsx
import { Card, Button, KPIStat, Toolbar, SearchInput, CommandPanel } from "@bhiv/ui";
```

## Design language (for anyone adding a new component here)

- Surfaces: `bg-slate-800/60` / `bg-slate-900/40` / `bg-slate-900/50`, bordered with `border-slate-700/50` or `border-slate-800`.
- Text: `text-slate-200` (primary), `text-slate-400` (secondary), `text-slate-500`/`600` (muted), `font-mono` for numeric/technical content.
- Accent/interactive: indigo (`indigo-400`/`500`/`600`).
- Semantic tones: emerald (success), amber/yellow (warning), orange (caution), red (danger), blue (info) — centralized in `status.tsx`'s `StatusTone` maps; reuse those maps instead of hardcoding new color combinations.
- All interactive elements get `focus:outline-none focus:ring-1 focus:ring-indigo-500` for keyboard-accessible focus states.
- Every component accepts `className` and forwards it last through `cn()` so callers can override/extend styling without forking the component.

## Component reference

### Layout & structure

| Component | Purpose |
| --- | --- |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Generic bordered content container. |
| `Separator` | Horizontal/vertical divider line. |
| `Skeleton` | Pulsing placeholder block for loading states. |
| `ErrorBoundary` | Class-based React error boundary with a themed fallback. |

### Navigation

| Component | Purpose |
| --- | --- |
| `NavBar`, `NavItem` | Top app bar: brand, route links with active state, badges, right-aligned slot. |
| `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarSection`, `SidebarItem`, `SidebarFooter` | Collapsible left rail navigation. |
| `Toolbar`, `ToolbarGroup`, `ToolbarSpacer`, `ToolbarSeparator`, `ToolbarButton` | Generic, responsive action bar for page/table/widget-level commands. Wraps on narrow viewports; `ToolbarSpacer` pushes trailing groups to the far edge. |
| `CommandPanel`, `useCommandPanel`, `CommandItem` | Keyboard-navigable "⌘K"-style command palette (portal-rendered modal, Arrow Up/Down + Enter + Escape, grouped results, custom filtering). |

### Forms & input

| Component | Purpose |
| --- | --- |
| `Button` | Primary/secondary/destructive/outline/ghost/link variants, 5 sizes. |
| `SearchInput` | Standalone controlled/uncontrolled search field with clear button and shortcut hint. |
| `SearchResults`, `SearchResultItem` | Grouped, keyboard-highlightable result list — pairs with `SearchInput` for search-as-you-type dropdowns. |

### Data display

| Component | Purpose |
| --- | --- |
| `Badge` | Small labeled pill, 7 semantic variants. |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableEmpty` | Low-level table primitives for bespoke layouts. |
| `DataTable<T>`, `DataTableColumn<T>` | Column-config driven table — the common case; handles empty state automatically. |
| `Tooltip` | Hover tooltip. Also exports headless `TooltipProvider`/`TooltipTrigger`/`TooltipContent` for custom composition. |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | Portal-rendered modal, controlled or uncontrolled, Escape-to-close, backdrop click. |

### Status & metrics

| Component | Purpose |
| --- | --- |
| `StatusDot`, `StatusBadge`, `ProgressBar` | Building blocks for "is this thing healthy" UI. |
| `StatusIndicatorRow` | Dot + label + metric columns + trailing status text (health-check list row). |
| `ProgressStatusRow` | Dot + label + progress bar + percentage + trailing status text (job/task progress row). |
| `TONE_TEXT`, `TONE_DOT`, `TONE_BAR`, `TONE_SURFACE`, `StatusTone` | The single source of truth for tone→color mapping. Map any domain enum (severity, health, etc.) to a `StatusTone` once and reuse these. |
| `KPIStat`, `KPIGrid`, `KPITrend` | Key-metric stat block (value, unit, trend/change, optional icon, optional goal caption, optional sparkline slot) and its responsive grid container. |

## Notable components in detail

### `Toolbar`

```tsx
<Toolbar>
  <ToolbarGroup>
    <ToolbarButton icon={Plus} onClick={onCreate}>New</ToolbarButton>
    <ToolbarButton icon={RefreshCw} iconOnly aria-label="Refresh" onClick={onRefresh} />
  </ToolbarGroup>
  <ToolbarSpacer />
  <ToolbarGroup>
    <ToolbarButton icon={Filter} active={filtersOpen} onClick={toggleFilters}>Filters</ToolbarButton>
  </ToolbarGroup>
</Toolbar>
```

`dense` shrinks vertical padding for compact contexts (e.g. inside a widget header).

### `SearchInput` / `SearchResults`

```tsx
<SearchInput value={query} onChange={setQuery} placeholder="Search deployments..." shortcutHint="/" />
<SearchResults results={results} activeIndex={activeIndex} onSelect={handleSelect} />
```

`SearchInput` is intentionally decoupled from any results UI — combine it
with `SearchResults`, a `<DataTable>`, or a custom list depending on the
context. `FilterBar` (in `@bhiv/dashboard-sdk`) uses an inline search field
of its own for the single-row filter-bar case; reach for `SearchInput`
whenever search needs to stand alone or feed a dropdown.

### `CommandPanel`

```tsx
const panel = useCommandPanel();

useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      panel.toggle();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [panel]);

<CommandPanel
  open={panel.open}
  onOpenChange={panel.setOpen}
  items={[
    { id: "new", label: "Create dashboard", group: "Actions", icon: Plus, onSelect: createDashboard },
    { id: "home", label: "Go to Overview", group: "Navigation", hint: "/", onSelect: () => navigate("/") },
  ]}
/>
```

The trigger shortcut is intentionally left to the host app (`useCommandPanel`
only holds `open` state) since the right shortcut/scope varies per app.
Pass `filterItems` to override the built-in case-insensitive label/keyword
match with fuzzy or server-side search.

### `KPIStat` / `KPIGrid`

```tsx
<KPIGrid columns={3}>
  <KPIStat label="Active Sessions" value={1284} trend="up" change="+4.2%" icon={Users} />
  <KPIStat label="Error Rate" value="0.42" unit="%" trend="down" change="-0.1pp" tone="success" />
  <KPIStat label="P95 Latency" value={212} unit="ms" trend="neutral" goal="< 250ms" />
</KPIGrid>
```

`trend` drives the default color (`up` → success, `down` → danger); pass
`tone` explicitly when a rising number is actually bad (e.g. an error
rate) so the color isn't misleading. `sparkline` accepts any `ReactNode` —
in `@bhiv/dashboard-sdk`, `KPIFrameworkGrid` wires this up to
`GraphFramework` automatically from a data series.

## Responsiveness

- `KPIGrid` collapses from `columns` down to a single column below the `sm` breakpoint.
- `Toolbar` and its groups wrap (`flex-wrap`) instead of overflowing on narrow viewports.
- `Sidebar` supports a `collapsed` icon-rail mode for narrow layouts; pair with `@bhiv/utils`'s `useResponsive()` to drive it automatically.
- `Table`/`DataTable` scroll horizontally (`overflow-x-auto`) rather than compressing columns illegibly.
- `CommandPanel` and `Dialog` cap their width (`max-w-lg` / `max-w-md`) and add viewport padding so they never touch the screen edges on mobile.
