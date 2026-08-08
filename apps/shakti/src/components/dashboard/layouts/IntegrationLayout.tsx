import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { IntegrationCard } from "@/components/dashboard/primitives/IntegrationCard";
import { AlertCard } from "@/components/dashboard/primitives/AlertCard";
import { useAlertsDashboard, useSystemStatus } from "@/hooks/useQueries";
import { useMetricsAlerts } from "@/hooks/useBucketQueries";
import { useNiyantranMergeAnalysis } from "@/hooks/useNiyantranQueries";
import { toSeverity, toStatus, formatRelativeTime } from "@/utils/format";
import type { OperationalStatus } from "@/types/api";

export default memo(function IntegrationLayout() {
  const alerts = useAlertsDashboard();
  const status = useSystemStatus();
  const bucketAlerts = useMetricsAlerts();
  const mergeAnalysis = useNiyantranMergeAnalysis();

  const liveAlertsList = useMemo(() => {
    const cpAlerts = (alerts.data?.alerts ?? []).map(a => ({
      id: a.id,
      message: a.message,
      severity: toSeverity(a.severity),
      source: a.source,
      category: a.category,
      timestamp: formatRelativeTime(a.timestamp),
      acknowledged: a.acknowledged,
    }));

    const bAlerts = (bucketAlerts.data?.alerts ?? []).map(a => ({
      id: a.alert_id,
      message: a.message,
      severity: toSeverity(a.severity),
      source: "bucket_metrics",
      category: "scale_alert",
      timestamp: formatRelativeTime(a.timestamp),
      acknowledged: false,
    }));

    const mAlerts = mergeAnalysis.data ? [{
      id: "niyantran-merge-mismatches",
      message: `NIYANTRAN Merge Mismatches: ${mergeAnalysis.data.mismatches?.total ?? 0} (Beyond 20m: ${mergeAnalysis.data.mismatches?.beyond20min ?? 0})`,
      severity: (mergeAnalysis.data.mismatches?.beyond20min ?? 0) > 0 ? ("critical" as const) : ("info" as const),
      source: "niyantran_merge",
      category: "merge_reconciliation",
      timestamp: formatRelativeTime(new Date().toISOString()),
      acknowledged: false,
    }] : [];

    return [...cpAlerts, ...bAlerts, ...mAlerts];
  }, [alerts.data?.alerts, bucketAlerts.data?.alerts, mergeAnalysis.data]);

  const unacked = (alerts.data?.unacknowledged ?? 0) + (bucketAlerts.data?.alerts ?? []).length + (mergeAnalysis.data?.mappingIssues ?? 0);

  // Derive integration cards from real /system/status components & NIYANTRAN merge analysis
  const integrations = useMemo(() => {
    const cpList = (status.data?.components ?? []).map((c) => ({
      name: c.name,
      status: toStatus(c.status) as OperationalStatus,
      latency: c.response_time_ms ?? undefined,
      syncStatus: c.details || undefined,
    }));

    if (mergeAnalysis.data) {
      cpList.push({
        name: "niyantran_reconciliation",
        status: (mergeAnalysis.data.mappingIssues > 0 ? "degraded" : "operational") as OperationalStatus,
        latency: 20,
        syncStatus: `Records: ${mergeAnalysis.data.totalRecords} | Cases: ${Object.keys(mergeAnalysis.data.byMergeCase || {}).length}`,
      });
    }

    return cpList;
  }, [status.data?.components, mergeAnalysis.data]);

  const isLoading = alerts.isLoading && status.isLoading && bucketAlerts.isLoading;
  const isError = !isLoading && (alerts.isError && status.isError && bucketAlerts.isError);
  const hasData = alerts.data !== undefined || status.data !== undefined || bucketAlerts.data !== undefined;

  const timestamp = alerts.data?.timestamp || status.data?.timestamp || (bucketAlerts.data ? new Date().toISOString() : undefined);
  const isFetching = alerts.isFetching || status.isFetching || bucketAlerts.isFetching;
  const isStale = alerts.isStale || status.isStale || bucketAlerts.isStale;
  const traceId = (alerts.data as any)?.trace_id || (status.data as any)?.trace_id;

  return (
    <DashboardCard
      title="Integrations & Alerts"
      ariaLabel="Integration Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={hasData}
      onRetry={() => { alerts.refetch(); status.refetch(); bucketAlerts.refetch(); }}
      errorMessage="Failed to load alerts"
      skeletonCount={4}
      skeletonHeight="h-14"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={traceId}
      dataSource="Bucket & Control Plane"
      headerRight={
        unacked > 0 ? (
          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">
            {unacked} new alerts
          </span>
        ) : undefined
      }
    >
      {hasData && (
        <div className="flex flex-col gap-4 h-full min-h-0">
          {integrations.length > 0 ? (
            <div className="overflow-y-auto max-h-[130px] min-h-0 shrink-0 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {integrations.map(int => (
                  <IntegrationCard
                    key={int.name}
                    systemName={int.name}
                    status={int.status}
                    latency={int.latency}
                    syncStatus={int.syncStatus}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-3 shrink-0">No Runtime Data Available</p>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 border-b border-slate-700/60 pb-1">Live Alert Feed</h3>
            {liveAlertsList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No Active Runtime Alerts</p>
            ) : (
              <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 max-h-[200px] pr-1">
                {liveAlertsList.map((a) => (
                  <AlertCard
                    key={a.id}
                    message={a.message}
                    severity={a.severity}
                    source={a.source}
                    category={a.category}
                    timestamp={a.timestamp}
                    acknowledged={a.acknowledged}
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
