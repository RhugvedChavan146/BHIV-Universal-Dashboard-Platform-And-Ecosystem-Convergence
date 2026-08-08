// ─── @bhiv/dashboard-layout — Type Contracts ──────────────────────────────────
// Generic, system-agnostic grid/zone/widget contract for the reusable layout
// engine. Consuming apps (e.g. SHAKTI) supply a list of `LayoutZoneDefinition`
// describing their zones; everything else (ordering, spans, drag/resize state,
// persistence, templates) is managed here.

import type { ComponentType, ReactNode } from "react";

export type DensityMode = "compact" | "standard" | "relaxed";

/** A Tailwind responsive col-span class string, e.g. "col-span-12 lg:col-span-6". */
export type ColSpanClass = string;

// ─── Zones / Widgets ───────────────────────────────────────────────────────────

/**
 * Describes a single placeable zone/widget on the dashboard grid.
 * This is a superset of the legacy `ZoneConfig` from `@bhiv/dashboard-sdk`'s
 * `layout` module — every field that module used (`visible`, `colSpan`,
 * `order`, `skeletonHeight`, `fallbackTitle`, `component`, `title`) means the
 * exact same thing here, so existing zone config objects are valid
 * `LayoutZoneDefinition`s without modification.
 */
export interface LayoutZoneDefinition {
  /** Stable identifier for this zone — used as the persistence/drag/resize key. */
  key: string;
  /** Whether this zone renders at all. */
  visible: boolean;
  /** Display title, used to build the default crash fallback and drag handle label. */
  title?: string;
  /** Default Tailwind col-span classes — the zone's shipped/default placement. */
  colSpan?: ColSpanClass;
  /** Explicit sort order among visible zones. Lower renders first. */
  order?: number;
  skeletonHeight?: string;
  fallbackTitle?: string;
  component?: ComponentType<any>;
  /** Minimum desktop column span (out of 12) allowed while resizing. Default 3. */
  minCols?: number;
  /** Maximum desktop column span (out of 12) allowed while resizing. Default 12. */
  maxCols?: number;
  /** When true, this zone can't be dragged or resized even in edit mode. */
  locked?: boolean;
}

export interface LayoutEngineProps {
  zones?: Record<string, { visible: boolean; colSpan?: ColSpanClass }>;
  density?: DensityMode;
  gap?: string;
  className?: string;
  children?: ReactNode;
}

// ─── Persisted layout state ────────────────────────────────────────────────────

export interface PersistedZoneState {
  /** Sort position among visible zones, lowest first. */
  order: number;
  /** Desktop column span override (grid units, 1-12). Absent = use the zone's default colSpan. */
  cols?: number;
}

export interface PersistedLayout {
  /** Bump this when a shipped layout's default structure changes, to invalidate stale saves. */
  version: number;
  zones: Record<string, PersistedZoneState>;
}

// ─── Persistence ────────────────────────────────────────────────────────────────

export interface PersistenceAdapter {
  load(layoutId: string): PersistedLayout | null | Promise<PersistedLayout | null>;
  save(layoutId: string, layout: PersistedLayout): void | Promise<void>;
  clear(layoutId: string): void | Promise<void>;
}

// ─── Templates ──────────────────────────────────────────────────────────────────

export interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  /** Whether this template ships with the app (true) or was saved by a user (false). */
  builtIn?: boolean;
  layout: PersistedLayout;
}
