import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useMigrationQueue } from "@/hooks/useQueries";
import { formatTime } from "@/utils/format";
import { GitPullRequest, ShieldAlert } from "lucide-react";

export default memo(function MigrationQueueLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useMigrationQueue();

  const migrations = data?.migrations ?? [];
  const timestamp = data?.timestamp;

  return (
    <DashboardCard
      title="Migration Queue"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => refetch()}
      errorTitle="Integration Pending"
      errorMessage="Waiting for runtime source"
      skeletonCount={6}
      skeletonHeight="h-7"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      dataSource="BHEX Control Plane"
      headerRight={
        data ? (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {migrations.length} Active Migrations
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0">
        {migrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <GitPullRequest className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No active migrations</p>
            <span className="text-[10px] text-slate-600 mt-1">No runtime records available</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">Migration Token</th>
                  <th className="py-1.5 px-2">Repository</th>
                  <th className="py-1.5 px-2">Assigned Engineer</th>
                  <th className="py-1.5 px-2">Current Stage</th>
                  <th className="py-1.5 px-2">Progress</th>
                  <th className="py-1.5 px-2">Blocked Reason</th>
                  <th className="py-1.5 px-2 text-center">Evidence</th>
                  <th className="py-1.5 px-2 text-center">Review Status</th>
                </tr>
              </thead>
              <tbody>
                {migrations.map((item, idx) => (
                  <tr
                    key={item.migration_token || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-purple-400 truncate max-w-[120px]" title={item.migration_token}>
                      {item.migration_token}
                    </td>
                    <td className="py-1 px-2 font-mono text-[10px] text-slate-300 truncate max-w-[130px]" title={item.repository}>
                      {item.repository}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[100px]" title={item.assigned_engineer}>
                      {item.assigned_engineer}
                    </td>
                    <td className="py-1 px-2 text-slate-400 font-mono text-[10px]">{item.current_stage}</td>
                    <td className="py-1 px-2 min-w-[90px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{item.progress}%</span>
                      </div>
                    </td>
                    <td className="py-1 px-2">
                      {item.blocked_reason ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate max-w-[120px]" title={item.blocked_reason}>
                          <ShieldAlert size={10} className="shrink-0" />
                          {item.blocked_reason}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-center font-mono text-[10px]">
                      {typeof item.evidence_submitted === "boolean" ? (
                        item.evidence_submitted ? (
                          <span className="text-emerald-400 font-semibold">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )
                      ) : (
                        item.evidence_submitted
                      )}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.review_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 shrink-0 pt-1.5 border-t border-slate-800">
            <span>BHEX Migration Engine</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
