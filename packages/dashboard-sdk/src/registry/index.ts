// ─── Dashboard Registry ─────────────────────────────────────────────────────────
// Widget registration, discovery, versioning, dynamic (code-split) loading,
// permissions/visibility, runtime capability mapping, and per-product layouts.
// Nothing is pre-registered here — consuming apps call `registerWidget` /
// `registerLayout` explicitly (see each app's `config/widgets.registry.ts`).

export * from "./types";

export { WidgetRegistry, globalWidgetRegistry } from "./WidgetRegistry";
export { ProductLayoutRegistry, globalProductLayoutRegistry } from "./ProductLayoutRegistry";
export { CapabilityRuntime, globalCapabilityRuntime } from "./CapabilityRuntime";
export { DashboardRegistry, globalDashboardRegistry } from "./DashboardRegistry";
export type { ResolveProductLayoutOptions } from "./DashboardRegistry";
export { useProductLayout } from "./useProductLayout";

// ─── Agent Selector (composition-time-only, additive) ──────────────────────
// Discovery, Dependency Resolution, Compatibility Validation, Composition
// Validation, Runtime Graph, Runtime Config Export, and Lifecycle Metadata
// for registered layouts. Never executes runtime/workflows — see
// AgentSelector.ts's header comment for the hard boundary.
export { AgentSelector, globalAgentSelector } from "./AgentSelector";
export type {
  LifecycleStatus,
  LifecycleSummary,
  DependencyResolutionEntry,
  DependencyResolutionReport,
  CompatibilityValidationReport,
  AgentSelectionResult,
  CompositionValidationIssue,
  CompositionValidationReport,
  RuntimeGraphNodeKind,
  RuntimeGraphNode,
  RuntimeGraphEdge,
  RuntimeGraph,
  RuntimeConfigExportZone,
  RuntimeConfigExport,
} from "./AgentSelector";

// ─── Runtime Identity (documentation-as-code, additive-only) ───────────────
export {
  RUNTIME_IDENTITY_CARDS,
  getRuntimeIdentityCard,
  DISCOVERY_IDENTITY,
  AGENT_SELECTOR_IDENTITY,
  DEPENDENCY_COMPATIBILITY_ENGINE_IDENTITY,
  COMPOSITION_ENGINE_IDENTITY,
  RUNTIME_CONFIG_GENERATOR_IDENTITY,
} from "./runtimeIdentity";
export type { RuntimeIdentityCard, RuntimeLayerId } from "./runtimeIdentity";
