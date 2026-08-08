// ─── Dashboard Registry — Type Contracts ──────────────────────────────────────
// Generic, system-agnostic contract for registering widgets and assembling
// them into per-product dashboard layouts at runtime. Nothing here is
// hardcoded to a particular app (SHAKTI, etc.) — consuming apps register
// their own widgets/layouts against the shared `globalDashboardRegistry`.

import type { ComponentType } from "react";

export type WidgetCategory = string;
export type Capability = string;
export type Permission = string;
export type ProductId = string;

// ─── Permissions & Visibility ─────────────────────────────────────────────────

/** Access rule evaluated against the current viewer before a widget is shown. */
export interface WidgetPermissionRule {
  /** Roles allowed to view this widget. Omitted/empty = no role restriction. */
  roles?: string[];
  /** Permission strings the viewer must all hold. Omitted/empty = no permission restriction. */
  permissions?: Permission[];
}

/** Runtime context a registry consumer supplies to resolve visibility/permissions. */
export interface WidgetVisibilityContext {
  role?: string;
  permissions?: Permission[];
  capabilities?: Capability[];
  product?: ProductId;
  [key: string]: unknown;
}

export type WidgetVisibilityFn = (context: WidgetVisibilityContext) => boolean;

// ─── Widgets ───────────────────────────────────────────────────────────────────

/** Dynamic import used for code-split widget loading, e.g. `() => import("./Foo")`. */
export type WidgetLoader = () => Promise<{ default: ComponentType<any> }>;

export interface WidgetDefinition {
  /** Stable identifier shared by every version of this widget. */
  id: string;
  /** Semver-ish version string (e.g. "1.0.0"). Defaults to "1.0.0" if omitted. */
  version?: string;
  name: string;
  description?: string;
  category: WidgetCategory;
  /** Runtime/BHIV-TANTRA capabilities this widget maps to. */
  capabilities?: Capability[];
  /** Products/apps allowed to use this widget. Omitted = available to every product. */
  products?: ProductId[];
  /** Access control evaluated before the widget is discoverable/renderable. */
  permission?: WidgetPermissionRule;
  /** Whether the widget is visible by default when no layout/override says otherwise. */
  defaultVisible?: boolean;
  /** Extra visibility predicate, evaluated in addition to `permission`. */
  isVisible?: WidgetVisibilityFn;
  /** Dynamic import loader — preferred for code-splitting/dynamic loading. */
  loader?: WidgetLoader;
  /** Already-resolved component, for widgets that don't need code-splitting. */
  component?: ComponentType<any>;
  /** Free-form tags for discovery/search. */
  tags?: string[];
  /** Default grid placement hints — used unless a product layout overrides them. */
  defaultColSpan?: string;
  defaultSkeletonHeight?: string;
  fallbackTitle?: string;
}

export interface RegistryDiscoveryQuery {
  product?: ProductId;
  category?: WidgetCategory;
  capability?: Capability;
  tag?: string;
  /** When supplied, results are filtered to widgets visible/permitted for this viewer. */
  context?: WidgetVisibilityContext;
}

// ─── Product Layouts ───────────────────────────────────────────────────────────
// A named arrangement of widgets for one product (e.g. SHAKTI's "command-center"
// layout). Layouts reference widgets by id — no component imports live here.

export interface ProductLayoutZone {
  /** Widget id to place in this zone. */
  widgetId: string;
  /** Pin to a specific widget version; omitted = latest registered version. */
  version?: string;
  order?: number;
  visible?: boolean;
  colSpan?: string;
  label?: string;
  skeletonHeight?: string;
  fallbackTitle?: string;
}

export interface ProductLayout {
  id: string;
  product: ProductId;
  name: string;
  description?: string;
  /** Bump when the zone set changes shape, to invalidate stale persisted layouts. */
  version?: number;
  zones: ProductLayoutZone[];
}

/**
 * A fully-resolved zone, ready to hand to a layout/grid renderer. Structurally
 * compatible with `@bhiv/dashboard-layout`'s `LayoutZoneDefinition` (same
 * field names/types), so apps can pass the result of
 * `DashboardRegistry.resolveProductLayout` straight through without mapping.
 */
export interface ResolvedLayoutZone {
  key: string;
  visible: boolean;
  title?: string;
  colSpan?: string;
  order?: number;
  skeletonHeight?: string;
  fallbackTitle?: string;
  component?: ComponentType<any>;
}
