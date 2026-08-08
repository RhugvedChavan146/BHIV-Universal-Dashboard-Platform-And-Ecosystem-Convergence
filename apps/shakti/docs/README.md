# BHIV Dashboard Platform (monorepo)

This is an npm-workspaces monorepo. It was converted from a single Vite app
(`shakti-command-center`) by extracting the reusable, domain-agnostic parts
of that app into standalone packages, while leaving the SHAKTI app itself
fully intact and working.

```
apps/
  shakti/                 SHAKTI Runtime Integration & Operational Command
                          Center — the original app, now consuming the
                          packages below instead of local copies of the code.
packages/
  utils/        (@bhiv/utils)               framework-agnostic helpers:
                                             cn(), logger, perf reporting,
                                             mergeClassNames, useResponsive
  ui/           (@bhiv/ui)                  generic UI primitives: Badge,
                                             Button, Card, Separator,
                                             Skeleton, Tooltip, ErrorBoundary
  dashboard-sdk/ (@bhiv/dashboard-sdk)      the reusable dashboard SDK:

                                             - `DashboardProvider` — single
                                               root provider composing
                                               config + theme + filters + the
                                               SDK event bus
                                             - hooks — `useDashboard`,
                                               `useWidget`, `useFilters`,
                                               `useTheme`, `useDashboardConfig`,
                                               `useDashboardSDK`, `useNavigation`
                                             - utilities — `formatTimestamp`,
                                               plus curated re-exports of
                                               `cn`, `logger`, `useResponsive`,
                                               etc. from `@bhiv/utils`
                                             - config — the `DashboardConfig`
                                               contract, `deepMerge`,
                                               `DashboardConfigProvider`
                                             - extensions — `WidgetRegistry`,
                                               `TemplateRegistry`,
                                               `NavigationEngine`, and the
                                               card/table/graph/timeline
                                               frameworks for building new
                                               widgets and zones
                                             - the underlying domain modules
                                               (theme, filters, sdk, widget,
                                               layout, navigation, templates,
                                               frameworks) are also exported
                                               directly for standalone use
  dashboard-layout/ (@bhiv/dashboard-layout) reusable, system-agnostic grid
                                             layout engine: zone placement,
                                             drag-and-drop reordering,
                                             drag-to-resize, per-dashboard
                                             persistence, and layout
                                             templates. See
                                             `packages/dashboard-layout/README.md`.
```

## What moved and why

Only code with **no coupling to SHAKTI's domain types or API shape** was
moved into `packages/`. Anything that talks to SHAKTI's specific backends
(Niyantran, Prana, Bucket, InsightFlow), or renders SHAKTI-specific
dashboard zones, stayed in `apps/shakti`.

Dependency direction: `@bhiv/utils` → `@bhiv/ui` → `@bhiv/dashboard-sdk`
→ `apps/shakti`. `@bhiv/dashboard-layout` depends only on `@bhiv/utils`
and `@bhiv/ui` (not on `@bhiv/dashboard-sdk`), so it can be adopted by any
app in this monorepo independently of the dashboard SDK. Nothing in
`packages/` imports from `apps/shakti`.

`packages/dashboard-sdk` (formerly `dashboard-platform`) is the single
public SDK surface: `apps/shakti` mounts one `<DashboardProvider>` at the
root of `DashboardLayout` and reads everything else through the SDK's
hooks (e.g. `useDashboard` in `Header.tsx`) instead of importing internal
engines directly.

## Getting started

```bash
npm install                 # installs and links all workspaces
npm run dev                 # runs the SHAKTI app dev server
npm run build                # builds every workspace (packages, then the app)
npm run typecheck            # typechecks every workspace
npm run lint                 # lints the whole monorepo
npm run format                # formats the whole monorepo with Prettier
npm test                     # runs the SHAKTI app's vitest suite
```

Workspace-scoped equivalents, if you only want one piece:

```bash
npm run build --workspace=shakti-command-center
npm run typecheck --workspace=@bhiv/dashboard-sdk
```

## How the packages are consumed

Each package's `package.json` points `main`/`types`/`exports` straight at
`src/index.ts` (not `dist/`). Vite transpiles TypeScript on the fly, so
`apps/shakti` picks up package source directly through the workspace
symlinks in `node_modules/@bhiv/*` — no package build step is required
for local development or for `vite build`.

Each package still has its own `build` script (`tsc`, emitting declaration
files to `dist/`) for standalone type-checking of the package boundary and
in case you want to publish a package outside this monorepo later — it just
isn't wired into how `apps/shakti` resolves the import today.

## Known pre-existing issues (not introduced by this restructuring)

These were verified against the original single-app repo before conversion
and are unchanged:

- `src/test/DecisionIntelligenceLayout.test.tsx` and part of
  `src/test/layouts.test.tsx` (5 tests total) fail with
  `No QueryClient set, use QueryClientProvider to set one` — the test
  files render these layouts without wrapping them in a
  `QueryClientProvider`.

`useDashboardConfig` and the config-only provider (now `DashboardConfigProvider`)
were extracted to `packages/dashboard-sdk/src/config/` (split into separate
files per export), which also resolves the
`react-refresh/only-export-components` warning that previously applied to
the combined `src/components/dashboard/DashboardProvider.tsx`.

One bug **was** fixed as part of this work: `TemplateRegistry.ts` imported
a `./ExecutiveTemplate` file that did not exist anywhere in the original
repo, which made `tsc -b` fail outright. A minimal `ExecutiveTemplate`
(mirroring the existing `OperationsTemplate`) was added to
`packages/dashboard-sdk/src/templates/` so the whole workspace builds.

`packages/dashboard-platform` was subsequently consolidated into
`packages/dashboard-sdk`: the internal engines (theme, filters, SDK event
bus, widget/template/navigation registries, layout, frameworks) are
unchanged, but they're now fronted by one composed `DashboardProvider` and
a curated `hooks` / `utilities` / `extensions` API. The old config-level
`DashboardProvider` was renamed `DashboardConfigProvider` to make room for
the new composed `DashboardProvider` at the package root — `apps/shakti`
only ever imports the top-level one, so the rename is transparent to the
app.

`packages/dashboard-layout` replaces the static grid previously rendered
directly by `apps/shakti/src/pages/Dashboard.tsx` (which used
`@bhiv/dashboard-sdk`'s `LayoutEngine`/`ZoneLayoutEngine` with a hardcoded
zone order and fixed Tailwind `colSpan` classes). `Dashboard.tsx` now
builds a `LayoutZoneDefinition[]` from the same zone config it always
read, and hands it to `useLayoutEngine` + `DashboardGrid` from
`@bhiv/dashboard-layout`. Until a user drags or resizes a zone, the
rendered grid is unchanged from before — the new package only adds
capability (reordering, resizing, persistence, templates), it doesn't
alter the shipped default layout. `@bhiv/dashboard-sdk`'s own
`LayoutEngine`/`ZoneLayoutEngine` were left in place, unmodified, for any
other consumer still using them directly.

## Shared tooling

- `tsconfig.base.json` — shared compiler options, extended by every
  package/app's own `tsconfig.json`.
- `eslint.config.js` — shared flat ESLint config for the whole monorepo.
- `.prettierrc.json` / `.prettierignore` — shared formatting rules.
