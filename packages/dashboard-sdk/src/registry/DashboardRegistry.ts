import type {
  ProductLayout,
  RegistryDiscoveryQuery,
  ResolvedLayoutZone,
  WidgetDefinition,
  WidgetVisibilityContext,
} from "./types";
import { CapabilityRuntime, globalCapabilityRuntime } from "./CapabilityRuntime";
import { ProductLayoutRegistry, globalProductLayoutRegistry } from "./ProductLayoutRegistry";
import { WidgetRegistry, globalWidgetRegistry } from "./WidgetRegistry";

export interface ResolveProductLayoutOptions {
  /** Viewer context (role, permissions, active capabilities) used for permission/visibility checks. */
  context?: WidgetVisibilityContext;
  /** Per-widget visibility overrides (e.g. from app-level config), applied over the layout's own zone.visible. */
  visibilityOverrides?: Record<string, boolean>;
  /** Per-widget label overrides. */
  labelOverrides?: Record<string, string>;
  /** Per-widget colSpan overrides. */
  colSpanOverrides?: Record<string, string>;
}

/**
 * Single entry point for the dashboard registry: widget registration +
 * discovery + versioning + dynamic loading (`widgets`), named per-product
 * layouts/templates (`layouts`), and runtime capability mapping
 * (`capabilities`). `resolveProductLayout` turns a registered layout into a
 * fully-resolved, permission- and capability-filtered zone list ready for a
 * grid renderer — no hardcoded widget-to-zone wiring required in apps.
 */
export class DashboardRegistry {
  public readonly widgets: WidgetRegistry;
  public readonly layouts: ProductLayoutRegistry;
  public readonly capabilities: CapabilityRuntime;

  constructor(
    widgets: WidgetRegistry = globalWidgetRegistry,
    layouts: ProductLayoutRegistry = globalProductLayoutRegistry,
    capabilities: CapabilityRuntime = globalCapabilityRuntime,
  ) {
    this.widgets = widgets;
    this.layouts = layouts;
    this.capabilities = capabilities;
  }

  public registerWidget(definition: WidgetDefinition): void {
    this.widgets.register(definition);
  }

  public registerWidgets(definitions: WidgetDefinition[]): void {
    this.widgets.registerMany(definitions);
  }

  public registerLayout(layout: ProductLayout): void {
    this.layouts.register(layout);
  }

  public discoverWidgets(query: RegistryDiscoveryQuery = {}): WidgetDefinition[] {
    return this.widgets.discover(query);
  }

  /**
   * Resolves a registered product layout into renderable zones: each zone's
   * widget is looked up (by pinned or latest version), its permission rule
   * and active-capability requirement are checked against `options.context`,
   * and its component is dynamically resolved via `WidgetRegistry.resolveComponent`.
   * A widget that's missing, unpermitted, or capability-gated renders as an
   * invisible zone rather than throwing, so one bad registration can't take
   * down the rest of the layout.
   */
  public resolveProductLayout(
    product: string,
    layoutId: string,
    options: ResolveProductLayoutOptions = {},
  ): ResolvedLayoutZone[] {
    const layout = this.layouts.get(product, layoutId);
    if (!layout) return [];

    const { context = {}, visibilityOverrides, labelOverrides, colSpanOverrides } = options;

    return layout.zones.map((zone, index) => {
      const widget = this.widgets.get(zone.widgetId, zone.version);

      const permitted = Boolean(
        widget &&
          this.widgets.isVisibleFor(widget, { ...context, product }) &&
          this.capabilities.widgetIsAvailable(widget),
      );

      const requestedVisible = visibilityOverrides?.[zone.widgetId] ?? zone.visible ?? widget?.defaultVisible ?? true;

      return {
        key: zone.widgetId,
        visible: requestedVisible && permitted,
        title: labelOverrides?.[zone.widgetId] ?? zone.label ?? widget?.name,
        colSpan: colSpanOverrides?.[zone.widgetId] ?? zone.colSpan ?? widget?.defaultColSpan,
        order: zone.order ?? index,
        skeletonHeight: zone.skeletonHeight ?? widget?.defaultSkeletonHeight,
        fallbackTitle:
          zone.fallbackTitle ?? widget?.fallbackTitle ?? (widget ? `${widget.name} Crashed` : undefined),
        component: widget ? this.widgets.resolveComponent(zone.widgetId, zone.version) : undefined,
      };
    });
  }
}

export const globalDashboardRegistry = new DashboardRegistry();
