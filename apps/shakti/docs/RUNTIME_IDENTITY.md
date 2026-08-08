# Runtime Identity — BHIV Dashboard Platform

**Status: ARCHITECTURE FROZEN.** This document is a factual snapshot of five
runtime engines that already exist in `packages/dashboard-sdk/src/registry`
and `packages/dashboard-sdk/src/config`. It names responsibilities that were
previously implicit inside `DashboardRegistry`, `WidgetRegistry`,
`ProductLayoutRegistry`, `CapabilityRuntime`, and the config layer. **No
behavior, interface, or file was changed to produce this document** — see
[What changed](#what-changed) at the bottom. No new engines, no new
capabilities, no new code paths were introduced.

Machine-readable mirror of these five cards: `packages/dashboard-sdk/src/registry/runtimeIdentity.ts`
(exported as `RUNTIME_IDENTITY_CARDS` / `getRuntimeIdentityCard(id)` from
`@bhiv/dashboard-sdk`). Keep the two in sync.

See also: [`REGISTRY_PARTICIPATION.md`](./REGISTRY_PARTICIPATION.md) for how
these engines (plus execution/replay lineage and composition review) can be
*reported outward* to external Capability/Runtime/Execution/Replay/Review
registries — contracts and DTOs only, no implementation. See
[`OBSERVABILITY.md`](./OBSERVABILITY.md) for the implemented Structured
Logs, Trace IDs, Evidence, Replay Metadata, Health Reporting, and Metrics
primitives each engine's `evidence`/`replay`/`observability` fields below
can now be backed by.

## Map of the five layers

```
 registerWidget()                         registerLayout()
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌──────────────────────┐
│  DISCOVERY  │                          │  COMPOSITION ENGINE   │
│WidgetRegistry│◄───────get()/resolve────│ProductLayoutRegistry +│
│  .discover() │      Component()        │ zone-assembly step of │
└──────┬──────┘                          │DashboardRegistry      │
       │ candidates                      │.resolveProductLayout()│
       ▼                                 └───────────▲───────────┘
┌───────────────┐                                    │ ordered,
│ AGENT SELECTOR│  per-zone pick (widget+version+     │ override-merged
│ (inside       │  component) ─────────────────────────┘ ResolvedLayoutZone[]
│ resolveProduct│
│ Layout)       │
└──────┬────────┘
       │ selected widget
       ▼
┌────────────────────────────┐
│ DEPENDENCY/COMPATIBILITY    │  gates the selection with
│ ENGINE — CapabilityRuntime  │  widgetIsAvailable() → "permitted"
│ .widgetIsAvailable()        │  which Composition Engine consumes
└────────────────────────────┘

┌───────────────────────────────────────────┐
│ RUNTIME CONFIG GENERATOR                    │  independent of the four
│ DashboardConfigProvider + deepMerge         │  above — merges
│ defaultConfig ⊕ overrides → DashboardConfig │  app-level config, not
└───────────────────────────────────────────┘  widgets/layouts
```

**No-overlap rule applied:** each card below lists an explicit
`Authority` (what only it decides) and `Not Authority` (what it defers to
another named card for). `DashboardRegistry.resolveProductLayout()` is a
single function that exercises **three** of these responsibilities in
sequence (Agent Selector → Dependency/Compatibility Engine →
Composition Engine); the cards split it at the point marked in code, they
do not duplicate it.

---

## 1. Discovery

| Field | Value |
|---|---|
| **Layer** | Registry / SDK core — `packages/dashboard-sdk/src/registry/WidgetRegistry.ts` |
| **Identity** | `WidgetRegistry` class; singleton `globalWidgetRegistry` |
| **Purpose** | Central catalog of registered widgets: registration, multi-version storage, and discovery by product/category/capability/tag/viewer-context. |
| **Authority** | • Register / unregister `WidgetDefinition`s (`register`, `registerMany`, `unregister`)<br>• Track multiple versions per widget id and resolve the latest (`compareVersions`, `listVersions`)<br>• Answer discovery queries (`discover`, `getAll`, `getByCategory`, `getByCapability`, `getByProduct`)<br>• Evaluate a widget's `permission`/`isVisible` rule against a viewer context (`isVisibleFor`)<br>• Resolve a widget id to a renderable component, eager or `React.lazy` (`resolveComponent`) |
| **Not Authority** | • Does **not** decide whether a widget's declared capability is currently active → *Dependency/Compatibility Engine*<br>• Does **not** decide zone order or per-product layout shape → *Composition Engine*<br>• Does **not** merge or generate the app-level runtime config → *Runtime Config Generator*<br>• Does **not** pin which single widget/version fills a given layout zone at resolve time → that exercise of its own lookup/`resolveComponent` methods is the *Agent Selector*'s responsibility |
| **Inputs/Outputs** | In: `WidgetDefinition`, `RegistryDiscoveryQuery`, `WidgetVisibilityContext`. Out: `WidgetDefinition[]`, `boolean`, `ComponentType<any> \| undefined` |
| **Upstream/Downstream** | Up: consuming apps' widget-registration modules (e.g. `apps/shakti`'s widget registry config) at bootstrap. Down: `DashboardRegistry` (via `this.widgets`), `useProductLayout` (indirectly) |
| **Evidence** | None captured in-process. No audit log of registration/discovery calls; `register()` throwing on a duplicate id+version is the only built-in trace of a bad registration. |
| **Replay** | Not supported. State is in-memory `Map`s only; cleared on reload via `clear()`, no persistence or event log. |
| **Observability** | None built in — no logging, metrics, or subscribe hooks (contrast with `CapabilityRuntime`, which has `subscribe`). |
| **Knowledge** | The full set of currently registered widget definitions and their versions (`entries`/`latestVersion` maps) — the platform's live knowledge of "what widgets exist". |
| **Health** | No self-reported health signal. A failed `register()` throws synchronously and must be caught by the caller. |
| **Version** | `@bhiv/dashboard-sdk@0.1.0` (package-level only; individual widgets carry their own semver via `WidgetDefinition.version`) |
| **Compatibility** | Version-aware at the widget level (multi-version storage + `compareVersions`), but does not itself check compatibility between a widget and the runtime. |
| **Status** | ACTIVE |

## 2. Agent Selector

| Field | Value |
|---|---|
| **Layer** | Registry / SDK core — `packages/dashboard-sdk/src/registry/DashboardRegistry.ts` (per-zone resolution step of `resolveProductLayout`, unchanged) **and** `packages/dashboard-sdk/src/registry/AgentSelector.ts` (additive composition-time analysis surface) |
| **Identity** | The widget-lookup + component-resolution step inside `DashboardRegistry.resolveProductLayout()`, backed by `WidgetRegistry.get()`/`resolveComponent()` — plus the `AgentSelector` class / `globalAgentSelector` singleton, which wraps the same lookup with discovery, dependency-resolution, compatibility-validation, composition-validation, runtime-graph, runtime-config-export, and lifecycle-metadata methods |
| **Purpose** | For each declared zone in a resolved product layout, select exactly one concrete widget version and its resolved component — the pinned version if the zone specifies one, otherwise the latest registered version. `AgentSelector` additionally produces a full composition-time report of that selection (candidates considered, dependency/compatibility status, lifecycle), whole-layout composition validation, a static runtime graph, and a serializable config export — all without executing anything. |
| **Authority** | • Choosing which registered version of a widget fills a given zone (`zone.version` pin vs. latest)<br>• Triggering component resolution for that one selection (`resolveComponent`, including the `React.lazy` cache in `WidgetRegistry`) — resolving a reference only, never invoking/rendering it<br>• Deciding a zone is unresolved (`widget` undefined) when no matching registration exists<br>• *(AgentSelector)* **Discovery** — read-only candidate lookup via `WidgetRegistry.discover`<br>• *(AgentSelector)* **Dependency Resolution** — reporting which of a widget's declared capabilities are currently active<br>• *(AgentSelector)* **Compatibility Validation** — product/permission/capability/version fit for one zone<br>• *(AgentSelector)* **Composition Validation** — whole-layout checks for duplicate zones, unresolved widgets, capability gating, permission failures, deprecated selections<br>• *(AgentSelector)* **Runtime Graph** — a static zone→widget→capability node/edge graph<br>• *(AgentSelector)* **Runtime Config Export** — a serializable, point-in-time snapshot of a resolved composition<br>• *(AgentSelector)* **Lifecycle Metadata** — a `LifecycleStatus` (`resolved`/`capability-gated`/`unpermitted`/`unresolved`/`deprecated`) per zone, and aggregate summaries |
| **Not Authority** | • Does **not** search or filter the wider candidate pool beyond what `WidgetRegistry.discover` already supports<br>• Does **not** itself decide the active-capability set — only reads it (never calls `CapabilityRuntime.activate`/`deactivate`/`setActiveCapabilities`) → *Dependency/Compatibility Engine*<br>• Does **not** decide the final ordered zone list or override merging for `resolveProductLayout`'s own output → *Composition Engine*<br>• Does **not** execute, poll, subscribe to, or otherwise talk to any live runtime/workflow service — never imports `RuntimeConnector` or anything from `../runtime`<br>• Does **not** merge or generate the live app-level `DashboardConfig` — its Runtime Config Export is a one-shot static snapshot, not a subscription → *Runtime Config Generator* |
| **Inputs/Outputs** | In: `ProductLayoutZone` (widgetId, optional version pin, order/visible/label/colSpan); *(AgentSelector)* `RegistryDiscoveryQuery`, `WidgetVisibilityContext`, product/layoutId pairs. Out: selected `WidgetDefinition \| undefined`, resolved `ComponentType<any> \| undefined`; *(AgentSelector)* `AgentSelectionResult`, `DependencyResolutionReport`, `CompatibilityValidationReport`, `CompositionValidationReport`, `RuntimeGraph`, `RuntimeConfigExport`, `LifecycleSummary` — all plain, JSON-serializable data |
| **Upstream/Downstream** | Up: `ProductLayoutRegistry` (zone list), `WidgetRegistry` (version/component lookup), *(AgentSelector)* `CapabilityRuntime` read-only only. Down: the Composition Engine step of the same `resolveProductLayout` call; *(AgentSelector)* tooling/diagnostics/tests that consume its reports — `resolveProductLayout` itself does not call `AgentSelector` |
| **Evidence** | `resolveProductLayout`: none, an unresolved zone silently becomes `component: undefined`. `AgentSelector`: each method returns a structured report (`issues`/`lifecycle` fields) instead of failing silently — the report itself is the evidence, still not persisted anywhere. |
| **Replay** | Not supported. Recomputed fresh on every call; `useProductLayout`'s `useMemo` only memoizes per-render, it does not persist history. Same for `AgentSelector`'s reports. |
| **Observability** | `resolveProductLayout`: none. `AgentSelector`: no counters/logs of its own, but its reports (`CompositionValidationReport`, `LifecycleSummary`, `RuntimeGraph`) are designed to be inspected on demand by external tooling. |
| **Knowledge** | None of its own — both the `resolveProductLayout` step and `AgentSelector` are pure functions of `WidgetRegistry`/`ProductLayoutRegistry`/`CapabilityRuntime`'s current entries at call time, no independent state. |
| **Health** | A widget that fails to resolve degrades gracefully to an invisible/fallback zone rather than throwing, so one bad registration can't take the rest of the layout down. `AgentSelector` mirrors this: an unresolved/gated/unpermitted zone yields a lifecycle status in the report rather than a thrown error. |
| **Version** | `@bhiv/dashboard-sdk@0.1.0` (`resolveProductLayout` co-located in `DashboardRegistry.ts`; `AgentSelector` is its own class in `AgentSelector.ts` — neither independently versioned) |
| **Compatibility** | `resolveProductLayout` honors the zone's version pin against `WidgetRegistry`'s multi-version store; does not itself enforce capability compatibility. `AgentSelector.validateCompatibility` explicitly checks product/permission/capability fit and reports it structurally. |
| **Status** | ACTIVE — `AgentSelector.ts` is now a separately named, tested class in code; `resolveProductLayout`'s inline selection step remains unchanged for backward compatibility. |

## 3. Dependency/Compatibility Engine

| Field | Value |
|---|---|
| **Layer** | Registry / SDK core — `packages/dashboard-sdk/src/registry/CapabilityRuntime.ts` |
| **Identity** | `CapabilityRuntime` class; singleton `globalCapabilityRuntime` |
| **Purpose** | Tracks which BHIV/TANTRA runtime capabilities are currently active and decides whether a given widget's declared capability dependencies are satisfied. |
| **Authority** | • The single active-capability set (`setActiveCapabilities`, `activate`, `deactivate`, `isActive`, `getActiveCapabilities`)<br>• Deciding `widgetIsAvailable(widget)`: true if the widget declares no capabilities, or at least one declared capability is active<br>• Notifying subscribers whenever the active set changes (`subscribe`/`notify`) |
| **Not Authority** | • Does **not** know what widgets exist or how to find them → *Discovery*<br>• Does **not** decide which specific widget version/component to use → *Agent Selector*<br>• Does **not** decide zone order or the final composed layout → *Composition Engine*<br>• Does **not** itself discover capabilities from a boot-time API — per its own doc comment, that discovery call lives outside this class |
| **Inputs/Outputs** | In: `capability: string`, `capabilities: string[]`, `WidgetDefinition`. Out: `boolean`, `string[]`, change notifications to subscribers |
| **Upstream/Downstream** | Up: whatever boot-time/live process discovers the active capability graph (not present in this package). Down: `DashboardRegistry.resolveProductLayout` (gates `permitted`), any UI subscribing via `subscribe()` |
| **Evidence** | None. Capability changes are broadcast to subscribers but not logged or persisted. |
| **Replay** | Not supported. `active` is a plain in-memory `Set`, reset on reload; no history of past capability states. |
| **Observability** | `subscribe(listener)` is the one observability hook — callers can watch the active-capability set change in real time. |
| **Knowledge** | The current active-capability set is this engine's entire knowledge; it holds no model of which capabilities *should* be active, only which are. |
| **Health** | No self-reported health signal. `activate`/`deactivate` on an already-active/inactive capability are no-ops (no error). |
| **Version** | `@bhiv/dashboard-sdk@0.1.0` |
| **Compatibility** | This class **is** the compatibility check for widgets vs. runtime capabilities; it has no notion of compatibility between capabilities themselves (e.g. mutually exclusive capabilities are not modeled). |
| **Status** | ACTIVE |

## 4. Composition Engine

| Field | Value |
|---|---|
| **Layer** | Registry / SDK core — `packages/dashboard-sdk/src/registry/ProductLayoutRegistry.ts` + the assembly step of `DashboardRegistry.resolveProductLayout()` |
| **Identity** | `ProductLayoutRegistry` class (singleton `globalProductLayoutRegistry`) plus the zone-assembly `.map()` inside `DashboardRegistry.resolveProductLayout()` |
| **Purpose** | Store named, per-product dashboard layouts as ordered widget-id references, and assemble a requested layout's zones — with override merging and ordering — into the final `ResolvedLayoutZone[]` handed to a grid renderer. |
| **Authority** | • Register/unregister/look up `ProductLayout`s by product+id (`register`, `unregister`, `get`, `getAllForProduct`, `getAll`)<br>• Apply `visibilityOverrides`/`labelOverrides`/`colSpanOverrides` on top of a zone's own declared values<br>• Determine final zone order (`zone.order ?? index`) and visibility (`requestedVisible && permitted`)<br>• Shape the output into `ResolvedLayoutZone`, structurally compatible with `@bhiv/dashboard-layout`'s `LayoutZoneDefinition` |
| **Not Authority** | • Does **not** register or discover widgets → *Discovery*<br>• Does **not** decide which widget version/component fills a zone → *Agent Selector*<br>• Does **not** decide capability-based availability → *Dependency/Compatibility Engine* (it only consumes the resulting `permitted` flag)<br>• Does **not** merge or generate the app-level `DashboardConfig` → *Runtime Config Generator* |
| **Inputs/Outputs** | In: `ProductLayout`, `ResolveProductLayoutOptions`, the Agent Selector's per-zone selection, the Dependency/Compatibility Engine's `permitted` flag. Out: `ResolvedLayoutZone[]` |
| **Upstream/Downstream** | Up: consuming apps register layouts (`registerLayout`); `WidgetRegistry` + `CapabilityRuntime` supply the per-zone inputs this step folds together. Down: `useProductLayout` hook, the app's grid renderer (e.g. `apps/shakti`'s `Dashboard.tsx` via `@bhiv/dashboard-layout`) |
| **Evidence** | None. No log of which layout/version was resolved for a given render. |
| **Replay** | Not supported. Recomputed on demand; `useProductLayout` only memoizes per-render, does not persist history. |
| **Observability** | None built in. |
| **Knowledge** | The full set of registered per-product layouts (the `layouts` map) — the platform's live knowledge of "what layouts exist for which products". |
| **Health** | A zone whose widget is missing/unpermitted/capability-gated renders as an invisible zone rather than throwing, so one bad zone can't take down the rest of the layout. |
| **Version** | `@bhiv/dashboard-sdk@0.1.0`; `ProductLayout.version` lets a layout bump its own shape-version to invalidate stale persisted client-side layouts (consumed by `@bhiv/dashboard-layout`, not enforced here) |
| **Compatibility** | Structurally compatible output (`ResolvedLayoutZone` ≈ `LayoutZoneDefinition`) is a deliberate contract with `@bhiv/dashboard-layout`. |
| **Status** | ACTIVE |

## 5. Runtime Config Generator

| Field | Value |
|---|---|
| **Layer** | SDK core / config — `packages/dashboard-sdk/src/config/DashboardConfigProvider.tsx` + `deepMerge.ts` |
| **Identity** | `DashboardConfigProvider` + `deepMerge`, exposed via `DashboardConfigContext` / `useDashboardConfig` |
| **Purpose** | Produce the single effective `DashboardConfig` an app runs with, by deep-merging a system's `defaultConfig` with runtime `overrides`. |
| **Authority** | • Deep-merge plain-object config trees, override-wins-on-conflict, recursing into nested plain objects only (arrays/non-plain values replaced wholesale)<br>• Memoize the merged config per `[defaultConfig, overrides]` identity (`useMemo`)<br>• Provide the merged config to the tree via `DashboardConfigContext` |
| **Not Authority** | • Does **not** know about widgets, layouts, or capabilities — merges whatever `DashboardConfig`/`DashboardZoneMap` shape the app defines<br>• Does **not** validate the merged config against a schema — `deepMerge` is structural only<br>• Does **not** persist or version the merged config — recomputed from the two inputs each time |
| **Inputs/Outputs** | In: `defaultConfig: DashboardConfig<TZones>`, `overrides?: DashboardConfigOverride<TZones>`. Out: `mergedConfig: DashboardConfig<TZones>` via context |
| **Upstream/Downstream** | Up: the consuming app supplies `defaultConfig` (e.g. SHAKTI's `defaultDashboardConfig`) and any `overrides`. Down: every component under `DashboardConfigProvider` calling `useDashboardConfig()`, including `DashboardProvider`'s composed context |
| **Evidence** | None. No log of what changed between default and merged config. |
| **Replay** | Not supported. Purely a function of the two inputs at render time. |
| **Observability** | None. No logging/metrics; only React DevTools context inspection. |
| **Knowledge** | None beyond the two inputs it's given each render. |
| **Health** | No self-reported health signal. `deepMerge` cannot throw on well-typed input. |
| **Version** | `@bhiv/dashboard-sdk@0.1.0` |
| **Compatibility** | Generic over `TZones`, so it works with any app's `DashboardConfig`/`DashboardZoneMap` shape without modification. |
| **Status** | ACTIVE |

---

## What changed

This freeze pass **added two files and two additive export lines** — nothing
else in the repository was modified, moved, or removed:

- **Added** `packages/dashboard-sdk/src/registry/runtimeIdentity.ts` — typed
  constants (`RUNTIME_IDENTITY_CARDS`, one `RuntimeIdentityCard` per engine
  above) mirroring this document. Pure data, no side effects, imported by
  nothing else in the codebase — it does not gate, wrap, or alter any
  existing class or function.
- **Added** this file, `RUNTIME_IDENTITY.md`.
- **Edited (additive only)** `packages/dashboard-sdk/src/registry/index.ts`
  — appended re-exports of the new identity constants; no existing line
  changed.
- **Edited (additive only)** `packages/dashboard-sdk/src/extensions/index.ts`
  — appended the same re-exports to the curated public surface; no existing
  line changed.

No class, function, type, or React component was renamed, moved, or had its
signature changed. `WidgetRegistry`, `ProductLayoutRegistry`,
`CapabilityRuntime`, `DashboardRegistry`, `DashboardConfigProvider`, and
`deepMerge` are exactly as they were before this pass — only named and
documented.
