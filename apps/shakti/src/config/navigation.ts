import { NavigationEngine } from "@bhiv/dashboard-sdk";
import { defaultDashboardConfig } from "@/config/dashboard.config";

// A dedicated engine instance, seeded from SHAKTI's own `dashboard.config.ts`
// — deliberately not `globalNavigationEngine`, whose built-in defaults
// (`/operations`, `/telemetry`, ...) don't match this product's real zones.
export const shaktiNavigationEngine = new NavigationEngine(
  defaultDashboardConfig.navigation.items,
  defaultDashboardConfig.navigation.items[0]?.path ?? ""
);
