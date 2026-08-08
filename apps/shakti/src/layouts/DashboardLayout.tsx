import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import { useNetworkState } from "@/hooks/useNetworkState";
import { WifiOff } from "lucide-react";
import { DashboardProvider, ServiceObservabilityProvider } from "@bhiv/dashboard-sdk";
import type { DashboardConfigOverride, DashboardZones } from "@/types/dashboard.types";
import { defaultDashboardConfig } from "@/config/dashboard.config";

interface DashboardLayoutProps {
  children: ReactNode;
  /** Partial config overrides — deep-merged with SHAKTI defaults */
  config?: DashboardConfigOverride;
}

function AppShell({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkState();

  return (
    <ServiceObservabilityProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
        {!isOnline && (
          <div className="bg-red-500/20 text-red-100 text-xs py-1.5 px-4 flex items-center justify-center gap-2 border-b border-red-500/30 font-medium">
            <WifiOff size={14} className="animate-pulse" />
            System Offline — Dashboard is running on cached data. Reconnecting...
          </div>
        )}
        <Header />
        <main className="flex-1 overflow-auto p-3">{children}</main>
      </div>
    </ServiceObservabilityProvider>
  );
}

export default function DashboardLayout({ children, config }: DashboardLayoutProps) {
  return (
    // `DashboardProvider`'s theme mode now resolves from `config.theme.mode`
    // (see @bhiv/dashboard-sdk `DashboardProvider`) — no separate ThemeProvider needed here.
    <DashboardProvider<DashboardZones> defaultConfig={defaultDashboardConfig} overrides={config}>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  );
}
