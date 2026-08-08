import { createContext } from "react";
import { DashboardSDK, globalDashboardSDK } from "./DashboardSDK";
import type { SDKDashboardConfig } from "./types";

export interface SDKContextValue {
  sdk: DashboardSDK;
  config: SDKDashboardConfig;
}

export const SDKContext = createContext<SDKContextValue>({
  sdk: globalDashboardSDK,
  config: globalDashboardSDK.getConfig(),
});
