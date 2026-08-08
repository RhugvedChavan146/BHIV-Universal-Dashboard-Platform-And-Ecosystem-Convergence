import type { ReactNode } from "react";
import type { DashboardConfig, DashboardConfigOverride, DashboardZoneMap } from "./config/types";
import { DashboardConfigProvider } from "./config/DashboardConfigProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
import type { ThemeMode } from "./theme/types";
import { FilterProvider } from "./filters/FilterProvider";
import type { FilterState } from "./filters/types";
import { SDKProvider } from "./sdk/SDKProvider";
import { DashboardSDK, globalDashboardSDK } from "./sdk/DashboardSDK";

export interface DashboardProviderProps<TZones = DashboardZoneMap> {
  /** Base configuration for this system, e.g. SHAKTI's `defaultDashboardConfig` */
  defaultConfig: DashboardConfig<TZones>;
  /** Partial overrides — deep-merged with `defaultConfig` */
  overrides?: DashboardConfigOverride<TZones>;
  /** Initial theme mode. Defaults to `overrides.theme.mode`, then `defaultConfig.theme.mode`, then `"dark"`. */
  themeMode?: ThemeMode;
  /** Custom SDK instance. Defaults to the shared `globalDashboardSDK` singleton. */
  sdk?: DashboardSDK;
  /** Initial filter state, forwarded to the underlying `FilterProvider`. */
  initialFilterState?: Partial<FilterState>;
  children: ReactNode;
}

/**
 * `DashboardProvider` is the single entry point for consuming apps: it wires
 * together configuration, theming, filtering and the SDK event bus so a
 * consuming app only needs to mount one provider at the root of its
 * dashboard tree.
 *
 * Each concern remains independently usable — `DashboardConfigProvider`,
 * `ThemeProvider`, `FilterProvider` and `SDKProvider` can still be mounted
 * standalone (see `config`, `theme`, `filters`, `sdk`) for apps that only
 * need part of the platform.
 */
export function DashboardProvider<TZones = DashboardZoneMap>({
  defaultConfig,
  overrides,
  themeMode = (overrides as { theme?: { mode?: ThemeMode } } | undefined)?.theme?.mode ?? defaultConfig.theme?.mode ?? "dark",
  sdk = globalDashboardSDK,
  initialFilterState,
  children,
}: DashboardProviderProps<TZones>) {
  return (
    <SDKProvider sdk={sdk}>
      <ThemeProvider defaultMode={themeMode}>
        <FilterProvider initialState={initialFilterState}>
          <DashboardConfigProvider defaultConfig={defaultConfig} overrides={overrides}>
            {children}
          </DashboardConfigProvider>
        </FilterProvider>
      </ThemeProvider>
    </SDKProvider>
  );
}
