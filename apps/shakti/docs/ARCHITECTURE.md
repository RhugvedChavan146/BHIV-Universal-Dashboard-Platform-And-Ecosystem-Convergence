# Architecture & Reusable Platform Capabilities

## 1. Canonical Repository Structure
The project follows a unified, single canonical repository folder structure under `src/`:

```
src/
├── api/              # Axios HTTP client & endpoint interfaces
├── components/
│   ├── ui/           # Shared Design System Primitives (Badge, Button, Card, Separator, Skeleton, Tooltip)
│   ├── dashboard/    # Operational dashboard layouts, cards, & primitives
│   └── ErrorBoundary # Zone crash recovery wrapper
├── platform/         # Domain-Agnostic Reusable Platform Capabilities Layer
│   ├── theme/        # Design Tokens, Theme Engine, & ThemeProvider
│   ├── sdk/          # Dashboard SDK, Event Bus, & SDKProvider
│   ├── layout/       # Layout Engine, 12-Column Grid, & ZoneLayoutEngine
│   ├── widget/       # Widget Container Shell (5 lifecycle states) & WidgetRegistry
│   ├── filters/      # Filter Engine, FilterProvider, & FilterBar UI
│   ├── frameworks/   # Card, Table, Graph, and Timeline Frameworks
│   ├── navigation/   # Navigation Engine, NavBar UI, & Route Manager
│   └── templates/    # Pre-built Dashboard Templates & TemplateRegistry
├── config/           # App & zone layout configurations
├── hooks/            # TanStack Query & operational custom hooks
├── layouts/          # Root application layouts
├── lib/              # Core utility functions (cn, clsx, tailwind-merge)
├── pages/            # Page-level route views (Dashboard.tsx)
├── types/            # TypeScript domain & runtime definitions
└── utils/            # Data mappers & logger utilities
```

## 2. Reusable Platform Capabilities
All platform engines and frameworks are domain-agnostic, extensible, and completely decoupled from domain logic:

- **Design Tokens & Theme Engine (`src/platform/theme/`)**: Provides dynamic theme switching (`dark`, `light`, `high-contrast`, `cyberpunk`, `emerald`), CSS variable injection, and `useTheme()`.
- **Dashboard SDK (`src/platform/sdk/`)**: Central event bus, widget registration, and config serialization.
- **Layout Engine (`src/platform/layout/`)**: 12-column dynamic grid renderer, density controls (`compact`, `standard`, `relaxed`), and `ZoneLayoutEngine`. Still present and unchanged for any consumer using it directly, but `src/pages/Dashboard.tsx` no longer renders through it directly — see the note in Layer 4 below.
- **Widget Framework (`src/platform/widget/`)**: 5-state lifecycle container (`LIVE`, `STALE`, `OFFLINE`, `LOADING`, `EMPTY`) and global `WidgetRegistry`.
- **Filters Framework (`src/platform/filters/`)**: State engine for searching, tag multi-select, sort/pagination, and `FilterBar` UI.
- **Visualization Frameworks (`src/platform/frameworks/`)**:
  - Card Framework (`BaseCard`, `MetricCardFramework`)
  - Table Framework (`BaseTableFramework`)
  - Graph Framework (`GraphFramework` with Recharts)
  - Timeline Framework (`TimelineFramework`)
- **Navigation Engine (`src/platform/navigation/`)**: Route manager, active state tracking, and `NavBar` UI.
- **Dashboard Templates (`src/platform/templates/`)**: Pre-built operational overview templates.

## 3. Component Architecture
- **Layer 1: Design System Primitives (`src/components/ui/`)**: Reusable UI primitives (`Badge`, `Button`, `Card`, `Separator`, `Skeleton`, `Tooltip`).
- **Layer 2: Platform Frameworks (`src/platform/frameworks/`)**: Domain-agnostic cards, tables, graphs, and timeline containers.
- **Layer 3: Operational Primitives & Layouts (`src/components/dashboard/`)**: Specific operational layout components composing platform primitives.
- **Layer 4: Dashboard Grid (`src/pages/Dashboard.tsx`)**: Orchestrates zone rendering via `@bhiv/dashboard-layout`'s `useLayoutEngine` + `DashboardGrid` (drag-and-drop reordering, drag-to-resize, per-browser persistence, and layout templates), instead of calling `LayoutEngine`/`ZoneLayoutEngine` directly. The default render order and column spans are unchanged from before — the new engine only adds capability once a user opts into edit mode via the `LayoutEditToolbar`.

## 4. Resilience Architecture
- **Zone Isolation:** Every zone in the grid is wrapped in a discrete `<ErrorBoundary>` — via `@bhiv/dashboard-layout`'s `LayoutZone` in `src/pages/Dashboard.tsx` (the same isolation contract `ZoneLayoutEngine` provided).
- **Graceful Degradation:** Cached data fallback with stale warnings if API calls fail or offline state is detected.
- **Cross-Platform Compatibility:** Builds cleanly on Windows, Linux, and macOS.
