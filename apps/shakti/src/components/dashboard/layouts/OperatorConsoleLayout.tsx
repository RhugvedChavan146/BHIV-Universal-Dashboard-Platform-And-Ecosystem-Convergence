import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { OperatorCard } from "@/components/dashboard/primitives/OperatorCard";
import { TimelineCard } from "@/components/dashboard/primitives/TimelineCard";

import { useAlertsDashboard, useRuntimeDashboard } from "@/hooks/useQueries";
import { useAuditRecent } from "@/hooks/useBucketQueries";
import { useNiyantranTasks } from "@/hooks/useNiyantranQueries";
import { toSeverity, formatRelativeTime } from "@/utils/format";

function toOperatorStatus(status: string): "active" | "away" | "offline" | "busy" {
  if (status === "active") return "active";
  if (status === "failed") return "offline";
  return "away";
}

export default memo(function OperatorConsoleLayout() {
  const alerts = useAlertsDashboard();
  const runtime = useRuntimeDashboard();
  const audit = useAuditRecent(20);
  const niyantranTasks = useNiyantranTasks();

  const auditOperations = audit.data?.operations ?? [];

  const activities = useMemo(() => {
    if (niyantranTasks.data && niyantranTasks.data.length > 0) {
      return niyantranTasks.data.slice(0, 10).map((t) => ({
        id: t._id,
        message: `Task ${t.title} [${t.priority}] — ${t.status}`,
        source: typeof t.assignee === "object" ? t.assignee?.name : "Unassigned",
        category: "task" as const,
        timestamp: formatRelativeTime(t.createdAt || new Date().toISOString()),
        severity: t.priority === "High" ? ("critical" as const) : ("info" as const),
      }));
    }

    if (auditOperations.length > 0) {
      return auditOperations.map(op => ({
        id: op._id,
        message: `${op.operation_type} artifact ${op.artifact_id ? op.artifact_id.slice(0, 8) + '...' : ''} (${op.status})`,
        source: op.requester_id || op.integration_id || "bucket_service",
        category: "system" as const,
        timestamp: formatRelativeTime(op.timestamp),
        severity: op.status === "success" ? "info" as const : "critical" as const,
      }));
    }

    const sortedAlerts = [...(alerts.data?.alerts ?? [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return sortedAlerts.map(a => ({
      id: a.id,
      message: a.message,
      source: a.source,
      category: a.category ?? "alert",
      timestamp: formatRelativeTime(a.timestamp),
      severity: toSeverity(a.severity),
    }));
  }, [niyantranTasks.data, auditOperations, alerts.data?.alerts]);

  // Derive operator cards from real /dashboard/runtime sessions
  const operators = useMemo(() =>
    (runtime.data?.sessions ?? []).slice(0, 4).map(s => ({
      name: s.session_id,
      role: s.current_operation ?? "Runtime Session",
      status: toOperatorStatus(s.status),
      taskCount: s.events_processed,
      assignment: s.current_operation ?? undefined,
    })), [runtime.data?.sessions]);

  const isLoading = alerts.isLoading && runtime.isLoading && audit.isLoading;
  const isError = !isLoading && (alerts.isError && runtime.isError && audit.isError);
  const hasData = alerts.data !== undefined || runtime.data !== undefined || audit.data !== undefined;

  const timestamp = audit.data ? new Date().toISOString() : (alerts.data?.timestamp || runtime.data?.timestamp);
  const isFetching = alerts.isFetching || runtime.isFetching || audit.isFetching;
  const isStale = alerts.isStale || runtime.isStale || audit.isStale;
  const traceId = (alerts.data as any)?.trace_id || (runtime.data as any)?.trace_id;

  return (
    <DashboardCard
      title="Operator Console"
      ariaLabel="Operator Console Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={hasData}
      onRetry={() => { alerts.refetch(); runtime.refetch(); audit.refetch(); }}
      errorMessage="Failed to load console data"
      skeletonCount={5}
      skeletonHeight="h-10"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={traceId}
      dataSource="Bucket Audit & Control Plane"
    >
      {hasData && (
        <div className="flex flex-col gap-2 h-full">
          {operators.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {operators.slice(0, 2).map(op => (
                <OperatorCard
                  key={op.name}
                  name={op.name}
                  role={op.role}
                  status={op.status}
                  taskCount={op.taskCount}
                  currentAssignment={op.assignment}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-3">No Runtime Data Available</p>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 border-b border-slate-700/60 pb-1">Activity Log</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No Runtime Data Available</p>
            ) : (
              <div className="space-y-0 overflow-y-auto flex-1 min-h-0 max-h-[180px] pr-2">
                {activities.map((a, i, arr) => (
                  <TimelineCard
                    key={a.id}
                    message={a.message}
                    source={a.source}
                    category={a.category ?? "alert"}
                    timestamp={a.timestamp}
                    severity={a.severity}
                    isLast={i === arr.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
