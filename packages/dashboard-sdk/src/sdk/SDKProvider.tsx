import { useEffect, useState, useMemo, type ReactNode } from "react";
import { DashboardSDK, globalDashboardSDK } from "./DashboardSDK";
import type { SDKDashboardConfig } from "./types";
import { SDKContext } from "./SDKContext";

export function SDKProvider({
  children,
  sdk = globalDashboardSDK,
}: {
  children: ReactNode;
  sdk?: DashboardSDK;
}) {
  const [config, setConfig] = useState<SDKDashboardConfig>(sdk.getConfig());

  useEffect(() => {
    const unsubscribe = sdk.on("config:updated", (newConfig: SDKDashboardConfig) => {
      setConfig({ ...newConfig });
    });
    return unsubscribe;
  }, [sdk]);

  const value = useMemo(
    () => ({
      sdk,
      config,
    }),
    [sdk, config]
  );

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
}
