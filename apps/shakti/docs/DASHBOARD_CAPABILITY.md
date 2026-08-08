# Dashboard Capability Documentation

## The `DashboardProvider` Model
The dashboard is no longer a static hardcoded grid. It is a configuration-driven capability.

> This configuration (`visible`/`colSpan` per zone, below) defines the **shipped default** layout. `src/pages/Dashboard.tsx` now renders that default through `@bhiv/dashboard-layout`'s `useLayoutEngine`/`DashboardGrid`, which additionally lets a user reorder and resize zones at runtime, persists their arrangement per browser, and lets them save/apply named layout templates — see `packages/dashboard-layout/README.md`.

### Configuration Schema
The reusable `DashboardProvider`/`useDashboardConfig` context now lives in `packages/dashboard-sdk/src/config/`; SHAKTI's concrete zone map and default values live in `src/types/dashboard.types.ts` and `src/config/dashboard.config.ts`, and are passed into the provider as `defaultConfig`.

```typescript
export interface DashboardConfig {
  branding: DashboardBranding;
  zones: {
    executiveSummary: ZoneConfig;
    operationsGrid: ZoneConfig;
    liveAlerts: ZoneConfig;
    riskHeatmap: ZoneConfig;
    telemetry: ZoneConfig;
    incidentQueue: ZoneConfig;
    operationalTimeline: ZoneConfig;
    systemHealth: ZoneConfig;
    runtimeSessions: ZoneConfig;
    evidencePanel: ZoneConfig;
  };
  features: DashboardFeatures;
  /** Drives `DashboardProvider`'s built-in `ThemeProvider` — no hardcoded theme mode. */
  theme: { mode: "dark" | "light" };
  /** Seeds `SectionNav`'s `NavigationEngine`; each item's `path` matches a zone id. */
  navigation: { items: { id: string; label: string; path: string; icon?: string }[] };
}

export interface ZoneConfig {
  visible: boolean;
  colSpan: string;
}
```

### Extending the Capability
To create a new view (e.g., a "Security Only" dashboard vs an "Executive Only" dashboard), you do not write new pages.
Instead, you pass a `config` prop to `DashboardLayout`:

```tsx
<DashboardLayout config={{
  zones: {
    executiveSummary: { visible: true, colSpan: "col-span-12" },
    operationsGrid: { visible: false, colSpan: "col-span-12" }
  }
}}>
  <Dashboard />
</DashboardLayout>
```

The deep-merge utility in `DashboardProvider` automatically resolves your overrides against the default configuration, allowing you to hide/show and resize layouts dynamically.
