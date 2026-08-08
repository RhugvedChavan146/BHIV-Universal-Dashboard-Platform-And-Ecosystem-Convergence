// ─── SHAKTI Dashboard Configuration Contract ──────────────────────────────────
// This type is the single source of truth for making the SHAKTI dashboard
// reusable across government systems. The reusable Branding/Features/Provider
// contract lives in @bhiv/dashboard-sdk; this file only defines SHAKTI's
// concrete zone map, which is business-specific and stays in the app.

import type { DashboardBranding, DashboardConfig as PlatformDashboardConfig, DashboardConfigOverride as PlatformDashboardConfigOverride, DashboardFeatures, DashboardZoneConfig, DashboardThemeConfig, DashboardNavigationConfig, DashboardNavItem } from "@bhiv/dashboard-sdk";

export type { DashboardBranding, DashboardFeatures, DashboardZoneConfig, DashboardThemeConfig, DashboardNavigationConfig, DashboardNavItem };

// ─── Zone Configuration (SHAKTI-specific) ─────────────────────────────────────

export interface DashboardZones {
  executiveSummary: DashboardZoneConfig;
  operationsGrid: DashboardZoneConfig;
  liveAlerts: DashboardZoneConfig;
  riskHeatmap: DashboardZoneConfig;
  telemetry: DashboardZoneConfig;
  incidentQueue: DashboardZoneConfig;
  operationalTimeline: DashboardZoneConfig;
  systemHealth: DashboardZoneConfig;
  runtimeSessions: DashboardZoneConfig;
  evidencePanel: DashboardZoneConfig;
  repositoryRegistry?: DashboardZoneConfig;
  buildRegistry?: DashboardZoneConfig;
  migrationQueue?: DashboardZoneConfig;
  reviewQueue?: DashboardZoneConfig;
  capabilityRegistry?: DashboardZoneConfig;
  employeeExecution?: DashboardZoneConfig;
  engineeringCapacity?: DashboardZoneConfig;
  deliveryIntelligence?: DashboardZoneConfig;
  capabilityDependencyGraph?: DashboardZoneConfig;
}

// ─── Top-Level Config ─────────────────────────────────────────────────────────

export type DashboardConfig = PlatformDashboardConfig<DashboardZones>;

// ─── Partial config for consumer overrides ────────────────────────────────────

export type DashboardConfigOverride = PlatformDashboardConfigOverride<DashboardZones>;
