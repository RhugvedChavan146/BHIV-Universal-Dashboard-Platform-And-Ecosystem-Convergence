import { useMemo } from "react";
import type { ReactNode } from "react";
import type { DashboardConfig, DashboardConfigOverride, DashboardZoneMap } from "./types";
import { deepMerge } from "./deepMerge";
import { DashboardConfigContext } from "./DashboardConfigContext";

export interface DashboardConfigProviderProps<TZones = DashboardZoneMap> {
  /** Base configuration for this system, e.g. SHAKTI's `defaultDashboardConfig` */
  defaultConfig: DashboardConfig<TZones>;
  /** Partial overrides — deep-merged with `defaultConfig` */
  overrides?: DashboardConfigOverride<TZones>;
  children: ReactNode;
}

export function DashboardConfigProvider<TZones = DashboardZoneMap>({
  defaultConfig,
  overrides,
  children,
}: DashboardConfigProviderProps<TZones>) {
  const mergedConfig = useMemo<DashboardConfig<TZones>>(() => {
    if (!overrides) return defaultConfig;
    return deepMerge(
      defaultConfig as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as DashboardConfig<TZones>;
  }, [defaultConfig, overrides]);

  return (
    <DashboardConfigContext.Provider value={mergedConfig as DashboardConfig<unknown>}>
      {children}
    </DashboardConfigContext.Provider>
  );
}
