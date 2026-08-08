import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useEngineeringCapacity } from "@/hooks/useQueries";
import { useNiyantranLeaderboard } from "@/hooks/useNiyantranQueries";
import { formatTime } from "@/utils/format";
import { Users, UserCheck, ShieldAlert, FileSearch, TestTube2, Rocket } from "lucide-react";

export default memo(function EngineeringCapacityLayout() {
  const cpCapacity = useEngineeringCapacity();
  const niyantranLeaderboard = useNiyantranLeaderboard();

  const data = useMemo(() => {
    if (cpCapacity.data) {
      return cpCapacity.data;
    }
    const leaderboard = niyantranLeaderboard.data;
    if (leaderboard && leaderboard.length > 0) {
      const activeDevs = leaderboard.length;
      const availableDevs = leaderboard.filter(u => u.workload === 0).length;
      const blockedDevs = leaderboard.filter(u => u.completionRate < 30 && u.totalTasks > 0).length;
      const reviewPending = leaderboard.reduce((acc, u) => acc + Math.max(0, u.totalTasks - u.completedTasks), 0);
      const inQa = leaderboard.reduce((acc, u) => acc + u.totalDependencies, 0);

      return {
        timestamp: new Date().toISOString(),
        active_developers: activeDevs,
        available_developers: availableDevs,
        blocked_developers: blockedDevs,
        review_pending: reviewPending,
        testing_pending: inQa,
        deployment_pending: 0,
        engineers: leaderboard.map((u) => ({
          name: u.name,
          department: typeof u.department === "object" ? u.department?.name : "Engineering",
          allocated_capacity_pct: Math.min(100, (u.workload || 1) * 20),
          active_tasks_count: Math.max(0, (u.totalTasks || 0) - (u.completedTasks || 0)),
          velocity_rating: u.completionRate > 80 ? "High" : u.completionRate > 50 ? "Medium" : "Low",
          completion_rate_pct: Math.round(u.completionRate || 0),
        })),
      };
    }
    return undefined;
  }, [cpCapacity.data, niyantranLeaderboard.data]);

  const isLoading = cpCapacity.isLoading && niyantranLeaderboard.isLoading;
  const isError = !isLoading && cpCapacity.isError && niyantranLeaderboard.isError;
  const timestamp = data?.timestamp || (niyantranLeaderboard.data ? new Date().toISOString() : undefined);
  const isFetching = cpCapacity.isFetching || niyantranLeaderboard.isFetching;
  const isStale = cpCapacity.isStale || niyantranLeaderboard.isStale;
  const dataSource = cpCapacity.data ? "Control Plane" : "NIYANTRAN";


  return (
    <DashboardCard
      title="Engineering Capacity"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => { cpCapacity.refetch(); niyantranLeaderboard.refetch(); }}
      errorMessage="Failed to load Engineering Capacity"
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
            <Users className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No Runtime Data Available</p>
            <span className="text-[10px] text-slate-600 mt-1">Engineering Capacity API endpoint has no active capacity telemetry</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto">
            {/* Active Developers */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <Users size={12} className="text-cyan-400" /> Active Developers
              </div>
              <span className="text-lg font-bold font-mono text-slate-100">{data.active_developers != null ? data.active_developers : "—"}</span>
            </div>

            {/* Available Developers */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <UserCheck size={12} className="text-emerald-400" /> Available Developers
              </div>
              <span className="text-lg font-bold font-mono text-emerald-400">{data.available_developers != null ? data.available_developers : "—"}</span>
            </div>

            {/* Blocked Developers */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <ShieldAlert size={12} className="text-red-400" /> Blocked Developers
              </div>
              <span className="text-lg font-bold font-mono text-red-400">{data.blocked_developers != null ? data.blocked_developers : "—"}</span>
            </div>

            {/* Review Pending */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <FileSearch size={12} className="text-indigo-400" /> Review Pending
              </div>
              <span className="text-lg font-bold font-mono text-indigo-400">{data.review_pending != null ? data.review_pending : "—"}</span>
            </div>

            {/* Testing Pending */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <TestTube2 size={12} className="text-amber-400" /> Testing Pending
              </div>
              <span className="text-lg font-bold font-mono text-amber-400">{data.testing_pending != null ? data.testing_pending : "—"}</span>
            </div>

            {/* Deployment Pending */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                <Rocket size={12} className="text-purple-400" /> Deployment Pending
              </div>
              <span className="text-lg font-bold font-mono text-purple-400">{data.deployment_pending != null ? data.deployment_pending : "—"}</span>
            </div>
          </div>
        )}

        {data && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 shrink-0 pt-1.5 border-t border-slate-800">
            <span>BHEX Resource Allocation</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
