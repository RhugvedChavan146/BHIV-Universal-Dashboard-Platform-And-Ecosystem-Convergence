// ─── SHAKTI Default Configuration ─────────────────────────────────────────────
// This config reproduces the exact current SHAKTI dashboard UI.
// It serves as the reference implementation for all future system integrations.
//
// To create a new system config, copy this file and change only the fields
// that differ. The DashboardProvider deep-merges your overrides with these defaults.

import { Zap } from "lucide-react";
import type { DashboardConfig } from "@/types/dashboard.types";

export const defaultDashboardConfig: DashboardConfig = {
  branding: {
    systemName: "SHAKTI",
    subtitle: "Operational Command Center",
    logoIcon: Zap,
    operatorLabel: "Operator",
    roleLabel: "Grid Control",
    operatorInitials: "OP",
  },

  zones: {
    executiveSummary: {
      visible: true,
      label: "Executive Layout",
      colSpan: "col-span-12",
    },
    operationsGrid: {
      visible: true,
      label: "Operations Layout",
      colSpan: "col-span-12 lg:col-span-7",
    },
    liveAlerts: {
      visible: true,
      label: "Integration Layout",
      colSpan: "col-span-12 lg:col-span-5",
    },
    riskHeatmap: {
      visible: true,
      label: "Decision Intelligence Layout",
      colSpan: "col-span-12 md:col-span-6 lg:col-span-4",
    },
    telemetry: {
      visible: true,
      label: "Observability Layout",
      colSpan: "col-span-12 md:col-span-6 lg:col-span-8",
    },
    incidentQueue: {
      visible: true,
      label: "Workflow Layout",
      colSpan: "col-span-12 lg:col-span-7",
    },
    operationalTimeline: {
      visible: true,
      label: "Operator Console Layout",
      colSpan: "col-span-12 lg:col-span-5",
    },
    systemHealth: {
      visible: true,
      label: "Runtime Health Layout",
      colSpan: "col-span-12 md:col-span-7",
    },
    runtimeSessions: {
      visible: true,
      label: "Replay Layout",
      colSpan: "col-span-12 md:col-span-5",
    },
    evidencePanel: {
      visible: true,
      label: "Evidence Layout",
      colSpan: "col-span-12",
    },
    repositoryRegistry: {
      visible: true,
      label: "Repository Registry Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    buildRegistry: {
      visible: true,
      label: "Build Registry Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    migrationQueue: {
      visible: true,
      label: "Migration Queue Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    reviewQueue: {
      visible: true,
      label: "Review Queue Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    capabilityRegistry: {
      visible: true,
      label: "Capability Registry Layout",
      colSpan: "col-span-12",
    },
    employeeExecution: {
      visible: true,
      label: "Employee Execution Layout",
      colSpan: "col-span-12",
    },
    engineeringCapacity: {
      visible: true,
      label: "Engineering Capacity Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    deliveryIntelligence: {
      visible: true,
      label: "Delivery Intelligence Layout",
      colSpan: "col-span-12 lg:col-span-6",
    },
    capabilityDependencyGraph: {
      visible: true,
      label: "Capability Dependency Graph Layout",
      colSpan: "col-span-12",
    },
  },

  features: {
    notifications: true,
    liveBadge: true,
    userMenu: true,
    clock: true,
  },

  theme: {
    mode: "dark",
  },

  // Each `path` matches a zone id above (rendered as `#zone-<id>` by
  // `LayoutZone`), so navigating scrolls to that section — adding a new zone
  // just means adding one more item here, no new nav component required.
  navigation: {
    items: [
      { id: "executive", label: "Executive", path: "executiveSummary" },
      { id: "operations", label: "Operations", path: "operationsGrid" },
      { id: "alerts", label: "Alerts", path: "liveAlerts" },
      { id: "telemetry", label: "Telemetry", path: "telemetry" },
      { id: "workflows", label: "Workflows", path: "incidentQueue" },
      { id: "runtime-health", label: "Runtime Health", path: "systemHealth" },
      { id: "replay", label: "Replay", path: "runtimeSessions" },
      { id: "evidence", label: "Evidence", path: "evidencePanel" },
      { id: "capabilities", label: "Capabilities", path: "capabilityRegistry" },
    ],
  },
};
