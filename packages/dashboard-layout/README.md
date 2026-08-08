# @bhiv/dashboard-layout

A reusable, system-agnostic dashboard layout engine: a responsive 12-column
grid, zone placement, drag-and-drop reordering, drag-to-resize, per-dashboard
persistence, and layout templates. It depends only on `@bhiv/utils` and
`@bhiv/ui` — not on `@bhiv/dashboard-sdk` — so any app in this monorepo can
adopt it independently of the dashboard SDK.

## Why this exists

`apps/shakti`'s dashboard used to hardcode its zone order and Tailwind
`colSpan` classes directly in `src/pages/Dashboard.tsx`, rendered through
`@bhiv/dashboard-sdk`'s static `LayoutEngine`/`ZoneLayoutEngine`. This package
generalizes that into a standalone engine that any dashboard can plug in, and
adds the capability to actually rearrange and resize zones at runtime, with
the result remembered per browser and reusable as a named template.

**It ships with a default-safe guarantee:** until a user drags or resizes a
zone (or an app applies a saved template), `orderedZones` and `getSpanStyle`
reproduce exactly the order and `colSpan` you passed in — so replacing a
static grid with this engine changes nothing visually by default.

## Quick start

```tsx
import { DashboardGrid, LayoutEditToolbar, useLayoutEngine } from "@bhiv/dashboard-layout";
import type { LayoutZoneDefinition } from "@bhiv/dashboard-layout";

const zones: LayoutZoneDefinition[] = [
  { key: "summary", visible: true, colSpan: "col-span-12", order: 0, component: SummaryZone },
  { key: "alerts", visible: true, colSpan: "col-span-12 lg:col-span-7", order: 1, component: AlertsZone },
  { key: "health", visible: true, colSpan: "col-span-12 lg:col-span-5", order: 2, component: HealthZone },
];

function MyDashboard() {
  const engine = useLayoutEngine({ layoutId: "my-dashboard", zones });

  return (
    <>
      <LayoutEditToolbar engine={engine} className="mb-3" />
      <DashboardGrid
        engine={engine}
        renderZone={(zone) => {
          const Component = zone.component;
          return Component ? <Component /> : null;
        }}
      />
    </>
  );
}
```

That's the entire integration surface for the common case. `layoutId` scopes
persistence and templates to this dashboard — use a stable, unique string per
distinct dashboard in your app.

## API

### `useLayoutEngine(options)`

The core hook. Owns zone order, edit mode, persisted customization, and
templates.

| Option | Type | Description |
| --- | --- | --- |
| `layoutId` | `string` | Persistence/template key. Required. |
| `zones` | `LayoutZoneDefinition[]` | Shipped/default zones — single source of truth for defaults. |
| `version` | `number` (default `1`) | Bump to invalidate previously-saved layouts when the zone set's shape changes. |
| `persistence` | `PersistenceAdapter` | Custom storage backend. Defaults to `localStoragePersistence`. |

Returns `editMode`, `setEditMode`, `isReady`, `orderedZones`, `isCustomized`,
`getSpanStyle`, `getCols`, `reorder`, `resizeZone`, `resetLayout`,
`saveAsTemplate`, `applyTemplate`.

### `<DashboardGrid engine renderZone />`

High-level component wiring `GridLayoutEngine`, `LayoutZone`,
drag-to-reorder, and drag-to-resize around a `useLayoutEngine` result. This
is the fastest path to a fully-featured layout.

### `<GridLayoutEngine />` / `<LayoutZone />`

Low-level primitives — a 12-column grid container and a single zone wrapper
(error boundary + suspense + placement + optional drag/resize chrome). Use
these directly if you need more control than `DashboardGrid` gives you, or if
you're replacing a legacy `LayoutEngine`/`ZoneLayoutEngine` usage one zone at
a time.

### `<LayoutEditToolbar engine templates? />`

Optional, ready-to-drop-in toolbar: an edit-mode toggle, "Reset to Default",
"Save as Template", and a template picker. Entirely additive — build your own
UI against the same `useLayoutEngine` result if you'd rather place these
controls elsewhere (e.g. in an app header).

### Persistence

```ts
import type { PersistenceAdapter } from "@bhiv/dashboard-layout";

const myAdapter: PersistenceAdapter = {
  load: (layoutId) => fetch(`/api/layouts/${layoutId}`).then((r) => r.json()),
  save: (layoutId, layout) => fetch(`/api/layouts/${layoutId}`, { method: "PUT", body: JSON.stringify(layout) }),
  clear: (layoutId) => fetch(`/api/layouts/${layoutId}`, { method: "DELETE" }),
};
```

Pass a custom adapter via `useLayoutEngine({ ..., persistence: myAdapter })`
to back layouts with something other than `localStorage` (e.g. a per-user
API). All three methods may return a value directly or a `Promise`.

### Templates

`saveAsTemplate(name, description?)` snapshots the current arrangement
(persisted to `localStorage`, keyed by `layoutId`); `listSavedTemplates(layoutId)`
lists them; `applyTemplate(template)` restores one. Combine with any
app-defined built-in templates (plain `LayoutTemplate` objects) and pass the
merged list to `<LayoutEditToolbar templates={...} />`.

## Known limitations

- **Chrome is not yet theme-aware.** The drag handle, resize handle, and
  toolbar use fixed dark-palette Tailwind classes (`slate-*`, `indigo-*`)
  rather than reading `@bhiv/dashboard-sdk`'s `ThemeEngine` tokens. A
  light-themed or high-contrast consumer will get correct behavior but
  visually mismatched controls until this is wired up.
- **Resize is desktop-only.** A customized zone's column span applies at the
  `lg` breakpoint; below that it always renders full-width (`col-span-12`),
  matching the responsive pattern most existing zones already use. There's
  no independent `md`/`sm` span for a resized zone.
- **Drag-and-drop uses the HTML5 DnD API**, which has inconsistent touch
  support across mobile browsers. Resize uses `PointerEvent` (touch-capable)
  but hasn't been verified on an actual touch device.
- **Single verified consumer.** Only `apps/shakti` uses this package today.
  A second integration would be the real test of the generic `zones` contract.
