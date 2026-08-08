// ─── Agent Selector ──────────────────────────────────────────────────────────
// Composition-time-only engine. For a declared layout zone (or a whole
// layout) it performs:
//   • Discovery              — candidate widget/version lookup (delegates to WidgetRegistry.discover)
//   • Dependency Resolution  — which of a widget's declared capabilities are currently active
//   • Compatibility Validation — product / permission / capability / version fit for one zone
//   • Composition Validation — does a whole layout's zone set compose without conflicts
//   • Runtime Graph          — a static zone→widget→capability graph
//   • Runtime Config Export  — a serializable, point-in-time snapshot of a resolved composition
//   • Lifecycle Metadata     — a status (`LifecycleStatus`) explaining why each zone did/didn't resolve
//
// HARD BOUNDARY — this module never executes runtime or workflows:
//   • It never imports `RuntimeConnector` or anything from `../runtime`.
//   • It never polls, subscribes to, or otherwise talks to a live backend service.
//   • It never calls `CapabilityRuntime.activate` / `.deactivate` / `.setActiveCapabilities` —
//     only the read-only `isActive` / `getActiveCapabilities` / `widgetIsAvailable`.
//   • "Resolving a component" here means the same thing it already means in
//     `DashboardRegistry.resolveProductLayout` (looking up a component reference,
//     optionally wrapping a loader in `React.lazy`) — it does not render, mount,
//     or invoke that component.
//
// This module is additive: it complements, and does not replace or modify,
// `DashboardRegistry.resolveProductLayout`, which remains the frozen, minimal
// per-zone selection path apps already depend on. `AgentSelector` is the
// richer, composition-time analysis surface used by tooling, diagnostics,
// and tests.

import type { ComponentType } from "react";
import type {
  ProductLayoutZone,
  RegistryDiscoveryQuery,
  WidgetDefinition,
  WidgetVisibilityContext,
} from "./types";
import { CapabilityRuntime, globalCapabilityRuntime } from "./CapabilityRuntime";
import { ProductLayoutRegistry, globalProductLayoutRegistry } from "./ProductLayoutRegistry";
import { WidgetRegistry, globalWidgetRegistry } from "./WidgetRegistry";

const DEPRECATED_TAG = "deprecated";

// ─── Lifecycle Metadata ────────────────────────────────────────────────────

/** Why a zone did or didn't resolve to a usable widget selection. */
export type LifecycleStatus =
  | "resolved"
  | "capability-gated"
  | "unpermitted"
  | "unresolved"
  | "deprecated";

export interface LifecycleSummary {
  product: string;
  layoutId: string;
  counts: Record<LifecycleStatus, number>;
  total: number;
}

// ─── Dependency Resolution ─────────────────────────────────────────────────

export interface DependencyResolutionEntry {
  capability: string;
  active: boolean;
}

export interface DependencyResolutionReport {
  widgetId: string;
  version: string;
  requiredCapabilities: string[];
  dependencies: DependencyResolutionEntry[];
  /** Mirrors `CapabilityRuntime.widgetIsAvailable`: true if the widget declares no capabilities, or at least one declared capability is active. */
  satisfied: boolean;
}

// ─── Compatibility Validation ───────────────────────────────────────────────

export interface CompatibilityValidationReport {
  widgetId: string;
  requestedVersion?: string;
  resolvedVersion?: string;
  productCompatible: boolean;
  permissionSatisfied: boolean;
  capabilityCompatible: boolean;
  compatible: boolean;
  issues: string[];
}

// ─── Selection (Discovery + Dependency Resolution + Compatibility, per zone) ─

export interface AgentSelectionResult {
  zoneKey: string;
  widgetId: string;
  requestedVersion?: string;
  widget?: WidgetDefinition;
  resolvedVersion?: string;
  component?: ComponentType<any>;
  discovery: { candidateVersions: string[] };
  dependencies: DependencyResolutionReport | null;
  compatibility: CompatibilityValidationReport;
  lifecycle: LifecycleStatus;
}

// ─── Composition Validation ─────────────────────────────────────────────────

export interface CompositionValidationIssue {
  zoneKey: string;
  code: "duplicate-zone" | "unresolved-widget" | "capability-gated" | "unpermitted" | "deprecated";
  message: string;
}

export interface CompositionValidationReport {
  product: string;
  layoutId: string;
  /** True when there are no blocking issues. A zone resolving to a widget tagged "deprecated" is a warning, not a blocker. */
  valid: boolean;
  zoneCount: number;
  resolvedCount: number;
  issues: CompositionValidationIssue[];
}

// ─── Runtime Graph ───────────────────────────────────────────────────────────

export type RuntimeGraphNodeKind = "zone" | "widget" | "capability";

export interface RuntimeGraphNode {
  id: string;
  kind: RuntimeGraphNodeKind;
  label: string;
  status?: LifecycleStatus;
}

export interface RuntimeGraphEdge {
  from: string;
  to: string;
  kind: "fills" | "requires";
}

/** Static, declarative graph of a layout's zone→widget→capability shape. Building this never touches a live service. */
export interface RuntimeGraph {
  product: string;
  layoutId: string;
  nodes: RuntimeGraphNode[];
  edges: RuntimeGraphEdge[];
}

// ─── Runtime Config Export ──────────────────────────────────────────────────

export interface RuntimeConfigExportZone {
  zoneKey: string;
  widgetId: string;
  version?: string;
  visible: boolean;
  capabilities: string[];
  lifecycle: LifecycleStatus;
}

/** Serializable, point-in-time snapshot of a resolved composition — not a live config subscription, a one-shot export. */
export interface RuntimeConfigExport {
  product: string;
  layoutId: string;
  generatedAt: number;
  zones: RuntimeConfigExportZone[];
}

/**
 * Composition-time selection engine. Wraps `WidgetRegistry`,
 * `ProductLayoutRegistry`, and a read-only view of `CapabilityRuntime` to
 * answer "what would this layout compose into" without rendering, mounting,
 * activating, or executing anything.
 */
export class AgentSelector {
  private readonly widgets: WidgetRegistry;
  private readonly layouts: ProductLayoutRegistry;
  private readonly capabilities: CapabilityRuntime;

  constructor(
    widgets: WidgetRegistry = globalWidgetRegistry,
    layouts: ProductLayoutRegistry = globalProductLayoutRegistry,
    capabilities: CapabilityRuntime = globalCapabilityRuntime,
  ) {
    this.widgets = widgets;
    this.layouts = layouts;
    this.capabilities = capabilities;
  }

  // ── Discovery ────────────────────────────────────────────────────────────

  /** Read-only candidate lookup. Delegates entirely to `WidgetRegistry.discover`. */
  public discoverCandidates(query: RegistryDiscoveryQuery = {}): WidgetDefinition[] {
    return this.widgets.discover(query);
  }

  // ── Dependency Resolution ────────────────────────────────────────────────

  /** Reports which of a widget's declared capabilities are currently active. Read-only — never activates/deactivates anything. */
  public resolveDependencies(widget: WidgetDefinition): DependencyResolutionReport {
    const requiredCapabilities = widget.capabilities ?? [];
    const dependencies = requiredCapabilities.map((capability) => ({
      capability,
      active: this.capabilities.isActive(capability),
    }));
    return {
      widgetId: widget.id,
      version: widget.version ?? "1.0.0",
      requiredCapabilities,
      dependencies,
      satisfied: this.capabilities.widgetIsAvailable(widget),
    };
  }

  // ── Compatibility Validation ─────────────────────────────────────────────

  /** Validates one zone's widget reference against product scope, permission/visibility, and active capabilities. */
  public validateCompatibility(
    zone: ProductLayoutZone,
    product: string,
    context: WidgetVisibilityContext = {},
  ): CompatibilityValidationReport {
    const widget = this.widgets.get(zone.widgetId, zone.version);
    const issues: string[] = [];

    if (!widget) {
      issues.push(
        `No registration found for widget "${zone.widgetId}"${zone.version ? `@${zone.version}` : ""}.`,
      );
      return {
        widgetId: zone.widgetId,
        requestedVersion: zone.version,
        productCompatible: false,
        permissionSatisfied: false,
        capabilityCompatible: false,
        compatible: false,
        issues,
      };
    }

    const productCompatible = !widget.products || widget.products.includes(product);
    if (!productCompatible) {
      issues.push(`Widget "${widget.id}" is not registered for product "${product}".`);
    }

    const permissionSatisfied = this.widgets.isVisibleFor(widget, { ...context, product });
    if (!permissionSatisfied) {
      issues.push(`Widget "${widget.id}" fails its permission/visibility rule for the given context.`);
    }

    const capabilityCompatible = this.capabilities.widgetIsAvailable(widget);
    if (!capabilityCompatible) {
      issues.push(`Widget "${widget.id}" declares capabilities that are not currently active.`);
    }

    return {
      widgetId: widget.id,
      requestedVersion: zone.version,
      resolvedVersion: widget.version,
      productCompatible,
      permissionSatisfied,
      capabilityCompatible,
      compatible: productCompatible && permissionSatisfied && capabilityCompatible,
      issues,
    };
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  /**
   * Full composition-time selection for one zone: candidate discovery,
   * dependency resolution, compatibility validation, and the resulting
   * lifecycle status — plus the resolved component reference (never invoked).
   */
  public selectForZone(
    zone: ProductLayoutZone,
    product: string,
    context: WidgetVisibilityContext = {},
  ): AgentSelectionResult {
    const widget = this.widgets.get(zone.widgetId, zone.version);
    const candidateVersions = this.widgets.listVersions(zone.widgetId);
    const compatibility = this.validateCompatibility(zone, product, context);
    const dependencies = widget ? this.resolveDependencies(widget) : null;

    let lifecycle: LifecycleStatus;
    if (!widget) {
      lifecycle = "unresolved";
    } else if (widget.tags?.includes(DEPRECATED_TAG)) {
      lifecycle = "deprecated";
    } else if (!compatibility.permissionSatisfied) {
      lifecycle = "unpermitted";
    } else if (!compatibility.capabilityCompatible) {
      lifecycle = "capability-gated";
    } else {
      lifecycle = "resolved";
    }

    return {
      zoneKey: zone.widgetId,
      widgetId: zone.widgetId,
      requestedVersion: zone.version,
      widget,
      resolvedVersion: widget?.version,
      component: widget ? this.widgets.resolveComponent(zone.widgetId, zone.version) : undefined,
      discovery: { candidateVersions },
      dependencies,
      compatibility,
      lifecycle,
    };
  }

  // ── Composition Validation ───────────────────────────────────────────────

  /** Validates an entire registered layout: duplicate zones, unresolved widgets, capability gating, permission failures, and deprecated selections. */
  public validateComposition(
    product: string,
    layoutId: string,
    context: WidgetVisibilityContext = {},
  ): CompositionValidationReport {
    const layout = this.layouts.get(product, layoutId);

    if (!layout) {
      return {
        product,
        layoutId,
        valid: false,
        zoneCount: 0,
        resolvedCount: 0,
        issues: [
          {
            zoneKey: layoutId,
            code: "unresolved-widget",
            message: `No layout registered for product "${product}" with id "${layoutId}".`,
          },
        ],
      };
    }

    const issues: CompositionValidationIssue[] = [];
    const seenZoneKeys = new Set<string>();
    let resolvedCount = 0;

    for (const zone of layout.zones) {
      if (seenZoneKeys.has(zone.widgetId)) {
        issues.push({
          zoneKey: zone.widgetId,
          code: "duplicate-zone",
          message: `Zone "${zone.widgetId}" is declared more than once in layout "${layoutId}".`,
        });
      }
      seenZoneKeys.add(zone.widgetId);

      const selection = this.selectForZone(zone, product, context);
      switch (selection.lifecycle) {
        case "resolved":
          resolvedCount += 1;
          break;
        case "unresolved":
          issues.push({
            zoneKey: zone.widgetId,
            code: "unresolved-widget",
            message: `Zone "${zone.widgetId}" has no matching widget registration.`,
          });
          break;
        case "capability-gated":
          issues.push({
            zoneKey: zone.widgetId,
            code: "capability-gated",
            message: `Zone "${zone.widgetId}" is gated on a capability that is not currently active.`,
          });
          break;
        case "unpermitted":
          issues.push({
            zoneKey: zone.widgetId,
            code: "unpermitted",
            message: `Zone "${zone.widgetId}" fails its permission/visibility rule for the given context.`,
          });
          break;
        case "deprecated":
          issues.push({
            zoneKey: zone.widgetId,
            code: "deprecated",
            message: `Zone "${zone.widgetId}" resolves to a widget tagged "deprecated".`,
          });
          break;
      }
    }

    const blocking = issues.filter((issue) => issue.code !== "deprecated");

    return {
      product,
      layoutId,
      valid: blocking.length === 0,
      zoneCount: layout.zones.length,
      resolvedCount,
      issues,
    };
  }

  // ── Runtime Graph ────────────────────────────────────────────────────────

  /** Builds a static zone→widget→capability graph for a layout. Purely a shape derived from already-registered state — never touches a live service. */
  public buildRuntimeGraph(
    product: string,
    layoutId: string,
    context: WidgetVisibilityContext = {},
  ): RuntimeGraph {
    const layout = this.layouts.get(product, layoutId);
    const nodes: RuntimeGraphNode[] = [];
    const edges: RuntimeGraphEdge[] = [];

    if (!layout) return { product, layoutId, nodes, edges };

    const seenCapabilityNodes = new Set<string>();

    for (const zone of layout.zones) {
      const selection = this.selectForZone(zone, product, context);
      const zoneNodeId = `zone:${zone.widgetId}`;
      nodes.push({ id: zoneNodeId, kind: "zone", label: zone.label ?? zone.widgetId, status: selection.lifecycle });

      if (selection.widget) {
        const widgetNodeId = `widget:${selection.widget.id}@${selection.widget.version ?? "1.0.0"}`;
        nodes.push({
          id: widgetNodeId,
          kind: "widget",
          label: selection.widget.name,
          status: selection.lifecycle,
        });
        edges.push({ from: zoneNodeId, to: widgetNodeId, kind: "fills" });

        for (const capability of selection.widget.capabilities ?? []) {
          const capabilityNodeId = `capability:${capability}`;
          if (!seenCapabilityNodes.has(capabilityNodeId)) {
            seenCapabilityNodes.add(capabilityNodeId);
            nodes.push({ id: capabilityNodeId, kind: "capability", label: capability });
          }
          edges.push({ from: widgetNodeId, to: capabilityNodeId, kind: "requires" });
        }
      }
    }

    return { product, layoutId, nodes, edges };
  }

  // ── Runtime Config Export ────────────────────────────────────────────────

  /**
   * Serializable, point-in-time snapshot of a resolved composition. This is
   * a one-shot export (safe to `JSON.stringify`) — it does not merge into or
   * emit any live `DashboardConfig`, and it does not start, poll, or
   * subscribe to anything. For the live app-level config, see the Runtime
   * Config Generator (`DashboardConfigProvider` / `useDashboardConfig`).
   */
  public exportRuntimeConfig(
    product: string,
    layoutId: string,
    context: WidgetVisibilityContext = {},
  ): RuntimeConfigExport {
    const layout = this.layouts.get(product, layoutId);
    if (!layout) return { product, layoutId, generatedAt: Date.now(), zones: [] };

    const zones: RuntimeConfigExportZone[] = layout.zones.map((zone) => {
      const selection = this.selectForZone(zone, product, context);
      const requestedVisible = zone.visible ?? selection.widget?.defaultVisible ?? true;
      return {
        zoneKey: zone.widgetId,
        widgetId: zone.widgetId,
        version: selection.resolvedVersion,
        visible: Boolean(requestedVisible) && selection.lifecycle === "resolved",
        capabilities: selection.widget?.capabilities ?? [],
        lifecycle: selection.lifecycle,
      };
    });

    return { product, layoutId, generatedAt: Date.now(), zones };
  }

  // ── Lifecycle Metadata ───────────────────────────────────────────────────

  /** Aggregate lifecycle-status counts across every zone in a layout. */
  public getLifecycleSummary(
    product: string,
    layoutId: string,
    context: WidgetVisibilityContext = {},
  ): LifecycleSummary {
    const layout = this.layouts.get(product, layoutId);
    const counts: Record<LifecycleStatus, number> = {
      resolved: 0,
      "capability-gated": 0,
      unpermitted: 0,
      unresolved: 0,
      deprecated: 0,
    };

    if (!layout) return { product, layoutId, counts, total: 0 };

    for (const zone of layout.zones) {
      const selection = this.selectForZone(zone, product, context);
      counts[selection.lifecycle] += 1;
    }

    return { product, layoutId, counts, total: layout.zones.length };
  }
}

export const globalAgentSelector = new AgentSelector();
