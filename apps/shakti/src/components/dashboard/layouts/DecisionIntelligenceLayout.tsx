import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DecisionCard } from "@/components/dashboard/primitives/DecisionCard";
import { CapabilityCard } from "@/components/dashboard/primitives/CapabilityCard";

import { useOperationsDashboard } from "@/hooks/useQueries";
import { useNiyantranAims } from "@/hooks/useNiyantranQueries";
import { toSeverity } from "@/utils/format";

export default memo(function DecisionIntelligenceLayout() {
  const cpOperations = useOperationsDashboard();
  const niyantranAims = useNiyantranAims();

  // Map real operations or NIYANTRAN aims directly
  const decisions = useMemo(() => {
    const rawOps = cpOperations.data?.operations ?? [];
    if (rawOps.length > 0) {
      const sortedOps = [...rawOps].sort((a, b) => {
        const timeA = a.started_at ? new Date(a.started_at).getTime() : 0;
        const timeB = b.started_at ? new Date(b.started_at).getTime() : 0;
        return timeB - timeA;
      });

      return sortedOps.map(op => ({
        id: op.id,
        action: op.description,
        actor: op.agent,
        reason: `Priority: ${op.priority}. Progress: ${op.progress}%.`,
        status: op.status === "completed" ? "executed" as const : "pending_approval" as const,
        severity: toSeverity(op.priority),
        isAutomated: true,
      }));
    }

    const aimsList = niyantranAims.data ?? [];
    return aimsList.map(a => ({
      id: a._id,
      action: a.aims,
      actor: typeof a.user === "object" ? a.user?.name : "Strategic Objective",
      reason: `Target Date: ${a.date}. Progress: ${a.progressPercentage || 50}%.`,
      status: a.status === "Completed" ? "executed" as const : "pending_approval" as const,
      severity: a.status === "Blocked" ? ("critical" as const) : ("info" as const),
      isAutomated: true,
    }));
  }, [cpOperations.data?.operations, niyantranAims.data]);

  const isLoading = cpOperations.isLoading && niyantranAims.isLoading;
  const isError = !isLoading && cpOperations.isError && niyantranAims.isError;
  const timestamp = cpOperations.data?.timestamp || (niyantranAims.data ? new Date().toISOString() : undefined);
  const isFetching = cpOperations.isFetching || niyantranAims.isFetching;
  const isStale = cpOperations.isStale || niyantranAims.isStale;
  const dataSource = cpOperations.data ? "Control Plane" : "NIYANTRAN";


  const loadSheddingActive = useMemo(() => cpOperations.data ? cpOperations.data.system_load > 85 : false, [cpOperations.data?.system_load]);
  const autoScalingActive = useMemo(() => cpOperations.data ? cpOperations.data.active_operations > 5 : false, [cpOperations.data?.active_operations]);

  return (
    <DashboardCard
      title="Decision Intelligence"
      ariaLabel="Decision Intelligence Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={decisions.length > 0 || cpOperations.data !== undefined || niyantranAims.data !== undefined}
      onRetry={() => { cpOperations.refetch(); niyantranAims.refetch(); }}
      errorMessage="Failed to load intelligence data"
      skeletonCount={4}
      skeletonHeight="h-20"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={(cpOperations.data as any)?.trace_id}
      dataSource={dataSource}
      isEmpty={decisions.length === 0}
      emptyMessage="No Runtime Data Available"
    >
      {decisions.length > 0 && (
        <div className="flex flex-col gap-2.5 h-full min-h-0">
          <div className="grid grid-cols-2 gap-2">
            <CapabilityCard
              name="Predictive Scaling"
              description="AI-driven resource scaling"
              status="online"
              isEngaged={autoScalingActive}
            />
            <CapabilityCard
              name="Load Shedding"
              description="Emergency request dropping"
              status="online"
              isEngaged={loadSheddingActive}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-1.5 border-b border-slate-700/60 pb-0.5">Recent Decisions</h3>
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0 max-h-[250px]">
              {decisions.map(d => (
                <DecisionCard
                  key={d.id}
                  action={d.action}
                  actor={d.actor}
                  reason={d.reason}
                  status={d.status}
                  severity={d.severity}
                  isAutomated={d.isAutomated}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
