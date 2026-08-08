import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useExecutionRegistry } from "@/hooks/useQueries";
import { toSeverity, severityColor } from "@/utils/format";

export default memo(function WorkflowLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useExecutionRegistry();

  const active = data?.active_executions ?? 0;
  const allExecutions = data?.executions ?? [];

  return (
    <DashboardCard
      title="Active Workflows"
      ariaLabel="Workflow Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={refetch}
      errorMessage="Failed to load workflows"
      skeletonCount={3}
      skeletonHeight="h-10"
      timestamp={data?.timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={(data as any)?.trace_id}
      dataSource="Execution Registry"
      isEmpty={data !== undefined && allExecutions.length === 0}
      emptyMessage="No Execution Registry Data Available"
      headerRight={data ? <span className="text-xs text-slate-500">{active} active</span> : undefined}
    >
      {data && allExecutions.length > 0 && (
        <div className="overflow-y-auto flex-1 min-h-0 max-h-[280px] pr-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="border-b border-slate-700/60 text-[12px] font-semibold text-slate-400">
                <th className="py-1 pb-1.5">ID</th>
                <th className="py-1 pb-1.5 font-mono">Workflow</th>
                <th className="py-1 pb-1.5">Active Step</th>
                <th className="py-1 pb-1.5">Owner</th>
                <th className="py-1 pb-1.5">Progress</th>
                <th className="py-1 pb-1.5 text-right">Priority</th>
              </tr>
            </thead>
            <tbody>
              {allExecutions.map((ex) => {
                const steps = ex.steps ?? [];
                return (
                  <tr key={ex.execution_id} className="border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 text-[13px] text-slate-200">
                    <td className="py-1 font-mono text-[11px] text-slate-450">
                      #{ex.execution_id.slice(0, 6)}
                    </td>
                    <td className="py-1 font-semibold text-slate-200 truncate max-w-[100px]" title={ex.workflow}>
                      {ex.workflow}
                    </td>
                    <td className="py-1 text-slate-400 truncate max-w-[120px]" title={ex.description}>
                      {ex.description}
                    </td>
                    <td className="py-1 text-slate-450 font-mono text-[11px] truncate max-w-[80px]" title={ex.agent}>
                      {ex.agent}
                    </td>
                    <td className="py-1">
                      <div className="flex items-center gap-1">
                        {steps.map((step, idx) => {
                          const isDone = step.status === "completed";
                          const isActive = step.status === "active";
                          const isFailed = step.status === "failed";

                          let colorClass = "bg-slate-700";
                          if (isDone) colorClass = "bg-emerald-500";
                          else if (isFailed) colorClass = "bg-red-500 animate-pulse";
                          else if (isActive) colorClass = "bg-blue-400 animate-pulse";

                          return (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full inline-block shrink-0 ${colorClass}`}
                              title={`${step.name}: ${step.status}`}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className={`py-1 text-right font-bold capitalize font-mono text-[11px] ${severityColor(toSeverity(ex.priority))}`}>
                      {ex.priority}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
});
