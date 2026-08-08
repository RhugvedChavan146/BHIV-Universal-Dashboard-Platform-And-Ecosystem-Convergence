// ─── SHAKTI Dashboard Registry Wiring ─────────────────────────────────────────
// Registers every SHAKTI zone as a widget (with a dynamic `loader` for
// code-splitting) plus the "command-center" product layout that arranges
// them. This is the single place that maps a widget id to its component —
// `pages/Dashboard.tsx` no longer hardcodes a `lazy()`/zone-key list; it
// discovers everything from `globalDashboardRegistry` instead.
//
// Visual placement (colSpan/label/visible) stays driven by
// `config/dashboard.config.ts` and `DashboardProvider` overrides, exactly as
// before — this file only owns widget *identity* and *structure*
// (component, category, capability, permission, skeleton/fallback).

import type { ProductLayout, WidgetDefinition } from "@bhiv/dashboard-sdk";
import { globalCapabilityRuntime, globalDashboardRegistry } from "@bhiv/dashboard-sdk";

export const SHAKTI_PRODUCT = "shakti";
export const SHAKTI_LAYOUT_ID = "command-center";

interface ShaktiWidgetSeed {
  id: string;
  name: string;
  category: string;
  capability: string;
  skeletonHeight: string;
  loader: WidgetDefinition["loader"];
}

// Same 19 zones the dashboard has always shipped, in their shipped order.
// `id` is the zone key used throughout `dashboard.config.ts` / `dashboard.types.ts`.
const SHAKTI_WIDGET_SEEDS: ShaktiWidgetSeed[] = [
  {
    id: "executiveSummary",
    name: "Executive Summary",
    category: "executive",
    capability: "executive-overview",
    skeletonHeight: "h-32",
    loader: () => import("@/components/dashboard/layouts/ExecutiveLayout"),
  },
  {
    id: "operationsGrid",
    name: "Operations Grid",
    category: "operations",
    capability: "operations",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/OperationsLayout"),
  },
  {
    id: "liveAlerts",
    name: "Integrations",
    category: "integration",
    capability: "integrations",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/IntegrationLayout"),
  },
  {
    id: "riskHeatmap",
    name: "Decision Intelligence",
    category: "intelligence",
    capability: "decision-intelligence",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/DecisionIntelligenceLayout"),
  },
  {
    id: "telemetry",
    name: "Observability",
    category: "observability",
    capability: "observability",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/ObservabilityLayout"),
  },
  {
    id: "incidentQueue",
    name: "Workflows",
    category: "workflow",
    capability: "workflow",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/WorkflowLayout"),
  },
  {
    id: "operationalTimeline",
    name: "Operator Console",
    category: "operator-console",
    capability: "operator-console",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/OperatorConsoleLayout"),
  },
  {
    id: "systemHealth",
    name: "Runtime Health",
    category: "runtime-health",
    capability: "runtime-health",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/RuntimeHealthLayout"),
  },
  {
    id: "runtimeSessions",
    name: "Replay",
    category: "replay",
    capability: "replay",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/ReplayLayout"),
  },
  {
    id: "evidencePanel",
    name: "Evidence",
    category: "evidence",
    capability: "evidence",
    skeletonHeight: "h-48",
    loader: () => import("@/components/dashboard/layouts/EvidenceLayout"),
  },
  {
    id: "repositoryRegistry",
    name: "Repository Registry",
    category: "registry",
    capability: "repository-registry",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/RepositoryRegistryLayout"),
  },
  {
    id: "buildRegistry",
    name: "Build Registry",
    category: "registry",
    capability: "build-registry",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/BuildRegistryLayout"),
  },
  {
    id: "migrationQueue",
    name: "Migration Queue",
    category: "registry",
    capability: "migration-queue",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/MigrationQueueLayout"),
  },
  {
    id: "reviewQueue",
    name: "Review Queue",
    category: "registry",
    capability: "review-queue",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/ReviewQueueLayout"),
  },
  {
    id: "capabilityRegistry",
    name: "Capability Registry",
    category: "registry",
    capability: "capability-registry",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/CapabilityRegistryLayout"),
  },
  {
    id: "employeeExecution",
    name: "Employee Execution",
    category: "execution",
    capability: "employee-execution",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/EmployeeExecutionLayout"),
  },
  {
    id: "engineeringCapacity",
    name: "Engineering Capacity",
    category: "execution",
    capability: "engineering-capacity",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/EngineeringCapacityLayout"),
  },
  {
    id: "deliveryIntelligence",
    name: "Delivery Intelligence",
    category: "intelligence",
    capability: "delivery-intelligence",
    skeletonHeight: "h-64",
    loader: () => import("@/components/dashboard/layouts/DeliveryIntelligenceLayout"),
  },
  {
    id: "capabilityDependencyGraph",
    name: "Capability Dependency Graph",
    category: "registry",
    capability: "capability-dependency-graph",
    skeletonHeight: "h-96",
    loader: () => import("@/components/dashboard/layouts/CapabilityDependencyGraphLayout"),
  },
];

function toWidgetDefinition(seed: ShaktiWidgetSeed): WidgetDefinition {
  return {
    id: seed.id,
    name: seed.name,
    version: "1.0.0",
    category: seed.category,
    capabilities: [seed.capability],
    products: [SHAKTI_PRODUCT],
    defaultVisible: true,
    defaultSkeletonHeight: seed.skeletonHeight,
    fallbackTitle: `${seed.name} Crashed`,
    loader: seed.loader,
  };
}

/**
 * Registers every SHAKTI widget + the "command-center" product layout with
 * the shared `globalDashboardRegistry`, and activates each widget's runtime
 * capability so the dashboard renders unchanged out of the box.
 *
 * TODO(BHIV/TANTRA): once a live capability feed exists, drive
 * `globalCapabilityRuntime.setActiveCapabilities(...)` from it (the same way
 * `useAuth`/`useAuthorization` are documented as mocks to swap for a real
 * provider) instead of activating every SHAKTI capability unconditionally.
 *
 * Idempotent — safe to call more than once (e.g. under Vite HMR), since the
 * underlying registries are module-level singletons that outlive this file's
 * hot-reloads.
 */
export function registerShaktiDashboard(): void {
  const zoneOrder = SHAKTI_WIDGET_SEEDS.map((seed) => seed.id);

  for (const seed of SHAKTI_WIDGET_SEEDS) {
    if (globalDashboardRegistry.widgets.has(seed.id)) continue;
    globalDashboardRegistry.registerWidget(toWidgetDefinition(seed));
  }

  globalCapabilityRuntime.setActiveCapabilities(SHAKTI_WIDGET_SEEDS.map((seed) => seed.capability));

  if (!globalDashboardRegistry.layouts.get(SHAKTI_PRODUCT, SHAKTI_LAYOUT_ID)) {
    const layout: ProductLayout = {
      id: SHAKTI_LAYOUT_ID,
      product: SHAKTI_PRODUCT,
      name: "SHAKTI Command Center",
      version: 1,
      zones: zoneOrder.map((widgetId, order) => ({ widgetId, order })),
    };
    globalDashboardRegistry.registerLayout(layout);
  }
}
