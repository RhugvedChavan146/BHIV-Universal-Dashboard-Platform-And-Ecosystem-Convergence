// ─── Runtime Identity Cards ──────────────────────────────────────────────────
// Read-only, additive documentation-as-code for the five runtime engines
// living in this registry layer. These constants describe WHAT the code
// already does — they do not wire into, alter, or gate any existing
// behavior. Nothing here is imported by WidgetRegistry, ProductLayoutRegistry,
// CapabilityRuntime, or DashboardRegistry; it exists purely so tooling/docs
// can introspect the architecture without re-deriving it by hand.
//
// Source of truth: /RUNTIME_IDENTITY.md (repo root). Keep the two in sync —
// if you change the responsibility boundary of an engine here, update the
// matching card in RUNTIME_IDENTITY.md, and vice versa.
//
// Architecture is otherwise FROZEN as of this file's introduction: no new
// engines, no new responsibilities for Discovery, Dependency/Compatibility
// Engine, Composition Engine, or Runtime Config Generator, no behavior
// changes to any of them. The one deliberate exception is the Agent
// Selector card below, which now also documents `AgentSelector.ts` — an
// additive, composition-time-only surface (Discovery, Dependency
// Resolution, Compatibility Validation, Composition Validation, Runtime
// Graph, Runtime Config Export, Lifecycle Metadata) that never executes
// runtime/workflows and never modifies `DashboardRegistry.resolveProductLayout`.

export type RuntimeLayerId =
  | "discovery"
  | "agent-selector"
  | "dependency-compatibility-engine"
  | "composition-engine"
  | "runtime-config-generator";

export interface RuntimeIdentityCard {
  /** Stable id for this card, matches RuntimeLayerId. */
  id: RuntimeLayerId;
  /** Architectural layer / location in the codebase. */
  layer: string;
  /** The concrete class(es)/module(s)/function(s) that ARE this engine. */
  identity: string;
  /** One-paragraph statement of why this engine exists. */
  purpose: string;
  /** What this engine has final say over. */
  authority: string[];
  /** What this engine explicitly does NOT decide — points to the owning card instead. */
  notAuthority: string[];
  /** What flows in. */
  inputs: string[];
  /** What flows out. */
  outputs: string[];
  /** What feeds this engine (callers / data sources). */
  upstream: string[];
  /** What consumes this engine's output. */
  downstream: string[];
  /** What this engine logs/records of its own actions today. */
  evidence: string;
  /** Whether/how a past decision made by this engine can be reconstructed. */
  replay: string;
  /** What visibility into live behavior this engine exposes today. */
  observability: string;
  /** What state this engine holds and treats as its "live knowledge". */
  knowledge: string;
  /** Self-reported or inferable health signal. */
  health: string;
  /** Package/version this engine ships under. */
  version: string;
  /** Compatibility contract this engine honors or enforces. */
  compatibility: string;
  /** Current lifecycle status. */
  status: "ACTIVE" | "DEPRECATED" | "PLANNED";
}

export const DISCOVERY_IDENTITY: RuntimeIdentityCard = {
  id: "discovery",
  layer: "Registry / SDK core — packages/dashboard-sdk/src/registry/WidgetRegistry.ts",
  identity: "WidgetRegistry class; singleton globalWidgetRegistry",
  purpose:
    "Central catalog of registered widgets: registration, multi-version storage, and discovery by product/category/capability/tag/viewer-context.",
  authority: [
    "Register / unregister WidgetDefinitions (register, registerMany, unregister)",
    "Track multiple versions per widget id and resolve the latest (compareVersions, listVersions)",
    "Answer discovery queries (discover, getAll, getByCategory, getByCapability, getByProduct)",
    "Evaluate a widget's permission/isVisible rule against a viewer context (isVisibleFor)",
    "Resolve a widget id to a renderable component, eager or React.lazy (resolveComponent)",
  ],
  notAuthority: [
    "Does not decide whether a widget's declared capability is currently active — see Dependency/Compatibility Engine",
    "Does not decide zone order or per-product layout shape — see Composition Engine",
    "Does not merge or generate the app-level runtime config — see Runtime Config Generator",
    "Does not pin which single widget/version fills a given layout zone at resolve time — that exercise of its lookup/resolveComponent methods is the Agent Selector's responsibility",
  ],
  inputs: [
    "WidgetDefinition (id, version, category, capabilities, products, permission, loader/component, tags)",
    "RegistryDiscoveryQuery (product, category, capability, tag, context)",
    "WidgetVisibilityContext (role, permissions)",
  ],
  outputs: [
    "WidgetDefinition[] (discovery results)",
    "boolean (has / isVisibleFor)",
    "ComponentType<any> | undefined (resolveComponent)",
  ],
  upstream: [
    "Consuming apps' widget-registration modules (e.g. apps/shakti's widget registry config) call register/registerMany at app bootstrap",
  ],
  downstream: [
    "DashboardRegistry (via this.widgets)",
    "useProductLayout (indirectly, through DashboardRegistry)",
  ],
  evidence:
    "None captured in-process. No audit log of registration/discovery calls; register() throwing on a duplicate id+version is the only built-in trace of a bad registration.",
  replay:
    "Not supported. Registry state is in-memory Maps only; cleared on reload via clear(), no persistence or event log to replay from.",
  observability:
    "None built in — no logging, metrics, or subscribe hooks on WidgetRegistry itself (contrast with CapabilityRuntime, which has subscribe).",
  knowledge:
    "The full set of currently registered widget definitions and their versions, held in the entries/latestVersion maps — the platform's live knowledge of 'what widgets exist'.",
  health:
    "No self-reported health signal. A failed register() throws synchronously and must be caught by the caller.",
  version: "@bhiv/dashboard-sdk@0.1.0 (package-level only; individual widgets carry their own semver via WidgetDefinition.version)",
  compatibility:
    "Version-aware at the widget level (multi-version storage + compareVersions), but does not itself check compatibility between a widget and the runtime — see Dependency/Compatibility Engine.",
  status: "ACTIVE",
};

export const AGENT_SELECTOR_IDENTITY: RuntimeIdentityCard = {
  id: "agent-selector",
  layer:
    "Registry / SDK core — packages/dashboard-sdk/src/registry/DashboardRegistry.ts (per-zone resolution step of resolveProductLayout) AND packages/dashboard-sdk/src/registry/AgentSelector.ts (composition-time analysis surface)",
  identity:
    "The widget-lookup + component-resolution step inside DashboardRegistry.resolveProductLayout() (unchanged, still backed by WidgetRegistry.get()/resolveComponent()), plus the AgentSelector class / globalAgentSelector singleton, which wraps the same lookup with discovery, dependency-resolution, compatibility-validation, composition-validation, runtime-graph, runtime-config-export, and lifecycle-metadata methods",
  purpose:
    "For each declared zone in a resolved product layout, select exactly one concrete widget version and its resolved component (pinned version if specified, otherwise latest) — and, via AgentSelector, produce a full composition-time report of that selection: which candidates existed, which capability dependencies are satisfied, whether the selection is compatible, and its lifecycle status — plus whole-layout composition validation, a static runtime graph, and a serializable config export.",
  authority: [
    "Choosing which registered version of a widget fills a given zone (zone.version pin vs. latest)",
    "Triggering component resolution for that one selection (resolveComponent, including the React.lazy cache in WidgetRegistry) — resolving a reference only, never invoking/rendering it",
    "Deciding a zone is unresolved (widget undefined) when no matching registration exists",
    "(AgentSelector) Discovery: read-only candidate lookup via WidgetRegistry.discover",
    "(AgentSelector) Dependency Resolution: reporting which of a widget's declared capabilities are currently active",
    "(AgentSelector) Compatibility Validation: product/permission/capability/version fit for one zone",
    "(AgentSelector) Composition Validation: whole-layout checks for duplicate zones, unresolved widgets, capability gating, permission failures, and deprecated selections",
    "(AgentSelector) Runtime Graph: building a static zone→widget→capability node/edge graph",
    "(AgentSelector) Runtime Config Export: producing a serializable, point-in-time snapshot of a resolved composition",
    "(AgentSelector) Lifecycle Metadata: assigning/aggregating a LifecycleStatus (resolved/capability-gated/unpermitted/unresolved/deprecated) per zone",
  ],
  notAuthority: [
    "Does not search or filter the wider candidate pool beyond what WidgetRegistry.discover already supports",
    "Does not itself decide the active-capability set — only reads it (never calls CapabilityRuntime.activate/deactivate/setActiveCapabilities) — see Dependency/Compatibility Engine",
    "Does not decide the final ordered zone list or override merging for resolveProductLayout's own output — see Composition Engine",
    "Does not execute, poll, subscribe to, or otherwise talk to any live runtime/workflow service — it never imports RuntimeConnector or anything from ../runtime",
    "Does not merge or generate the live app-level DashboardConfig — its Runtime Config Export is a one-shot, static snapshot, not a subscription — see Runtime Config Generator",
  ],
  inputs: [
    "ProductLayoutZone (widgetId, optional version pin, order/visible/label/colSpan) from a registered ProductLayout",
    "(AgentSelector) RegistryDiscoveryQuery, WidgetVisibilityContext, product/layoutId pairs",
  ],
  outputs: [
    "Selected WidgetDefinition | undefined",
    "Resolved ComponentType<any> | undefined",
    "(AgentSelector) AgentSelectionResult, DependencyResolutionReport, CompatibilityValidationReport, CompositionValidationReport, RuntimeGraph, RuntimeConfigExport, LifecycleSummary — all plain, JSON-serializable data",
  ],
  upstream: [
    "ProductLayoutRegistry (supplies the zone list being resolved)",
    "WidgetRegistry (supplies the version/component lookup)",
    "(AgentSelector) CapabilityRuntime, read-only (isActive/getActiveCapabilities/widgetIsAvailable only)",
  ],
  downstream: [
    "The Composition Engine step of the same resolveProductLayout call, which folds this selection into a ResolvedLayoutZone",
    "(AgentSelector) Tooling, diagnostics, and tests that consume its reports — resolveProductLayout itself does not call AgentSelector",
  ],
  evidence:
    "resolveProductLayout: none, an unresolved zone silently becomes component: undefined. AgentSelector: each method returns a structured report (including an `issues`/`lifecycle` field) instead of throwing or logging silently — the report itself is the evidence, still not persisted anywhere.",
  replay:
    "Not supported. Selection/reports are recomputed fresh on every call — memoized per-render only via useProductLayout's useMemo (for resolveProductLayout), not persisted.",
  observability:
    "resolveProductLayout: none. AgentSelector: no counters or logs of its own, but its reports (CompositionValidationReport, LifecycleSummary, RuntimeGraph) are designed to be read/inspected by external tooling on demand.",
  knowledge:
    "None of its own — both the resolveProductLayout step and AgentSelector are pure functions of WidgetRegistry/ProductLayoutRegistry/CapabilityRuntime's current entries at call time, holding no independent state.",
  health:
    "A widget that fails to resolve degrades gracefully to an invisible/fallback zone (per DashboardRegistry's doc comment) rather than throwing, so one bad registration can't take the rest of the layout down. AgentSelector mirrors this: an unresolved/gated/unpermitted zone yields a lifecycle status in the report rather than a thrown error.",
  version: "@bhiv/dashboard-sdk@0.1.0 (resolveProductLayout co-located in DashboardRegistry.ts; AgentSelector is its own class in AgentSelector.ts — neither is independently versioned)",
  compatibility:
    "resolveProductLayout honors the zone's version pin against WidgetRegistry's multi-version store; does not itself enforce capability compatibility. AgentSelector.validateCompatibility explicitly checks product/permission/capability fit and reports it structurally.",
  status: "ACTIVE",
};

export const DEPENDENCY_COMPATIBILITY_ENGINE_IDENTITY: RuntimeIdentityCard = {
  id: "dependency-compatibility-engine",
  layer: "Registry / SDK core — packages/dashboard-sdk/src/registry/CapabilityRuntime.ts",
  identity: "CapabilityRuntime class; singleton globalCapabilityRuntime",
  purpose:
    "Tracks which BHIV/TANTRA runtime capabilities are currently active and decides whether a given widget's declared capability dependencies are satisfied.",
  authority: [
    "The single active-capability set (setActiveCapabilities, activate, deactivate, isActive, getActiveCapabilities)",
    "Deciding widgetIsAvailable(widget): true if the widget declares no capabilities, or at least one declared capability is active",
    "Notifying subscribers whenever the active set changes (subscribe / notify)",
  ],
  notAuthority: [
    "Does not know what widgets exist or how to find them — see Discovery",
    "Does not decide which specific widget version/component to use — see Agent Selector",
    "Does not decide zone order or the final composed layout — see Composition Engine",
    "Does not itself discover capabilities from a boot-time API — per its own doc comment, capabilities are expected to be discovered from a capability-graph API at boot or over a live connection, but that discovery call lives outside this class",
  ],
  inputs: [
    "capability: string (activate / deactivate)",
    "capabilities: string[] (setActiveCapabilities)",
    "WidgetDefinition (widgetIsAvailable)",
  ],
  outputs: [
    "boolean (isActive / widgetIsAvailable)",
    "string[] (getActiveCapabilities)",
    "Change notifications to subscribers",
  ],
  upstream: [
    "Whatever boot-time/live process discovers the active capability graph (not present in this package) calls setActiveCapabilities/activate/deactivate",
  ],
  downstream: [
    "DashboardRegistry.resolveProductLayout (gates 'permitted' on widgetIsAvailable)",
    "Any UI subscribing directly via subscribe()",
  ],
  evidence:
    "None. Capability changes are broadcast to subscribers but not logged or persisted anywhere in this class.",
  replay:
    "Not supported. 'active' is a plain in-memory Set, reset on reload; no history of past capability states.",
  observability:
    "subscribe(listener) is the one observability hook — callers can watch the active-capability set change in real time.",
  knowledge:
    "The current active-capability set is this engine's entire knowledge; it holds no model of which capabilities SHOULD be active, only which are.",
  health:
    "No self-reported health signal. activate/deactivate on an already-active/inactive capability are no-ops (no error).",
  version: "@bhiv/dashboard-sdk@0.1.0",
  compatibility:
    "This class IS the compatibility check for widgets vs. runtime capabilities; it has no notion of compatibility between capabilities themselves (e.g. mutually exclusive capabilities are not modeled).",
  status: "ACTIVE",
};

export const COMPOSITION_ENGINE_IDENTITY: RuntimeIdentityCard = {
  id: "composition-engine",
  layer:
    "Registry / SDK core — packages/dashboard-sdk/src/registry/ProductLayoutRegistry.ts + the assembly step of DashboardRegistry.resolveProductLayout()",
  identity:
    "ProductLayoutRegistry class (singleton globalProductLayoutRegistry) plus the zone-assembly .map() inside DashboardRegistry.resolveProductLayout()",
  purpose:
    "Store named, per-product dashboard layouts as ordered widget-id references, and assemble a requested layout's zones — with override merging and ordering — into the final ResolvedLayoutZone[] handed to a grid renderer.",
  authority: [
    "Register / unregister / look up ProductLayouts by product+id (register, unregister, get, getAllForProduct, getAll)",
    "Apply visibilityOverrides / labelOverrides / colSpanOverrides on top of a zone's own declared values",
    "Determine final zone order (zone.order ?? index) and visibility (requestedVisible && permitted)",
    "Shape the output into ResolvedLayoutZone, structurally compatible with @bhiv/dashboard-layout's LayoutZoneDefinition",
  ],
  notAuthority: [
    "Does not register or discover widgets — see Discovery",
    "Does not decide which widget version/component fills a zone — see Agent Selector",
    "Does not decide capability-based availability — see Dependency/Compatibility Engine (it only consumes the resulting 'permitted' flag)",
    "Does not merge or generate the app-level DashboardConfig — see Runtime Config Generator",
  ],
  inputs: [
    "ProductLayout (id, product, zones)",
    "ResolveProductLayoutOptions (context, visibilityOverrides, labelOverrides, colSpanOverrides)",
    "The per-zone widget/component selection from Agent Selector",
    "The 'permitted' flag from Dependency/Compatibility Engine",
  ],
  outputs: ["ResolvedLayoutZone[] — ready for @bhiv/dashboard-layout's useLayoutEngine / DashboardGrid"],
  upstream: [
    "Consuming apps register layouts at bootstrap (registerLayout)",
    "WidgetRegistry and CapabilityRuntime supply the per-zone selection/gating this step folds together",
  ],
  downstream: [
    "useProductLayout hook",
    "The app's grid renderer (e.g. apps/shakti's Dashboard.tsx via @bhiv/dashboard-layout)",
  ],
  evidence: "None. No log of which layout/version was resolved for a given render.",
  replay:
    "Not supported. Resolution is recomputed on demand; useProductLayout only memoizes per-render via useMemo, it does not persist history.",
  observability: "None built in.",
  knowledge:
    "The full set of registered per-product layouts (the layouts map) — the platform's live knowledge of 'what layouts exist for which products'.",
  health:
    "A zone whose widget is missing/unpermitted/capability-gated renders as an invisible zone rather than throwing, so one bad zone can't take down the rest of the layout (per DashboardRegistry's own doc comment).",
  version:
    "@bhiv/dashboard-sdk@0.1.0; ProductLayout.version lets a layout bump its own shape-version to invalidate stale persisted client-side layouts (consumed by @bhiv/dashboard-layout, not enforced here)",
  compatibility:
    "Structurally compatible output (ResolvedLayoutZone ≈ LayoutZoneDefinition) is a deliberate contract with @bhiv/dashboard-layout.",
  status: "ACTIVE",
};

export const RUNTIME_CONFIG_GENERATOR_IDENTITY: RuntimeIdentityCard = {
  id: "runtime-config-generator",
  layer: "SDK core / config — packages/dashboard-sdk/src/config/DashboardConfigProvider.tsx + deepMerge.ts",
  identity:
    "DashboardConfigProvider + deepMerge, exposed via DashboardConfigContext / useDashboardConfig",
  purpose:
    "Produce the single effective DashboardConfig an app runs with, by deep-merging a system's defaultConfig with runtime overrides.",
  authority: [
    "Deep-merge plain-object config trees, override-wins-on-conflict, recursing into nested plain objects only (arrays/non-plain values are replaced wholesale)",
    "Memoize the merged config per [defaultConfig, overrides] identity (useMemo)",
    "Provide the merged config to the rest of the tree via DashboardConfigContext",
  ],
  notAuthority: [
    "Does not know about widgets, layouts, or capabilities — it merges whatever DashboardConfig/DashboardZoneMap shape the consuming app defines",
    "Does not validate the merged config against a schema — deepMerge is structural only, no type or business-rule validation",
    "Does not persist or version the merged config — each render recomputes from the two inputs given",
  ],
  inputs: ["defaultConfig: DashboardConfig<TZones>", "overrides?: DashboardConfigOverride<TZones>"],
  outputs: ["mergedConfig: DashboardConfig<TZones>, provided via React context; consumed through useDashboardConfig()"],
  upstream: ["The consuming app supplies both defaultConfig (e.g. SHAKTI's defaultDashboardConfig) and any overrides"],
  downstream: [
    "Every component under DashboardConfigProvider that calls useDashboardConfig()",
    "DashboardProvider's composed context",
  ],
  evidence: "None. No log of what changed between default and merged config.",
  replay:
    "Not supported. Purely a function of the two inputs at render time, no history retained.",
  observability: "None. No logging/metrics; only React DevTools context inspection.",
  knowledge:
    "None beyond the two inputs it's given each render — it holds no independent state.",
  health:
    "No self-reported health signal. deepMerge cannot throw on well-typed input (worst case: an override value silently replaces rather than merges into a non-plain-object base).",
  version: "@bhiv/dashboard-sdk@0.1.0",
  compatibility:
    "Generic over TZones, so it works with any app's DashboardConfig/DashboardZoneMap shape without modification.",
  status: "ACTIVE",
};

/** All five runtime identity cards, in the order they appear in RUNTIME_IDENTITY.md. */
export const RUNTIME_IDENTITY_CARDS: readonly RuntimeIdentityCard[] = [
  DISCOVERY_IDENTITY,
  AGENT_SELECTOR_IDENTITY,
  DEPENDENCY_COMPATIBILITY_ENGINE_IDENTITY,
  COMPOSITION_ENGINE_IDENTITY,
  RUNTIME_CONFIG_GENERATOR_IDENTITY,
];

export function getRuntimeIdentityCard(id: RuntimeLayerId): RuntimeIdentityCard {
  const card = RUNTIME_IDENTITY_CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`No runtime identity card registered for id "${id}".`);
  return card;
}
