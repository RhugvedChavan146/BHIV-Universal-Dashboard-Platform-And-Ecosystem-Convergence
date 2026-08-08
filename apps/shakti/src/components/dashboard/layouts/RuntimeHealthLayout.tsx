import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useSystemStatus, useMetrics } from "@/hooks/useQueries";
import { useBucketHealth } from "@/hooks/useBucketQueries";
import { usePranaHealth, usePranaSystemHealth } from "@/hooks/usePranaQueries";
import { useNiyantranStats } from "@/hooks/useNiyantranQueries";
import { useInsightFlowHealth } from "@/hooks/useInsightFlowQueries";
import { toStatus, statusColor, statusDot, formatTime } from "@/utils/format";
import type { ComponentStatus } from "@/types/runtime";

function toScore(components: ComponentStatus[]): number {
  if (!components || !components.length) return 0;
  const operational = components.filter((c) => c && (c.status === "operational" || c.status === "healthy")).length;
  return Math.round((operational / components.length) * 100);
}

export default memo(function RuntimeHealthLayout() {
  const { data, isLoading: statusLoading, isError: statusError, refetch: statusRefetch, isFetching: statusFetching, isStale: statusStale } = useSystemStatus();
  const metrics = useMetrics();
  const bucketHealth = useBucketHealth();
  const pranaHealth = usePranaHealth();
  const pranaSystemHealth = usePranaSystemHealth();
  const niyantranStats = useNiyantranStats();
  const insightFlowHealth = useInsightFlowHealth();


  const rawComponents = data?.components ?? [];

  const pranaStatus = pranaSystemHealth.data?.status || pranaHealth.data?.status;
  const pranaMode = pranaSystemHealth.data?.mode || "live";
  const pranaFwd = pranaSystemHealth.data?.forwarding_enabled ?? pranaHealth.data?.forwarding_enabled ?? true;

  const components = Array.from(
    new Map(
      [
        ...rawComponents,
        ...(bucketHealth.data ? [{
          name: "bucket_storage",
          status: bucketHealth.data.status === "degraded" ? "degraded" : "operational",
          last_check: new Date().toISOString(),
          response_time_ms: 15,
          details: `${bucketHealth.data.append_only_storage?.certification || 'APPEND_ONLY'} | ${bucketHealth.data.governance?.certification || 'gov_active'}`,
        }] : []),
        ...(pranaHealth.data || pranaSystemHealth.data ? [{
          name: "prana_service",
          status: pranaStatus === "degraded" ? "degraded" : "operational",
          last_check: new Date().toISOString(),
          response_time_ms: 10,
          details: `Mode: ${pranaMode} | Fwd: ${pranaFwd ? 'enabled' : 'disabled'}`,
        }] : []),
        ...(insightFlowHealth.data ? [{
          name: "insightflow_runtime",
          status: insightFlowHealth.data.status === "ONLINE" ? "operational" : "degraded",
          last_check: new Date().toISOString(),
          response_time_ms: null,
          details: `Errors (60s): ${insightFlowHealth.data.error_count_60s ?? 0}`,
        }] : []),
      ].map(c => [c.name, c])
    ).values()
  );

  const score = components.length > 0 ? toScore(components) : 0;

  const isLoading = statusLoading && metrics.isLoading && bucketHealth.isLoading && pranaHealth.isLoading && pranaSystemHealth.isLoading && insightFlowHealth.isLoading;
  const isError = !isLoading && (statusError && metrics.isError && bucketHealth.isError && pranaHealth.isError && pranaSystemHealth.isError && insightFlowHealth.isError);

  const timestamp = data?.timestamp || metrics.data?.timestamp || (bucketHealth.data ? new Date().toISOString() : undefined) || (insightFlowHealth.data ? new Date().toISOString() : undefined);
  const isFetching = statusFetching || metrics.isFetching || bucketHealth.isFetching || pranaHealth.isFetching || pranaSystemHealth.isFetching || insightFlowHealth.isFetching;
  const isStale = statusStale || metrics.isStale || bucketHealth.isStale || pranaHealth.isStale || pranaSystemHealth.isStale || insightFlowHealth.isStale;
  const traceId = (data as any)?.trace_id || (metrics.data as any)?.trace_id || (insightFlowHealth.data as any)?.trace_id;

  // Derive telemetry bar values from real /metrics data
  const m = metrics.data;
  const successVal = m?.requests?.success_rate_pct ?? m?.success_rate;
  const uptimeDisplay = typeof successVal === "number" ? `${successVal.toFixed(2)}%` : "—";

  const errorVal = m?.requests?.error_rate_pct ?? (typeof m?.failed_requests === "number" && typeof m?.total_requests === "number" && m.total_requests > 0 ? (m.failed_requests / m.total_requests) * 100 : 0);
  const errorDisplay = typeof errorVal === "number" ? `${errorVal.toFixed(2)}%` : "—";

  const latencyVal = m?.latency_ms?.p95 ?? m?.latency_ms?.p50 ?? m?.average_response_time_ms;
  const latencyDisplay = typeof latencyVal === "number" ? `${latencyVal.toFixed(0)}ms` : "—";

  const rpmVal = m?.requests?.total ?? m?.total_requests;
  const rpmDisplay = typeof rpmVal === "number" ? rpmVal.toLocaleString() : "—";

  return (
    <DashboardCard
      title="Runtime Health"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => { statusRefetch(); metrics.refetch(); }}
      errorMessage="Failed to load system health"
      skeletonCount={4}
      skeletonHeight="h-8"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      traceId={traceId}
      dataSource="Control Plane"
      headerRight={
        data ? (
          <div className="flex items-center gap-2">
            {niyantranStats.data?.testerApprovalCount != null && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" title="NIYANTRAN QA Approvals">
                QA: {niyantranStats.data.testerApprovalCount}
              </span>
            )}
            <span className={`text-xs font-bold ${statusColor(toStatus(data.overall_status))}`}>
              {data.overall_status}
            </span>
          </div>
        ) : undefined
      }
    >
      {data && (
        <div className="flex flex-col gap-2 h-full min-h-0">
          {/* Progress bar + Score */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">{score}% Score</span>
          </div>

          {/* Compact Telemetry bar — real values from /metrics */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900/40 p-1 rounded border border-slate-800 text-center shrink-0">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Success</div>
              <div className="text-[11px] font-bold text-emerald-400">{uptimeDisplay}</div>
            </div>
            <div className="border-l border-slate-800/80">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Errors</div>
              <div className="text-[11px] font-bold text-slate-300">{errorDisplay}</div>
            </div>
            <div className="border-l border-slate-800/80">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Latency</div>
              <div className="text-[11px] font-bold text-slate-300">{latencyDisplay}</div>
            </div>
            <div className="border-l border-slate-800/80">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Requests</div>
              <div className="text-[11px] font-bold text-slate-300">{rpmDisplay}</div>
            </div>
          </div>

          {/* Component status table */}
          {components.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 flex-1">No Runtime Data Available</p>
          ) : (
            <div className="overflow-y-auto flex-1 min-h-0 max-h-[160px] pr-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-800 z-10">
                  <tr className="border-b border-slate-700/60 text-[12px] font-semibold text-slate-400">
                    <th className="py-1">Component</th>
                    <th className="py-1 text-right">Response</th>
                    <th className="py-1 text-right">Detail</th>
                    <th className="py-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => {
                    const compStatus = toStatus(c.status);
                    return (
                      <tr key={c.name} className="border-b border-slate-850 last:border-0 hover:bg-slate-800/20 text-[13px] text-slate-200">
                        <td className="py-0.5 flex items-center gap-1.5 truncate max-w-[120px]" title={c.name}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(compStatus)}`} />
                          <span className="text-slate-300 truncate font-mono text-[11px]">{c.name}</span>
                        </td>
                        <td className="py-0.5 text-right text-slate-400 font-mono text-[11px]">
                          {c.response_time_ms != null ? `${c.response_time_ms}ms` : "—"}
                        </td>
                        <td className="py-0.5 text-right text-slate-500 truncate max-w-[90px] text-[11px]" title={c.details}>
                          {c.details || "—"}
                        </td>
                        <td className={`py-0.5 text-right font-bold capitalize text-[11px] ${statusColor(compStatus)}`}>
                          {c.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end items-center text-[10px] text-slate-500 shrink-0 pt-1 border-t border-slate-700/30">
            <span>Checked {formatTime(data.timestamp)}</span>
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
