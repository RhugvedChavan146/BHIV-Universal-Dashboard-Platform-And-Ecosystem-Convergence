import { useDashboardConfig } from "../config/useDashboardConfig";
import type { DashboardConfig, DashboardZoneMap } from "../config/types";
import { useTheme } from "../theme/useTheme";
import type { ThemeContextValue } from "../theme/ThemeContext";
import { useDashboardSDK } from "../sdk/useDashboardSDK";
import type { DashboardSDK } from "../sdk/DashboardSDK";
import type { SDKDashboardConfig } from "../sdk/types";

export interface UseDashboardResult<TZones = DashboardZoneMap> {
  /** Resolved, merged dashboard configuration (branding, zones, feature flags) */
  config: DashboardConfig<TZones>;
  /** Current theme mode, design tokens, and the setter to change them */
  theme: ThemeContextValue;
  /** SDK instance — event bus + widget registry, for advanced/extension use */
  sdk: DashboardSDK;
  /** SDK-level runtime config (app title, version, environment, refresh interval) */
  sdkConfig: SDKDashboardConfig;
}

/**
 * `useDashboard` is the primary hook for reading everything about the
 * current dashboard in one call: configuration, theme, and the SDK
 * instance. Must be used within a `DashboardProvider`.
 */
export function useDashboard<TZones = DashboardZoneMap>(): UseDashboardResult<TZones> {
  const config = useDashboardConfig<TZones>();
  const theme = useTheme();
  const { sdk, config: sdkConfig } = useDashboardSDK();

  return { config, theme, sdk, sdkConfig };
}
