import { useContext } from "react";
import { SDKContext, type SDKContextValue } from "./SDKContext";

export function useDashboardSDK(): SDKContextValue {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error("useDashboardSDK must be used within an SDKProvider");
  }
  return context;
}
