import { memo, useState, useMemo } from "react";
import { Play, CheckCircle, AlertOctagon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ReplayCard } from "@/components/dashboard/primitives/ReplayCard";
import { useReplayRegistry } from "@/hooks/useQueries";

import { formatRelativeTime } from "@/utils/format";

type ReplayStatus = "running" | "completed" | "failed" | "idle";

const STATE_CONFIG: Record<ReplayStatus, { icon: React.ElementType; color: string; bar: string }> = {
  running: { icon: Play, color: "text-blue-400 animate-pulse", bar: "bg-blue-500" },
  completed: { icon: CheckCircle, color: "text-emerald-400", bar: "bg-emerald-500" },
  failed: { icon: AlertOctagon, color: "text-red-400 animate-bounce", bar: "bg-red-500" },
  idle: { icon: Play, color: "text-slate-500", bar: "bg-slate-700" },
};

function toReplayState(status: string): ReplayStatus {
  if (status === "active" || status === "running") return "running";
  if (status === "completed" || status === "success") return "completed";
  if (status === "failed" || status === "error") return "failed";
  return "idle";
}

export default memo(function ReplayLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useReplayRegistry();
  const [selectedReplayId, setSelectedReplayId] = useState<string | null>(null);

  const allReplays = data?.replays ?? [];

  const activeReplay = useMemo(() => {
    if (selectedReplayId) {
      return allReplays.find(r => r.replay_id === selectedReplayId);
    }
    return allReplays[0] || null;
  }, [allReplays, selectedReplayId]);

  return (
    <DashboardCard
      title="Simulation & Replay"
      ariaLabel="Replay Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={refetch}
      errorMessage="Failed to load replay sessions"
      skeletonCount={2}
      skeletonHeight="h-10"
      isEmpty={data !== undefined && allReplays.length === 0}
      emptyMessage="No Replay Data Available"
      timestamp={data?.timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={(data as any)?.trace_id}
      dataSource="Replay Registry"
      headerRight={data ? <span className="text-xs text-slate-500">{(data.active_replays ?? 0)} active</span> : undefined}
    >
      {data && allReplays.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0 flex-1">
          {/* Column 1: Replay Sessions List */}
          <div className="lg:col-span-7 flex flex-col min-h-0 border-r border-slate-700/30 pr-2">
            <div className="overflow-y-auto flex-1 min-h-0 max-h-[250px] pr-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-800 z-10">
                  <tr className="border-b border-slate-700/60 text-[12px] font-semibold text-slate-400">
                    <th className="py-1 pb-1.5">Replay</th>
                    <th className="py-1 pb-1.5">Operation</th>
                    <th className="py-1 pb-1.5">Progress</th>
                    <th className="py-1 pb-1.5 text-right">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {allReplays.map((r) => {
                    const state = toReplayState(r.status);
                    const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.idle;
                    const Icon = cfg.icon;
                    const clampedProgress = Math.min(100, Math.max(0, r.progress ?? 0));
                    const isSelected = activeReplay?.replay_id === r.replay_id;

                    return (
                      <tr
                        key={r.replay_id}
                        onClick={() => setSelectedReplayId(r.replay_id)}
                        className={`cursor-pointer border-b border-slate-800/30 last:border-0 text-[13px] text-slate-200 transition-colors ${isSelected ? 'bg-slate-700/30' : 'hover:bg-slate-800/20'}`}
                      >
                        <td className="py-1 font-mono text-[11px] text-slate-355">
                          <div className="flex items-center gap-1">
                            <Icon size={10} className={`${cfg.color} shrink-0`} />
                            <span title={r.replay_id}>{r.replay_id.slice(0, 6)}</span>
                          </div>
                        </td>
                        <td className="py-1 font-semibold text-slate-250 truncate max-w-[100px]" title={r.current_operation ?? "Simulation Sequence"}>
                          {r.current_operation ?? "Simulation Sequence"}
                        </td>
                        <td className="py-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">{clampedProgress}%</span>
                          </div>
                        </td>
                        <td className="py-1 text-right text-slate-500 text-[11px]">
                          {r.started_at ? formatRelativeTime(r.started_at) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 2: Replay Explorer Detailed Panel */}
          <div className="lg:col-span-5 flex flex-col min-h-0">
            {activeReplay ? (
              <div className="flex flex-col h-full gap-3 justify-start">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-1">Replay Explorer</h3>
                  <ReplayCard
                    title={activeReplay.current_operation || "Simulation Sequence"}
                    state={toReplayState(activeReplay.status)}
                    progress={activeReplay.progress ?? 0}
                    metricText={`${(activeReplay.events_processed ?? 0).toLocaleString()} events processed`}
                    sessionId={activeReplay.replay_id}
                    timeSubtext={activeReplay.started_at ? formatRelativeTime(activeReplay.started_at) : undefined}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No replay selected</p>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
