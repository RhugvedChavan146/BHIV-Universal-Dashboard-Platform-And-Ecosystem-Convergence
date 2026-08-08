import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useDeliveryIntelligence } from "@/hooks/useQueries";
import { useNiyantranAims, useNiyantranEnhancedAims } from "@/hooks/useNiyantranQueries";
import { formatTime } from "@/utils/format";
import { CheckCircle2, Clock, CalendarDays, Activity, Gauge, GitBranch } from "lucide-react";

export default memo(function DeliveryIntelligenceLayout() {
  const cpDelivery = useDeliveryIntelligence();
  const niyantranAims = useNiyantranAims();
  const niyantranEnhancedAims = useNiyantranEnhancedAims();

  const data = useMemo(() => {
    if (cpDelivery.data) {
      return cpDelivery.data;
    }
    const aimsList = niyantranEnhancedAims.data || niyantranAims.data;
    if (aimsList && aimsList.length > 0) {
      const completed = aimsList.filter(a => a.status === "Completed" || (a.progressPercentage != null && a.progressPercentage >= 100)).length;
      const delayed = aimsList.filter(a => a.status === "Blocked" || a.status === "Delayed").length;
      const upcoming = aimsList.filter(a => a.status === "Pending" || a.status === "In Progress").length;
      const avgProgress = Math.round(aimsList.reduce((acc, a) => acc + (a.progressPercentage || 50), 0) / aimsList.length);
 
      return {
        timestamp: new Date().toISOString(),
        completed_tasks: completed,
        delayed_tasks: delayed,
        upcoming_deliveries: upcoming,
        sprint_health: `${avgProgress}%`,
        execution_velocity: avgProgress > 80 ? "Optimal" : "Standard",
        repository_activity: "AIMS Sprint Active",
        deliveries: aimsList.map((a) => ({
          id: a._id,
          title: a.aims,
          owner: typeof a.user === "object" ? a.user?.name : "System",
          target_date: a.date,
          status: (a.status || "In Progress") as any,
          progress_pct: a.progressPercentage || 50,
        })),
      };
    }
    return undefined;
  }, [cpDelivery.data, niyantranAims.data, niyantranEnhancedAims.data]);

  const isLoading = cpDelivery.isLoading && niyantranAims.isLoading && niyantranEnhancedAims.isLoading;
  const isError = !isLoading && cpDelivery.isError && niyantranAims.isError && niyantranEnhancedAims.isError;
  const timestamp = data?.timestamp || (niyantranAims.data ? new Date().toISOString() : undefined);
  const isFetching = cpDelivery.isFetching || niyantranAims.isFetching || niyantranEnhancedAims.isFetching;
  const isStale = cpDelivery.isStale || niyantranAims.isStale || niyantranEnhancedAims.isStale;
  const dataSource = cpDelivery.data ? "Control Plane" : "NIYANTRAN";


  return (
    <DashboardCard
      title="Delivery Intelligence"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => { cpDelivery.refetch(); niyantranAims.refetch(); niyantranEnhancedAims.refetch(); }}
      errorMessage="Failed to load Delivery Intelligence"
      skeletonCount={6}
      skeletonHeight="h-10"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      dataSource={dataSource}
    >
      <div className="flex flex-col h-full min-h-0 justify-between gap-3">
        {!data ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Gauge className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No Runtime Data Available</p>
            <span className="text-[10px] text-slate-600 mt-1">Delivery Intelligence API endpoint has no active sprint telemetry</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto">
            {/* Completed Tasks */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <CheckCircle2 size={12} className="text-emerald-400" /> Completed Tasks
              </div>
              <span className="text-lg font-bold font-mono text-emerald-400">{data.completed_tasks ?? 0}</span>
            </div>

            {/* Delayed Tasks */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <Clock size={12} className="text-amber-400" /> Delayed Tasks
              </div>
              <span className="text-lg font-bold font-mono text-amber-400">{data.delayed_tasks ?? 0}</span>
            </div>

            {/* Upcoming Deliveries */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <CalendarDays size={12} className="text-blue-400" /> Upcoming Deliveries
              </div>
              <span className="text-lg font-bold font-mono text-blue-400">{data.upcoming_deliveries ?? 0}</span>
            </div>

            {/* Sprint Health */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <Activity size={12} className="text-cyan-400" /> Sprint Health
              </div>
              <span className="text-sm font-bold font-mono text-cyan-400 capitalize">{data.sprint_health ?? "—"}</span>
            </div>

            {/* Execution Velocity */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <Gauge size={12} className="text-purple-400" /> Execution Velocity
              </div>
              <span className="text-sm font-bold font-mono text-purple-400">{data.execution_velocity ?? "—"}</span>
            </div>

            {/* Repository Activity */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <GitBranch size={12} className="text-indigo-400" /> Repository Activity
              </div>
              <span className="text-sm font-bold font-mono text-indigo-400">{data.repository_activity ?? "—"}</span>
            </div>
          </div>
        )}

        {data && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 shrink-0 pt-1.5 border-t border-slate-800">
            <span>BHEX Delivery Telemetry</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
