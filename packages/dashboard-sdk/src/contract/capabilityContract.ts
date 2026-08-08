// ─── Capability Contract — Machine-Readable Mirror ────────────────────────────
// Typed constants mirroring `/CAPABILITY_CONTRACT.md`. Pure data and pure
// helper functions only — nothing here gates, wraps, or alters any existing
// class, hook, or component. Imported by nothing else in the SDK; consuming
// apps and tooling may import it to introspect the platform's stable
// contracts (e.g. a CI check that a new SDK event was documented). Keep this
// file and the root doc in sync.
//
// This follows the same "documentation-as-code, additive-only" pattern
// established by `registry/runtimeIdentity.ts` — see that file's own header
// and `/RUNTIME_IDENTITY.md` for the precedent.

import type {
  ConfigSchemaContract,
  ErrorContract,
  EventContract,
  ExtensionPointContract,
  RuntimeContract,
  SdkHookContract,
  VersionRule,
} from "./types";

/** Bump when any entry in this file's shape changes in a way that isn't purely additive. Independent of `@bhiv/dashboard-sdk`'s package.json version. */
export const CAPABILITY_CONTRACT_VERSION = "1.0.0";

// ─── Events In/Out ─────────────────────────────────────────────────────────────
// `DashboardSDK` (packages/dashboard-sdk/src/sdk) is the platform's event
// bus. `RuntimeConnector` (packages/dashboard-sdk/src/runtime) is the
// transport-agnostic poll/stream seam every backend connector rides on;
// its listener contract (`RuntimeConnectorListener<T>`) is per-connector,
// so it's documented here as a shape rather than a fixed event name list.

export const SDK_EVENT_CONTRACTS: EventContract[] = [
  {
    name: "config:updated",
    direction: "out",
    source: "DashboardSDK.updateConfig()",
    payloadType: "SDKDashboardConfig",
    description:
      "Emitted whenever the SDK-level runtime config (app title, version, environment, refresh interval, widget map) changes. SDKProvider subscribes to this to keep React state in sync.",
    stability: "stable",
  },
  {
    name: "widget:registered",
    direction: "out",
    source: "DashboardSDK.registerWidget()",
    payloadType: "SDKWidgetConfig",
    description: "Emitted after a widget config is added or replaced in the SDK's runtime widget map. `useWidget` subscribes per-id to re-render.",
    stability: "stable",
  },
  {
    name: "widget:unregistered",
    direction: "out",
    source: "DashboardSDK.unregisterWidget()",
    payloadType: "string (widgetId)",
    description: "Emitted after a widget config is removed from the SDK's runtime widget map.",
    stability: "stable",
  },
];

export const RUNTIME_CONNECTOR_EVENT_CONTRACT: EventContract = {
  name: "<connector data / error>",
  direction: "in",
  source: "RuntimeConnector.subscribe() / RuntimeConnector.onError()",
  payloadType: "T, { traceId?: string; receivedAt: number } (data) — unknown (error)",
  description:
    "Not a single named event: every RuntimeConnector instance polls its `poll()` function (or a pushed RuntimeStreamTransport once attached) and fans successful payloads out to `subscribe()` listeners, and thrown/rejected errors out to `onError()` listeners. This is the shared seam every BHIV service connector (Control Plane, Bucket, InsightFlow, NIYANTRAN, PRANA) rides on.",
  stability: "stable",
};

export const SERVICE_OBSERVABILITY_EVENT_CONTRACT: EventContract = {
  name: "<ServiceHealthSnapshot report>",
  direction: "in",
  source: "useReportServiceHealth()(snapshot) → ServiceObservabilityProvider",
  payloadType: "ServiceHealthSnapshot",
  description:
    "Each service's own health hook reports its snapshot; the provider only aggregates what it's told (never infers or fabricates). `useServiceObservability()` reads the aggregated `CrossServiceObservability` out the other side.",
  stability: "stable",
};

// ─── Config Schemas ────────────────────────────────────────────────────────────

export const CONFIG_SCHEMA_CONTRACTS: ConfigSchemaContract[] = [
  {
    schema: "DashboardConfig<TZones>",
    owner: "packages/dashboard-sdk/src/config/types.ts",
    description:
      "App-level config contract: branding, zones (app-supplied TZones map), features, theme, navigation. Generic over the app's own zone map shape.",
    mutationPath: "deepMerge(defaultConfig, overrides) inside DashboardConfigProvider, override-wins-on-conflict, arrays/non-plain values replaced wholesale.",
    stability: "stable",
  },
  {
    schema: "DashboardConfigOverride<TZones>",
    owner: "packages/dashboard-sdk/src/config/types.ts",
    description: "DeepPartial<DashboardConfig<TZones>> — consumers only specify the fields they want to change.",
    mutationPath: "Passed as DashboardProvider's `overrides` prop; merged once per [defaultConfig, overrides] identity via useMemo.",
    stability: "stable",
  },
  {
    schema: "SDKDashboardConfig",
    owner: "packages/dashboard-sdk/src/sdk/types.ts",
    description:
      "SDK-runtime config: appTitle, version, environment, refreshIntervalMs, and the live widgets map. Distinct from DashboardConfig — this is the event-bus-backed runtime state, not the static app config tree.",
    mutationPath: "DashboardSDK.updateConfig(patch) — shallow-merges patch, emits config:updated.",
    stability: "stable",
  },
  {
    schema: "WidgetDefinition",
    owner: "packages/dashboard-sdk/src/registry/types.ts",
    description: "Registration-time schema for one widget: id, version, category, capabilities, permission rule, loader/component, grid placement hints.",
    mutationPath: "WidgetRegistry.register() / registerMany() — immutable per id+version once registered; re-registering the same id+version throws.",
    stability: "stable",
  },
  {
    schema: "ProductLayout",
    owner: "packages/dashboard-sdk/src/registry/types.ts",
    description: "Named, per-product ordered list of zones referencing widgets by id (+ optional version pin).",
    mutationPath: "ProductLayoutRegistry.register(); bump ProductLayout.version when the zone set changes shape, to invalidate stale persisted client-side layouts.",
    stability: "stable",
  },
];

// ─── SDK Hooks ─────────────────────────────────────────────────────────────────

export const SDK_HOOK_CONTRACTS: SdkHookContract[] = [
  {
    name: "useDashboard",
    module: "packages/dashboard-sdk/src/hooks/useDashboard.ts",
    requiresProvider: "DashboardProvider",
    returns: "{ config, theme, sdk, sdkConfig }",
    description: "Primary read hook: resolved config + theme + SDK instance + SDK runtime config in one call.",
    stability: "stable",
  },
  {
    name: "useWidget",
    module: "packages/dashboard-sdk/src/hooks/useWidget.ts",
    requiresProvider: "DashboardProvider (SDKProvider)",
    returns: "{ widget, register, unregister, updateProps }",
    description: "Extension-point hook: reads/writes one widget's entry in the SDK's runtime widget registry; re-renders on widget:registered/unregistered for this id.",
    stability: "stable",
  },
  {
    name: "useDashboardConfig",
    module: "packages/dashboard-sdk/src/config/useDashboardConfig.ts",
    requiresProvider: "DashboardConfigProvider",
    returns: "DashboardConfig<TZones>",
    description: "Reads the merged (default ⊕ overrides) config tree.",
    stability: "stable",
  },
  {
    name: "useTheme",
    module: "packages/dashboard-sdk/src/theme/useTheme.ts",
    requiresProvider: "ThemeProvider",
    returns: "ThemeContextValue",
    description: "Current theme mode, resolved design tokens, and the setter to change mode.",
    stability: "stable",
  },
  {
    name: "useFilters",
    module: "packages/dashboard-sdk/src/filters/useFilters.ts",
    requiresProvider: "FilterProvider",
    returns: "FilterState + setters",
    description: "Shared cross-widget filter state (search, status/severity filters, date range, sort, pagination, custom filters).",
    stability: "stable",
  },
  {
    name: "useDashboardSDK",
    module: "packages/dashboard-sdk/src/sdk/useDashboardSDK.ts",
    requiresProvider: "SDKProvider",
    returns: "{ sdk, config }",
    description: "Lower-level escape hatch onto the raw DashboardSDK instance + its live SDKDashboardConfig.",
    stability: "stable",
  },
  {
    name: "useNavigation",
    module: "packages/dashboard-sdk/src/navigation/useNavigation.ts",
    requiresProvider: "none (reads globalNavigationEngine)",
    returns: "NavigationState + navigate()",
    description: "In-page section navigation resolved through the shared NavigationEngine; nav item `path` matches a zone id.",
    stability: "stable",
  },
  {
    name: "useProductLayout",
    module: "packages/dashboard-sdk/src/registry/useProductLayout.ts",
    requiresProvider: "none (reads globalDashboardRegistry by default)",
    returns: "ResolvedLayoutZone[]",
    description: "Memoized wrapper around DashboardRegistry.resolveProductLayout() for a given product+layoutId+options.",
    stability: "stable",
  },
  {
    name: "useReportServiceHealth / useServiceObservability",
    module: "packages/dashboard-sdk/src/runtime/ServiceObservability.tsx",
    requiresProvider: "ServiceObservabilityProvider (report is a safe no-op outside it)",
    returns: "(snapshot) => void  /  CrossServiceObservability",
    description: "Publish/read one service's health snapshot into the shared cross-service observability aggregate.",
    stability: "stable",
  },
];

// ─── Error Contracts ───────────────────────────────────────────────────────────
// Normalizes the error handling already implemented ad hoc across
// apps/shakti's typed API clients (client.ts, niyantranEndpoints.ts,
// insightflowEndpoints.ts) into one documented contract. Existing files are
// unchanged — this describes the contract they already honor today so new
// clients (or a future shared classifier) can conform to the same codes.

export const ERROR_CONTRACTS: ErrorContract[] = [
  {
    code: "ENDPOINT_NOT_FOUND",
    raisedBy: ["apps/shakti/src/api/client.ts (HTTP 404)"],
    surfacedAs: 'Error("Endpoint not found: <url>")',
    recommendedHandling: "Treat as a permanent capability gap for this deployment — do not retry; hide or gray out the dependent widget.",
    stability: "stable",
  },
  {
    code: "SERVICE_UNAVAILABLE",
    raisedBy: ["apps/shakti/src/api/client.ts (HTTP 503)"],
    surfacedAs: 'Error("Service unavailable: <url>")',
    recommendedHandling: "Transient — the polling connector's next tick will retry automatically; surface a degraded state, not a hard error.",
    stability: "stable",
  },
  {
    code: "REQUEST_TIMEOUT",
    raisedBy: ["apps/shakti/src/api/client.ts, insightflowEndpoints.ts, niyantranEndpoints.ts (AxiosError.code === 'ECONNABORTED')"],
    surfacedAs: 'Error("Request timeout: <url>") or logged and swallowed (service-specific clients)',
    recommendedHandling: "Transient — safe to retry on next poll interval; do not increase request frequency in response.",
    stability: "stable",
  },
  {
    code: "NETWORK_ERROR",
    raisedBy: ["apps/shakti/src/api/client.ts, insightflowEndpoints.ts, niyantranEndpoints.ts (no error.response)"],
    surfacedAs: 'Error("Network error — cannot reach control plane at <baseURL>") or logged and a resilient default returned',
    recommendedHandling: "Report ConnectionState \"offline\" for the owning service via useReportServiceHealth; do not block unrelated zones.",
    stability: "stable",
  },
  {
    code: "UNAUTHORIZED",
    raisedBy: ["apps/shakti/src/api/niyantranEndpoints.ts (HTTP 401)"],
    surfacedAs: "Logged warning; caller receives the rejected promise or a resilient empty default depending on the fetch function.",
    recommendedHandling: "Prompt for re-auth (x-auth-token) rather than retrying with the same credentials.",
    stability: "stable",
  },
  {
    code: "FORBIDDEN",
    raisedBy: ["apps/shakti/src/api/niyantranEndpoints.ts (HTTP 403)"],
    surfacedAs: "Logged warning; caller receives a resilient empty default (e.g. fetchNiyantranAims returns []).",
    recommendedHandling: "Treat as a permissions gap, not an outage — do not report the owning service as offline.",
    stability: "stable",
  },
  {
    code: "WIDGET_RENDER_ERROR",
    raisedBy: ["packages/ui/src/ErrorBoundary.tsx (componentDidCatch)"],
    surfacedAs: "Caught by the nearest ErrorBoundary; the crashed zone renders a fallback card with a Reload Zone action instead of unmounting the app.",
    recommendedHandling: "Wrap every independently-rendered zone/widget in its own ErrorBoundary so one bad widget can't take down the dashboard.",
    stability: "stable",
  },
  {
    code: "DUPLICATE_REGISTRATION",
    raisedBy: ["packages/dashboard-sdk/src/registry/WidgetRegistry.ts (register())"],
    surfacedAs: 'Error("Widget \\"<id>@<version>\\" is already registered.") — thrown synchronously',
    recommendedHandling: "Registration-time only, not a runtime/network condition — caller (usually a widgets.registry.ts bootstrap module) must catch or avoid re-registering the same id+version.",
    stability: "stable",
  },
];

// ─── Extension Points ──────────────────────────────────────────────────────────

export const EXTENSION_POINT_CONTRACTS: ExtensionPointContract[] = [
  {
    name: "WidgetRegistry",
    module: "packages/dashboard-sdk/src/registry/WidgetRegistry.ts",
    extendWith: "WidgetDefinition (register / registerMany)",
    effect: "Widget becomes discoverable (discover/getByCategory/getByCapability/getByProduct) and resolvable to a component (resolveComponent), across every consuming app.",
    stability: "stable",
  },
  {
    name: "ProductLayoutRegistry",
    module: "packages/dashboard-sdk/src/registry/ProductLayoutRegistry.ts",
    extendWith: "ProductLayout (register)",
    effect: "New named per-product layout becomes resolvable via DashboardRegistry.resolveProductLayout(product, layoutId).",
    stability: "stable",
  },
  {
    name: "CapabilityRuntime",
    module: "packages/dashboard-sdk/src/registry/CapabilityRuntime.ts",
    extendWith: "capability id (activate / deactivate / setActiveCapabilities)",
    effect: "Gates widgetIsAvailable() for every widget that declares that capability; broadcasts to subscribe() listeners.",
    stability: "stable",
  },
  {
    name: "TemplateRegistry",
    module: "packages/dashboard-sdk/src/templates/TemplateRegistry.ts",
    extendWith: "RegisteredTemplate",
    effect: "New reusable dashboard page template becomes available alongside the built-in Executive/Operations templates.",
    stability: "stable",
  },
  {
    name: "NavigationEngine",
    module: "packages/dashboard-sdk/src/navigation/NavigationEngine.ts",
    extendWith: "DashboardNavItem (via DashboardConfig.navigation.items)",
    effect: "New in-page nav entry that scrolls to the matching zone id (#zone-<id>).",
    stability: "stable",
  },
  {
    name: "Frameworks (Card / Table / Graph / Timeline)",
    module: "packages/dashboard-sdk/src/frameworks/*",
    extendWith: "Props conforming to BaseCardProps / BaseTableFrameworkProps / GraphFrameworkProps / TimelineFrameworkProps",
    effect: "New widget UI built on the same primitives the built-in widgets use, without depending on any app-specific type.",
    stability: "stable",
  },
  {
    name: "RuntimeStreamTransport",
    module: "packages/dashboard-sdk/src/runtime/types.ts",
    extendWith: "{ connect(onMessage, onError), disconnect() } passed to RuntimeConnector.attachTransport()",
    effect: "Upgrades a connector from polling to push delivery (WebSocket/SSE/etc.) with zero changes to any subscribe() call site.",
    stability: "stable",
  },
  {
    name: "LineageSource",
    module: "packages/dashboard-sdk/src/runtime/traceLineage.ts",
    extendWith: "{ sourceType, records, getTraceId, getId, getLabel, getTimestamp, getStatus? }",
    effect: "New record type participates in buildTraceLineage()'s cross-source trace correlation without that function needing to know its shape.",
    stability: "stable",
  },
  {
    name: "DashboardConfig zones (TZones generic)",
    module: "packages/dashboard-sdk/src/config/types.ts",
    extendWith: "App-defined Record<string, DashboardZoneConfig>",
    effect: "Every app supplies its own concrete zone map — the config/theme/navigation engines work against any shape via the TZones generic.",
    stability: "stable",
  },
];

// ─── Version Rules ─────────────────────────────────────────────────────────────

export const VERSION_RULES: VersionRule[] = [
  {
    subject: "@bhiv/dashboard-sdk / @bhiv/dashboard-layout package version",
    rule: "0.x — pre-1.0. Treat any change as potentially breaking until 1.0.0; consuming apps pin via workspace `*` today (single-repo), so breaking changes must be coordinated with apps/shakti in the same change, not shipped independently.",
    enforcement: "package.json",
  },
  {
    subject: "WidgetDefinition.version",
    rule: 'Semver-ish "x.y.z" string, compared numerically per segment (compareVersions in WidgetRegistry). Multiple versions of the same widget id may be registered simultaneously; the registry keeps the latest by default. Zones may pin an older version via ProductLayoutZone.version — pinned versions must remain registered for as long as any layout references them.',
    enforcement: "code",
  },
  {
    subject: "ProductLayout.version",
    rule: "Bump this integer whenever a layout's zone set changes shape (zones added/removed/renamed). Consumed by @bhiv/dashboard-layout's persisted client-side layouts to invalidate stale saved state — not enforced by ProductLayoutRegistry itself.",
    enforcement: "convention",
  },
  {
    subject: "REST endpoint response shapes (all services)",
    rule: "Additive-only: new optional response fields are backward compatible. Removing or renaming a field, or changing its type, is a breaking change and must be reflected in the corresponding `@/types/*.ts` type and called out in `/API.md`. Every typed client already tolerates missing optional fields via `??` fallbacks — new fields should follow that same defensive-read pattern on the client side.",
    enforcement: "convention",
  },
  {
    subject: "SDK event payloads (config:updated, widget:registered, widget:unregistered)",
    rule: "Payload shape changes must be additive (new optional fields) within a minor version. Renaming an event or changing an existing field's type is breaking and requires a major version bump of @bhiv/dashboard-sdk.",
    enforcement: "convention",
  },
  {
    subject: "DashboardConfig<TZones> top-level keys",
    rule: "branding / zones / features / theme / navigation are stable; adding a new top-level key is additive. deepMerge only recurses into plain objects, so array-typed config fields are replaced wholesale by overrides, never merged element-wise — keep that in mind when adding new array-shaped config.",
    enforcement: "code",
  },
];

// ─── Single Contract Export ─────────────────────────────────────────────────────
// One aggregated object bundling every SDK-level contract above, for
// tooling/CI that wants a single import instead of six. Not consumed by
// anything else in this file or the SDK — a pure re-grouping of the
// constants already exported individually above.

export const RUNTIME_CONTRACT: RuntimeContract = {
  version: CAPABILITY_CONTRACT_VERSION,
  events: {
    sdk: SDK_EVENT_CONTRACTS,
    runtimeConnector: RUNTIME_CONNECTOR_EVENT_CONTRACT,
    serviceObservability: SERVICE_OBSERVABILITY_EVENT_CONTRACT,
  },
  configSchemas: CONFIG_SCHEMA_CONTRACTS,
  hooks: SDK_HOOK_CONTRACTS,
  errors: ERROR_CONTRACTS,
  extensionPoints: EXTENSION_POINT_CONTRACTS,
  versionRules: VERSION_RULES,
};

// ─── Version-rule helpers ──────────────────────────────────────────────────────
// Small, pure, additive helpers for consumers who want to check version rules
// programmatically (e.g. a CI check or a runtime warning) instead of just
// reading the table above. Not wired into any existing class or hook.

/** Parses a "x.y.z"-style version string into its numeric segments (missing/non-numeric segments become 0). */
export function parseVersionSegments(version: string): number[] {
  return version.split(".").map((segment) => parseInt(segment, 10) || 0);
}

/**
 * True if `candidate` is backward compatible with `baseline` under semver
 * conventions (same major version, candidate >= baseline). Useful for
 * checking a WidgetDefinition.version bump, a package.json version, or a
 * ProductLayout.version against the rules above before registering it.
 */
export function isBackwardCompatibleVersion(baseline: string, candidate: string): boolean {
  const base = parseVersionSegments(baseline);
  const next = parseVersionSegments(candidate);
  const major = (arr: number[]) => arr[0] ?? 0;
  if (major(next) !== major(base)) return false;

  const length = Math.max(base.length, next.length);
  for (let i = 0; i < length; i++) {
    const diff = (next[i] ?? 0) - (base[i] ?? 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return true; // equal versions are trivially compatible
}
