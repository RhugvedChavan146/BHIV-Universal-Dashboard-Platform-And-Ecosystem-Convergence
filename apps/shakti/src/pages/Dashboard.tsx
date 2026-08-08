import { useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useDashboardConfig, useProductLayout } from "@bhiv/dashboard-sdk";
import { DashboardGrid, LayoutEditToolbar, useLayoutEngine } from "@bhiv/dashboard-layout";
import type { DashboardZones } from "@/types/dashboard.types";
import { useAuth } from "@/hooks/useAuth";
import { registerShaktiDashboard, SHAKTI_LAYOUT_ID, SHAKTI_PRODUCT } from "@/config/widgets.registry";

// Registers every SHAKTI widget + the "command-center" product layout with
// the shared dashboard registry. Runs once at module load, before the first
// render — see `config/widgets.registry.ts` for what's registered and why
// nothing here hardcodes a widget-to-component mapping anymore.
registerShaktiDashboard();

function DashboardGridContainer() {
  const { zones } = useDashboardConfig<DashboardZones>();
  const { user } = useAuth();

  // `dashboard.config.ts` (and any `DashboardProvider` overrides) remain the
  // single place a deployment customizes visibility/labels/spans — they're
  // applied as overrides on top of the registry's structural defaults.
  const { visibilityOverrides, labelOverrides, colSpanOverrides } = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    const labels: Record<string, string> = {};
    const colSpans: Record<string, string> = {};

    (Object.keys(zones) as (keyof DashboardZones)[]).forEach((key) => {
      const zoneConfig = zones[key];
      if (!zoneConfig) return;
      visibility[key] = Boolean(zoneConfig.visible);
      if (zoneConfig.label) labels[key] = zoneConfig.label;
      if (zoneConfig.colSpan) colSpans[key] = zoneConfig.colSpan;
    });

    return { visibilityOverrides: visibility, labelOverrides: labels, colSpanOverrides: colSpans };
  }, [zones]);

  // Discovers + dynamically loads every zone from the dashboard registry,
  // filtered by the current viewer's role/permissions and active runtime
  // capabilities. `zoneDefinitions` is structurally a `LayoutZoneDefinition[]`,
  // so it drops straight into `useLayoutEngine`/`DashboardGrid` below.
  const zoneDefinitions = useProductLayout(SHAKTI_PRODUCT, SHAKTI_LAYOUT_ID, {
    context: { role: user?.role, product: SHAKTI_PRODUCT },
    visibilityOverrides,
    labelOverrides,
    colSpanOverrides,
  });

  // `layoutId` scopes persistence/templates to this dashboard. Bump
  // `version` if SHAKTI's zone set ever changes shape in a way that should
  // invalidate previously-saved custom layouts.
  const engine = useLayoutEngine({ layoutId: "shakti-command-center", zones: zoneDefinitions, version: 1 });

  return (
    <>
      <LayoutEditToolbar engine={engine} className="mb-3" />
      <DashboardGrid
        engine={engine}
        renderZone={(zone) => {
          const Component = zone.component;
          return Component ? <Component /> : null;
        }}
      />
    </>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardGridContainer />
    </DashboardLayout>
  );
}
