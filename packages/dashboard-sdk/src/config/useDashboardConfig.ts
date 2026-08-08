import { useContext } from "react";
import type { DashboardConfig, DashboardZoneMap } from "./types";
import { DashboardConfigContext } from "./DashboardConfigContext";

export function useDashboardConfig<TZones = DashboardZoneMap>(): DashboardConfig<TZones> {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error("useDashboardConfig must be used within a DashboardProvider");
  }
  return context as DashboardConfig<TZones>;
}
