import { useState, useEffect } from "react";
import { Bell, Activity } from "lucide-react";
import { useDashboard } from "@bhiv/dashboard-sdk";
import { Button, StatusBadge } from "@bhiv/ui";
import type { DashboardZones } from "@/types/dashboard.types";
import { useServiceObservabilityPublisher } from "@/hooks/useServiceObservabilityPublisher";

export default function Header() {
  const {
    config: { branding, features },
  } = useDashboard<DashboardZones>();
  const [time, setTime] = useState(new Date());

  // Publishes each real service's health into the shared cross-service
  // observability context, rendered below via `ServiceObservabilityStrip`.
  useServiceObservabilityPublisher();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const LogoIcon = branding.logoIcon ?? Activity;

  return (
    <header className="bg-slate-900 border-b border-slate-700/60 px-4 py-2.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <LogoIcon size={18} className="text-amber-400" />
          <span className="text-[21px] font-bold text-slate-100 tracking-tight">{branding.systemName}</span>
        </div>
        <span className="text-slate-600 text-sm hidden sm:block">|</span>
        <span className="text-[13px] text-slate-400 hidden sm:block">{branding.subtitle}</span>
      </div>

      <div className="flex items-center gap-4">
        {features.liveBadge && (
          <StatusBadge tone="success" showDot pulse>
            LIVE
          </StatusBadge>
        )}

        {features.clock && (
          <div className="text-right hidden md:block">
            <p className="text-xs font-mono text-slate-300">{time.toLocaleTimeString("en-IN")}</p>
            <p className="text-xs text-slate-600">{time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        )}

        {features.notifications && (
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        )}

        {features.userMenu && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{branding.operatorInitials}</span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-300">{branding.operatorLabel}</p>
              <p className="text-xs text-slate-600">{branding.roleLabel}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
