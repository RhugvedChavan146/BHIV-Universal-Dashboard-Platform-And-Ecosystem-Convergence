import { lazy } from "react";
import type { ComponentType } from "react";
import type {
  RegistryDiscoveryQuery,
  WidgetDefinition,
  WidgetVisibilityContext,
} from "./types";

interface InternalEntry extends WidgetDefinition {
  version: string;
}

const DEFAULT_VERSION = "1.0.0";

function versionKey(id: string, version: string): string {
  return `${id}@${version}`;
}

/** Compares two "1.2.3"-style version strings. >0 if `a` is newer than `b`. */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => parseInt(n, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Central registry for dashboard widgets: registration, multi-version storage,
 * discovery by product/category/capability/tag, permission + visibility
 * checks, and dynamic (code-split) component resolution. Consuming apps
 * register their widgets explicitly — nothing here is pre-populated.
 */
export class WidgetRegistry {
  private entries: Map<string, InternalEntry> = new Map();
  private latestVersion: Map<string, string> = new Map();
  private lazyCache: Map<string, ComponentType<any>> = new Map();

  /** Registers a widget definition. Throws if this exact id+version is already registered. */
  public register(definition: WidgetDefinition): void {
    const version = definition.version ?? DEFAULT_VERSION;
    const key = versionKey(definition.id, version);
    if (this.entries.has(key)) {
      throw new Error(`Widget "${definition.id}@${version}" is already registered.`);
    }

    this.entries.set(key, { ...definition, version });

    const currentLatest = this.latestVersion.get(definition.id);
    if (!currentLatest || compareVersions(version, currentLatest) > 0) {
      this.latestVersion.set(definition.id, version);
    }
  }

  public registerMany(definitions: WidgetDefinition[]): void {
    definitions.forEach((definition) => this.register(definition));
  }

  /** Removes a specific version, or every version of `id` when `version` is omitted. */
  public unregister(id: string, version?: string): void {
    if (version) {
      const key = versionKey(id, version);
      this.entries.delete(key);
      this.lazyCache.delete(key);
      if (this.latestVersion.get(id) === version) {
        this.recomputeLatest(id);
      }
      return;
    }

    Array.from(this.entries.keys())
      .filter((key) => key.startsWith(`${id}@`))
      .forEach((key) => {
        this.entries.delete(key);
        this.lazyCache.delete(key);
      });
    this.latestVersion.delete(id);
  }

  private recomputeLatest(id: string): void {
    const versions = this.listVersions(id);
    if (versions.length === 0) {
      this.latestVersion.delete(id);
      return;
    }
    this.latestVersion.set(id, versions.reduce((a, b) => (compareVersions(a, b) > 0 ? a : b)));
  }

  public has(id: string, version?: string): boolean {
    return Boolean(this.get(id, version));
  }

  /** Resolves a widget definition. Omit `version` to get the latest registered version. */
  public get(id: string, version?: string): WidgetDefinition | undefined {
    const resolvedVersion = version ?? this.latestVersion.get(id);
    if (!resolvedVersion) return undefined;
    return this.entries.get(versionKey(id, resolvedVersion));
  }

  public listVersions(id: string): string[] {
    return Array.from(this.entries.values())
      .filter((entry) => entry.id === id)
      .map((entry) => entry.version);
  }

  /** All widgets, one entry per id, at their latest registered version. */
  public getAll(): WidgetDefinition[] {
    return Array.from(this.latestVersion.entries())
      .map(([id, version]) => this.entries.get(versionKey(id, version)))
      .filter((entry): entry is InternalEntry => Boolean(entry));
  }

  public getByCategory(category: string): WidgetDefinition[] {
    return this.getAll().filter((widget) => widget.category === category);
  }

  public getByCapability(capability: string): WidgetDefinition[] {
    return this.getAll().filter((widget) => widget.capabilities?.includes(capability));
  }

  public getByProduct(product: string): WidgetDefinition[] {
    return this.getAll().filter((widget) => !widget.products || widget.products.includes(product));
  }

  /** Evaluates a widget's `permission` rule and `isVisible` predicate against a viewer context. */
  public isVisibleFor(widget: WidgetDefinition, context: WidgetVisibilityContext = {}): boolean {
    const { permission, isVisible } = widget;

    if (permission?.roles && permission.roles.length > 0) {
      if (!context.role || !permission.roles.includes(context.role)) return false;
    }

    if (permission?.permissions && permission.permissions.length > 0) {
      const granted = context.permissions ?? [];
      if (!permission.permissions.every((required) => granted.includes(required))) return false;
    }

    if (isVisible && !isVisible(context)) return false;

    return true;
  }

  /** Discovers widgets by any combination of product, category, capability, tag, and viewer context. */
  public discover(query: RegistryDiscoveryQuery = {}): WidgetDefinition[] {
    let results = this.getAll();

    if (query.product) {
      const product = query.product;
      results = results.filter((widget) => !widget.products || widget.products.includes(product));
    }
    if (query.category) {
      results = results.filter((widget) => widget.category === query.category);
    }
    if (query.capability) {
      const capability = query.capability;
      results = results.filter((widget) => widget.capabilities?.includes(capability));
    }
    if (query.tag) {
      const tag = query.tag;
      results = results.filter((widget) => widget.tags?.includes(tag));
    }
    if (query.context) {
      results = results.filter((widget) => this.isVisibleFor(widget, query.context));
    }

    return results;
  }

  /**
   * Resolves a widget id to a renderable component: an eagerly-registered
   * `component`, or a code-split component built from its `loader` via
   * `React.lazy`. Lazy wrappers are cached per id+version so repeated calls
   * (e.g. across renders) return the same component reference.
   */
  public resolveComponent(id: string, version?: string): ComponentType<any> | undefined {
    const widget = this.get(id, version);
    if (!widget) return undefined;
    if (widget.component) return widget.component;
    if (!widget.loader) return undefined;

    const key = versionKey(widget.id, widget.version ?? DEFAULT_VERSION);
    const cached = this.lazyCache.get(key);
    if (cached) return cached;

    const LazyComponent = lazy(widget.loader);
    this.lazyCache.set(key, LazyComponent);
    return LazyComponent;
  }

  public clear(): void {
    this.entries.clear();
    this.latestVersion.clear();
    this.lazyCache.clear();
  }
}

export const globalWidgetRegistry = new WidgetRegistry();
