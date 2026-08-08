# Capability Contract — BHIV Dashboard Platform

**Status: STABLE.** This document names the platform's runtime contracts —
the surfaces other code (widgets, apps, future BHIV products) can build
against and expect to keep working across minor versions. Like
[`RUNTIME_IDENTITY.md`](./RUNTIME_IDENTITY.md), it is a factual snapshot of
what already exists in `packages/dashboard-sdk` and `apps/shakti` — **no
existing behavior, interface, or file was changed to produce this
document.** See [What changed](#what-changed) at the bottom for the
additive-only code that mirrors it.

Machine-readable mirror: `packages/dashboard-sdk/src/contract/capabilityContract.ts`
(exported as `SDK_EVENT_CONTRACTS`, `CONFIG_SCHEMA_CONTRACTS`,
`SDK_HOOK_CONTRACTS`, `ERROR_CONTRACTS`, `EXTENSION_POINT_CONTRACTS`,
`VERSION_RULES`, and the single aggregated `RUNTIME_CONTRACT`, from
`@bhiv/dashboard-sdk`) and `apps/shakti/src/api/contract.ts`
(`ALL_SHAKTI_API_ENDPOINTS` and the single aggregated `SHAKTI_API_CONTRACT`)
for the REST surface. Keep the docs and the code in sync — see
[`API.md`](./API.md) for the full per-service REST catalog.

For **why** the platform is shaped this way (Discovery / Agent Selector /
Dependency-Compatibility Engine / Composition Engine / Runtime Config
Generator), see `RUNTIME_IDENTITY.md`. This document is the complementary
**contract** layer: what a consumer can plug into and rely on.

---

## 1. REST APIs

The dashboard platform (`@bhiv/dashboard-sdk`, `@bhiv/dashboard-layout`) is
**transport-agnostic and owns no REST endpoints of its own** — it is a
frontend SDK. REST is owned by each consuming app's typed API clients.
SHAKTI's clients (`apps/shakti/src/api/*.ts`) wrap five backend services;
the full endpoint-by-endpoint catalog — paths, response types,
normalization, and resilience — lives in **[`API.md`](./API.md)**.

Contract-level guarantees that apply to every one of those endpoints today:

- **All read-only (`GET`).** No client issues a mutating request; the
  platform is a live observability/command surface, not a control-plane
  writer, as of this snapshot.
- **Polled, not pushed**, via TanStack Query today. `RuntimeConnector`
  (`packages/dashboard-sdk/src/runtime/RuntimeConnector.ts`) is the shared
  transport-agnostic seam that already supports upgrading any one connector
  to push delivery (WebSocket/SSE) via `attachTransport()` without changing
  any subscriber — see [Extension Points](#6-extension-points).
- **Defensive by construction.** Every response is read through `??`
  fallbacks for optional/renamed backend fields; several services
  (InsightFlow, NIYANTRAN, PRANA propagation log) additionally catch
  network/HTTP errors and return a typed empty/default value instead of
  throwing — see [Error Contracts](#5-error-contracts).
- **Trace-correlated.** Response interceptors on `client.ts`,
  `insightflowEndpoints.ts`, and `niyantranEndpoints.ts` extract a trace id
  from `x-trace-id` / `traceparent` / `x-request-id` / `x-execution-id`
  response headers and stamp it onto the returned payload as `trace_id`,
  feeding `buildTraceLineage()` (see [Extension Points](#6-extension-points)).

## 2. Events In/Out

The platform has two distinct event surfaces — an app-facing pub/sub bus,
and a per-connector data/error stream. Both are additive-safe: new optional
payload fields are backward compatible; renaming an event or changing an
existing field's type is a breaking change (see
[Version Rules](#7-version-rules)).

### 2a. `DashboardSDK` event bus (`packages/dashboard-sdk/src/sdk`)

| Event | Direction | Emitted by | Payload | Consumed by |
|---|---|---|---|---|
| `config:updated` | out | `DashboardSDK.updateConfig()` | `SDKDashboardConfig` | `SDKProvider` (keeps React state in sync) |
| `widget:registered` | out | `DashboardSDK.registerWidget()` | `SDKWidgetConfig` | `useWidget(id)` (re-renders when `id` matches) |
| `widget:unregistered` | out | `DashboardSDK.unregisterWidget()` | `string` (widget id) | `useWidget(id)` |

Any code can also `sdk.on(event, cb)` / `sdk.emit(event, payload)` for
**custom, app-defined events** — the bus (`SDKEventBus`) is generic over
event name and payload; the three above are simply the ones the SDK itself
emits today.

### 2b. `RuntimeConnector` data/error stream (`packages/dashboard-sdk/src/runtime`)

Not a single named event — every `RuntimeConnector<T>` instance is a
per-service subscription:

- **In:** its `poll(): Promise<T>` fetcher (always required, used as the
  streaming fallback) or, once `attachTransport()` is called, a pushed
  message from a `RuntimeStreamTransport<T>`.
- **Out:** `subscribe(listener)` receives every successful payload as
  `(payload: T, meta: { traceId?: string; receivedAt: number })`.
  `onError(listener)` receives every poll/transport failure.

### 2c. Service observability report (`packages/dashboard-sdk/src/runtime/ServiceObservability.tsx`)

- **In:** `useReportServiceHealth()(snapshot: ServiceHealthSnapshot)` — each
  service's own health hook (e.g. `useHealth`, `useBucketHealth`) reports
  its own connectivity; the provider never infers or fabricates a status.
- **Out:** `useServiceObservability()` returns the aggregated
  `CrossServiceObservability` (`{ services, overall, degradedCount }`) for
  any widget to render.

## 3. Config Schemas

Two independent, differently-scoped config schemas — do not confuse them:

| Schema | Owner | Scope | How it changes |
|---|---|---|---|
| `DashboardConfig<TZones>` | `config/types.ts` | Static-ish app config: branding, zones, features, theme, navigation. `TZones` is supplied by the consuming app. | `deepMerge(defaultConfig, overrides)` in `DashboardConfigProvider`, override-wins-on-conflict, memoized per `[defaultConfig, overrides]` identity. Arrays/non-plain values are replaced wholesale, never merged element-wise. |
| `SDKDashboardConfig` | `sdk/types.ts` | Live SDK runtime state: `appTitle`, `version`, `environment`, `refreshIntervalMs`, and the mutable `widgets` map. | `DashboardSDK.updateConfig(patch)` — shallow-merges `patch`, emits `config:updated`. |

Registration-time schemas that feed the Composition/Discovery engines (see
`RUNTIME_IDENTITY.md`):

- **`WidgetDefinition`** (`registry/types.ts`) — immutable once registered
  per `id@version`; re-registering the same pair throws
  (`DUPLICATE_REGISTRATION`, see [Error Contracts](#5-error-contracts)).
- **`ProductLayout`** (`registry/types.ts`) — bump `ProductLayout.version`
  whenever the zone set changes shape, to invalidate stale persisted
  client-side layouts (a `@bhiv/dashboard-layout` convention, not enforced
  by `ProductLayoutRegistry` itself).

## 4. SDK Hooks

The curated hook surface (`import { ... } from "@bhiv/dashboard-sdk"`).
Every hook here is `stable`: additive-only field changes within a minor
version.

| Hook | Requires | Returns | Purpose |
|---|---|---|---|
| `useDashboard()` | `DashboardProvider` | `{ config, theme, sdk, sdkConfig }` | Primary one-call read hook. |
| `useWidget(id)` | `DashboardProvider` | `{ widget, register, unregister, updateProps }` | Extension-point hook for one widget's live config. |
| `useDashboardConfig()` | `DashboardConfigProvider` | `DashboardConfig<TZones>` | Merged config tree only. |
| `useTheme()` | `ThemeProvider` | `ThemeContextValue` | Theme mode + resolved design tokens + setter. |
| `useFilters()` | `FilterProvider` | `FilterState` + setters | Shared cross-widget filter state. |
| `useDashboardSDK()` | `SDKProvider` | `{ sdk, config }` | Low-level escape hatch onto the raw `DashboardSDK`. |
| `useNavigation()` | none (reads `globalNavigationEngine`) | `NavigationState` + `navigate()` | In-page section nav; `path` matches a zone id. |
| `useProductLayout(product, layoutId, options?)` | none (reads `globalDashboardRegistry` by default) | `ResolvedLayoutZone[]` | Memoized `DashboardRegistry.resolveProductLayout()`. |
| `useReportServiceHealth()` / `useServiceObservability()` | `ServiceObservabilityProvider` (report is a safe no-op outside it) | `(snapshot) => void` / `CrossServiceObservability` | Publish/read cross-service health. |

## 5. Error Contracts

Normalizes error handling already implemented across
`apps/shakti/src/api/*.ts` and the SDK's own registries/error boundary into
one documented set of codes. No existing file's behavior changed — this
names the contract those files already honor.

| Code | Raised by | Surfaced as | Recommended handling |
|---|---|---|---|
| `ENDPOINT_NOT_FOUND` | `client.ts` (HTTP 404) | `Error("Endpoint not found: <url>")` | Permanent capability gap — don't retry; hide/gray the dependent widget. |
| `SERVICE_UNAVAILABLE` | `client.ts` (HTTP 503) | `Error("Service unavailable: <url>")` | Transient — next poll tick retries automatically; show degraded, not a hard error. |
| `REQUEST_TIMEOUT` | `client.ts`, `insightflowEndpoints.ts`, `niyantranEndpoints.ts` (`ECONNABORTED`) | `Error(...)` or logged + swallowed | Transient — safe to retry on the next interval; don't increase request frequency. |
| `NETWORK_ERROR` | `client.ts`, `insightflowEndpoints.ts`, `niyantranEndpoints.ts` (no `error.response`) | `Error(...)` or logged + resilient default | Report `ConnectionState "offline"` for the owning service; don't block unrelated zones. |
| `UNAUTHORIZED` | `niyantranEndpoints.ts` (HTTP 401) | Logged warning; rejected promise or resilient default | Prompt for re-auth (`x-auth-token`) instead of retrying with the same credentials. |
| `FORBIDDEN` | `niyantranEndpoints.ts` (HTTP 403) | Logged warning; resilient empty default | Treat as a permissions gap, not an outage — don't mark the service offline. |
| `WIDGET_RENDER_ERROR` | `packages/ui/src/ErrorBoundary.tsx` | Caught in `componentDidCatch`; fallback card with "Reload Zone" | Wrap every independently-rendered zone in its own `ErrorBoundary`. |
| `DUPLICATE_REGISTRATION` | `WidgetRegistry.register()` | `Error('Widget "<id>@<version>" is already registered.')`, thrown synchronously | Registration-time only — the bootstrap module (e.g. `widgets.registry.ts`) must catch or avoid re-registering. |

## 6. Extension Points

Every one of these lets a consuming app extend the platform **without
modifying a core file** — the same additive-only discipline this document
and `RUNTIME_IDENTITY.md` were themselves produced under.

| Extension point | Extend with | Effect |
|---|---|---|
| `WidgetRegistry` | `WidgetDefinition` via `register`/`registerMany` | Widget becomes discoverable and resolvable to a component across every consuming app. |
| `ProductLayoutRegistry` | `ProductLayout` via `register` | New named per-product layout, resolvable via `DashboardRegistry.resolveProductLayout()`. |
| `CapabilityRuntime` | capability id via `activate`/`deactivate`/`setActiveCapabilities` | Gates `widgetIsAvailable()` for widgets declaring that capability. |
| `TemplateRegistry` | `RegisteredTemplate` | New reusable dashboard page template. |
| `NavigationEngine` | `DashboardNavItem` (via `DashboardConfig.navigation.items`) | New in-page nav entry, scrolls to `#zone-<id>`. |
| Card/Table/Graph/Timeline frameworks | Props conforming to each framework's `*Props` type | New widget UI on the same primitives the built-ins use, with zero app-specific coupling. |
| `RuntimeStreamTransport<T>` | `{ connect(onMessage, onError), disconnect() }` passed to `RuntimeConnector.attachTransport()` | Upgrades a connector from polling to push delivery with zero subscriber changes. |
| `LineageSource<T>` | `{ sourceType, records, getTraceId, getId, getLabel, getTimestamp, getStatus? }` | Participates in `buildTraceLineage()`'s cross-source correlation. |
| `DashboardConfig` zones (`TZones` generic) | App-defined `Record<string, DashboardZoneConfig>` | Config/theme/navigation engines work against any app's zone shape. |

## 7. Version Rules

| Subject | Rule | Enforced by |
|---|---|---|
| `@bhiv/dashboard-sdk` / `@bhiv/dashboard-layout` package version | Pre-1.0 (`0.x`) — treat any change as potentially breaking; breaking changes must land in the same change as any dependent `apps/shakti` update, not ship independently. | `package.json` |
| `WidgetDefinition.version` | `"x.y.z"`-ish, compared numerically per segment. Multiple versions of one widget id may coexist; the registry defaults to latest. A `ProductLayoutZone.version` pin must stay registered as long as any layout references it. | code (`WidgetRegistry.compareVersions`) |
| `ProductLayout.version` | Bump when the zone set changes shape (added/removed/renamed zones); invalidates stale persisted client-side layouts in `@bhiv/dashboard-layout`. | convention |
| REST response shapes (all 5 services) | Additive-only: new optional fields are backward compatible. Removing/renaming/retyping a field is breaking and must update the matching `@/types/*.ts` type and `API.md`. Clients already read defensively (`??`) — new fields should follow the same pattern. | convention |
| SDK event payloads | Additive-only within a minor version. Renaming an event or changing an existing field's type requires a major `@bhiv/dashboard-sdk` bump. | convention |
| `DashboardConfig<TZones>` top-level keys | `branding` / `zones` / `features` / `theme` / `navigation` are stable; adding a new top-level key is additive. `deepMerge` only recurses into plain objects — array-typed config is replaced wholesale by overrides. | code (`deepMerge`) |

A programmatic helper, `isBackwardCompatibleVersion(baseline, candidate)`,
is exported from `@bhiv/dashboard-sdk` for checking the version rules above
(same major, candidate ≥ baseline) without hand-parsing semver strings.

## 8. Single Contract Export

Sections 2–7 above are each individually exported (`SDK_EVENT_CONTRACTS`,
`CONFIG_SCHEMA_CONTRACTS`, `SDK_HOOK_CONTRACTS`, `ERROR_CONTRACTS`,
`EXTENSION_POINT_CONTRACTS`, `VERSION_RULES`) *and* bundled into one
aggregated object, `RUNTIME_CONTRACT`, for tooling that wants a single
import instead of six:

```ts
import { RUNTIME_CONTRACT } from "@bhiv/dashboard-sdk";
// RUNTIME_CONTRACT.version, .events.{sdk,runtimeConnector,serviceObservability},
// .configSchemas, .hooks, .errors, .extensionPoints, .versionRules
```

It is a pure re-grouping — every field is the same array/value already
exported individually; nothing here is a second source of truth. The REST
surface has the equivalent `SHAKTI_API_CONTRACT` export from
`apps/shakti/src/api/contract.ts` (version + flattened `endpoints` +
`byService` breakdown).

A companion structural type, `DashboardExtension` (`contract/types.ts`), is
also exported: `{ extensionPoint: string; [field: string]: unknown }`. It is
not required by any registry method — `WidgetRegistry.register()`,
`ProductLayoutRegistry.register()`, etc. keep their own concrete parameter
types — it exists as one structural shape tooling can introspect an
extension payload through by pointing `extensionPoint` at the matching
`ExtensionPointContract.name` in §6.

---

## What changed

An earlier pass added the contract module described in §§1–7
(`packages/dashboard-sdk/src/contract/{types,capabilityContract,index}.ts`,
`apps/shakti/src/api/contract.ts`, this file, and `API.md`) but the SDK's
public barrel was never actually updated to re-export it — `RestEndpointContract`
and friends were documented as importable from `@bhiv/dashboard-sdk` but
`packages/dashboard-sdk/src/index.ts` had no `export * from "./contract"`
line, so `apps/shakti/src/api/contract.ts`'s
`import type { RestEndpointContract } from "@bhiv/dashboard-sdk"` did not
actually resolve. This pass completes that gap and adds the missing §8
single-export surface. Nothing pre-existing was modified, moved, or
removed, and no class, function, type, hook, or component was renamed or
had its signature changed:

- **Edited (additive only)** `packages/dashboard-sdk/src/index.ts` —
  appended `export * from "./contract"`, actually wiring the contract
  module onto the package's public surface; no existing line changed.
  (Not also re-exported from `extensions/index.ts` — `index.ts` already
  `export *`s both `./extensions` and `./contract`, so re-exporting the
  same names from `./extensions` too would make them ambiguous rather
  than additive.)
- **Added** `RuntimeContract` type (`contract/types.ts`) and the
  `RUNTIME_CONTRACT` aggregate constant (`contract/capabilityContract.ts`)
  — the single-import bundle described in §8. Every field is the same
  array/value already exported individually; nothing else reads this
  constant.
- **Added** `DashboardExtension` type (`contract/types.ts`) — the generic
  structural extension-payload shape described in §8. Not required by any
  existing registry method's parameter type.
- **Added** `SHAKTI_API_CONTRACT` aggregate constant
  (`apps/shakti/src/api/contract.ts`) — the REST-side equivalent of
  `RUNTIME_CONTRACT` (version + flattened `endpoints` + `byService`
  breakdown). Nothing else in the app imports from this file, matching the
  existing `ALL_SHAKTI_API_ENDPOINTS`.
- **Edited (additive only)** this file — added §8 and corrected this
  section to match what is actually wired.

`WidgetRegistry`, `DashboardSDK`, `RuntimeConnector`, `DashboardConfigProvider`,
`ErrorBoundary`, and every typed API client in `apps/shakti/src/api/` are
exactly as they were before this pass — only named and documented.
