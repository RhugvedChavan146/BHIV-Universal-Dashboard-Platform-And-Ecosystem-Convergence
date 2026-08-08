// ─── Dashboard Configuration Contract ─────────────────────────────────────────
// Generic, system-agnostic configuration shape for the dashboard platform.
// Every consuming app (e.g. SHAKTI) supplies its own concrete zone map and
// default values — this module only defines the reusable contract and the
// runtime (Context/Provider/hook) that resolves it.

import type { ComponentType } from "react";

// ─── Branding ─────────────────────────────────────────────────────────────────

export interface DashboardBranding {
  /** Primary system name displayed in the header (e.g., "SHAKTI") */
  systemName: string;
  /** Subtitle shown beside the system name (e.g., "Operational Command Center") */
  subtitle: string;
  /** Icon component for the logo area */
  logoIcon?: ComponentType<{ size?: number | string; className?: string }>;
  /** Operator display name shown in the user badge */
  operatorLabel: string;
  /** Role label shown below operator name */
  roleLabel: string;
  /** Initials for the avatar badge (e.g., "OP") */
  operatorInitials: string;
}

// ─── Zone Configuration ───────────────────────────────────────────────────────
// Named `DashboardZoneConfig` (rather than `ZoneConfig`) to avoid colliding
// with the unrelated `ZoneConfig` exported by ../layout.

export interface DashboardZoneConfig {
  /** Whether this zone is visible on the dashboard */
  visible: boolean;
  /** Display label (used in section aria-label and headings) */
  label: string;
  /** Tailwind col-span classes — mobile, tablet, desktop */
  colSpan?: string;
}

/** Consuming apps define their own concrete zone map, e.g. `Record<"executiveSummary" | ..., DashboardZoneConfig>` */
export type DashboardZoneMap = Record<string, DashboardZoneConfig>;

// ─── Feature Flags ────────────────────────────────────────────────────────────

export interface DashboardFeatures {
  /** Show the notification bell icon in the header */
  notifications: boolean;
  /** Show the LIVE indicator badge */
  liveBadge: boolean;
  /** Show the user/operator menu in the header */
  userMenu: boolean;
  /** Show the clock/date in the header */
  clock: boolean;
}

// ─── Theme ─────────────────────────────────────────────────────────────────────
// Config-driven entry point into `@bhiv/dashboard-sdk`'s ThemeEngine — a
// product selects a mode (and, later, token overrides) here instead of any
// component hardcoding colors.

export interface DashboardThemeConfig {
  /** "dark" | "light" — resolved by `ThemeProvider`/`ThemeEngine`. */
  mode: "dark" | "light";
}

// ─── Navigation ────────────────────────────────────────────────────────────────
// Config-driven entry point into `@bhiv/dashboard-sdk`'s NavigationEngine.
// Each item's `path` matches a zone id (`zone-<id>`, see `LayoutZone`) so
// navigating scrolls to that section — no per-product nav component needed.

export interface DashboardNavItem {
  id: string;
  label: string;
  /** Zone id to scroll to, e.g. "operationsGrid" (rendered as `#zone-operationsGrid`). */
  path: string;
  icon?: string;
}

export interface DashboardNavigationConfig {
  items: DashboardNavItem[];
}

// ─── Top-Level Config ─────────────────────────────────────────────────────────

export interface DashboardConfig<TZones = DashboardZoneMap> {
  /** Branding and identity */
  branding: DashboardBranding;
  /** Zone visibility and labels */
  zones: TZones;
  /** Feature flags */
  features: DashboardFeatures;
  /** Theme mode, resolved through the shared ThemeEngine */
  theme: DashboardThemeConfig;
  /** In-page section navigation, resolved through the shared NavigationEngine */
  navigation: DashboardNavigationConfig;
}

// ─── Partial config for consumer overrides ────────────────────────────────────
// Consumers only need to specify the fields they want to change.

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DashboardConfigOverride<TZones = DashboardZoneMap> = DeepPartial<DashboardConfig<TZones>>;
