// ─── Extension Points ──────────────────────────────────────────────────────────
// Registries and building-block "framework" components that let consuming
// apps extend the dashboard platform at runtime: register custom widgets,
// page templates, and nav items, or compose new zone/widget UI on top of
// the same primitives the built-in frameworks use.

export {
  WidgetRegistry,
  globalWidgetRegistry,
  ProductLayoutRegistry,
  globalProductLayoutRegistry,
  CapabilityRuntime,
  globalCapabilityRuntime,
  DashboardRegistry,
  globalDashboardRegistry,
  useProductLayout,
  AgentSelector,
  globalAgentSelector,
  RUNTIME_IDENTITY_CARDS,
  getRuntimeIdentityCard,
  DISCOVERY_IDENTITY,
  AGENT_SELECTOR_IDENTITY,
  DEPENDENCY_COMPATIBILITY_ENGINE_IDENTITY,
  COMPOSITION_ENGINE_IDENTITY,
  RUNTIME_CONFIG_GENERATOR_IDENTITY,
} from "../registry";
export type {
  WidgetDefinition,
  ProductLayout,
  ProductLayoutZone,
  ResolvedLayoutZone,
  RegistryDiscoveryQuery,
  WidgetVisibilityContext,
  WidgetPermissionRule,
  WidgetLoader,
  ResolveProductLayoutOptions,
  RuntimeIdentityCard,
  RuntimeLayerId,
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
} from "../registry";

export { TemplateRegistry, globalTemplateRegistry } from "../templates/TemplateRegistry";
export type { RegisteredTemplate } from "../templates/TemplateRegistry";

export { NavigationEngine, globalNavigationEngine } from "../navigation/NavigationEngine";

export { BaseCard, MetricCardFramework } from "../frameworks/card/BaseCard";
export type { BaseCardProps, MetricCardFrameworkProps } from "../frameworks/card/BaseCard";

export { BaseTableFramework } from "../frameworks/table/BaseTableFramework";
export type { ColumnDef, BaseTableFrameworkProps } from "../frameworks/table/BaseTableFramework";

export { GraphFramework } from "../frameworks/graph/GraphFramework";
export type { GraphDataPoint, GraphFrameworkProps } from "../frameworks/graph/GraphFramework";

export { TimelineFramework } from "../frameworks/timeline/TimelineFramework";
export type { TimelineEvent, TimelineFrameworkProps } from "../frameworks/timeline/TimelineFramework";

export { LayoutEngine } from "../layout/LayoutEngine";
export { ZoneLayoutEngine } from "../layout/ZoneLayoutEngine";
export type { ZoneConfig, LayoutEngineProps, DensityMode } from "../layout/types";
