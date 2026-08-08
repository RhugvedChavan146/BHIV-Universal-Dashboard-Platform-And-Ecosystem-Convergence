import { memo, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusCard } from "@/components/dashboard/primitives/StatusCard";
import { RuntimeCard } from "@/components/dashboard/primitives/RuntimeCard";
import {
  useOperationsDashboard,
  useSystemStatus,
  useMetrics,
  useTelemetryDashboard,
  useCapabilityRegistry,
} from "@/hooks/useQueries";
import {
  useBucketStorageStats,
  useBucketChainState,
  useConstitutionalStatus,
} from "@/hooks/useBucketQueries";
import { usePranaHealth } from "@/hooks/usePranaQueries";
import {
  useInsightFlowHealth,
  useInsightFlowBucketStatus,
  useInsightFlowStageMetrics,
} from "@/hooks/useInsightFlowQueries";
import { resolveEcosystemConnectors } from "@/config/ecosystemConnectors";
import { formatTime, toSeverity } from "@/utils/format";

export default memo(function OperationsLayout() {
  const ops = useOperationsDashboard();
  const status = useSystemStatus();
  const metrics = useMetrics();
  const telemetry = useTelemetryDashboard();
  const capabilityRegistry = useCapabilityRegistry();

  const bucketStats = useBucketStorageStats();
  const bucketChain = useBucketChainState();
  const constStatus = useConstitutionalStatus();
  const pranaHealth = usePranaHealth();

  const insightFlowHealth = useInsightFlowHealth();
  const insightFlowBucketStatus = useInsightFlowBucketStatus();
  const insightFlowStageMetrics = useInsightFlowStageMetrics();

  // Every BHIV ecosystem system — AKASHIC, PRANA, Karma, BHEX, SAAKSHI, SETU,
  // SANSKAR, ARTHA, SAMACHAR, AIAIC, NAMAMI GANGE, plus the runtime-internal
  // capabilities (MASTERDB, Workflow Executor, Capability Registry, Execution
  // Engine, InsightFlow) — is resolved from one shared, declarative registry
  // instead of a bespoke findComp()-per-widget lookup. See
  // `config/ecosystemConnectors.ts` for the single source of truth; adding or
  // wiring up a new system means editing that file, not this component.
  const bhivCapabilities = useMemo(
    () =>
      resolveEcosystemConnectors({
        components: status.data?.components ?? [],
        ops: ops.data,
        metrics: metrics.data,
        telemetry: telemetry.data,
        capabilityRegistry: capabilityRegistry.data,
        bucketStats: bucketStats.data,
        bucketChain: bucketChain.data,
        constStatus: constStatus.data,
        pranaHealth: pranaHealth.data,
        insightFlowHealth: insightFlowHealth.data,
        insightFlowBucketStatus: insightFlowBucketStatus.data,
        insightFlowStageMetrics: insightFlowStageMetrics.data,
      }),
    [
      status.data,
      ops.data,
      metrics.data,
      telemetry.data,
      capabilityRegistry.data,
      bucketStats.data,
      bucketChain.data,
      constStatus.data,
      pranaHealth.data,
      insightFlowHealth.data,
      insightFlowBucketStatus.data,
      insightFlowStageMetrics.data,
    ]
  );

  const isLoading = ops.isLoading || status.isLoading || metrics.isLoading;
  const isError = !isLoading && (ops.isError || status.isError || metrics.isError);
  const timestamp = ops.data?.timestamp || status.data?.timestamp;

  return (
    <DashboardCard
      title="BHIV Operations & Ecosystem Capabilities"
      ariaLabel="Operations Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={ops.data !== undefined || status.data !== undefined}
      onRetry={() => {
        ops.refetch();
        status.refetch();
        metrics.refetch();
        telemetry.refetch();
        capabilityRegistry.refetch();
      }}
      errorMessage="Failed to load BHIV operations"
      skeletonCount={5}
      skeletonHeight="h-7"
      timestamp={timestamp}
      isFetching={ops.isFetching || status.isFetching}
      isStale={ops.isStale || status.isStale}
      traceId={(ops.data as any)?.trace_id}
      dataSource="Control Plane"
      headerRight={
        <div className="flex items-center gap-2">
          {timestamp && <span className="text-xs text-slate-500">{formatTime(timestamp)}</span>}
          <button onClick={() => { ops.refetch(); status.refetch(); }} className="text-slate-500 hover:text-slate-300 transition-colors">
            <RefreshCw size={12} className={ops.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 h-full">
        {/* BHIV Ecosystem Connectors */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <h3 className="text-[11px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
            BHIV Ecosystem Connectors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-[190px] custom-scrollbar pr-1">
            {bhivCapabilities.map((cap) => (
              <RuntimeCard
                key={cap.id}
                id={cap.id}
                status={cap.status}
                latency={cap.latency}
                events={cap.events}
                dependencies={cap.dependencies}
                replayAvailable={cap.replayAvailable}
                evidenceCount={cap.evidenceCount}
                lastActivity={cap.lastActivity}
                hasRuntimeData={cap.hasRuntimeData}
              />
            ))}
          </div>
        </div>

        {/* Active Pipeline Operations */}
        {ops.data && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700/60 mb-1.5 pb-0.5">
              <h3 className="text-xs font-semibold text-slate-300">Active Operations</h3>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                {(ops.data.operations ?? []).length} total
              </span>
            </div>
            <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0 max-h-[140px] custom-scrollbar pr-1">
              {(ops.data.operations ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No Runtime Data Available</p>
              ) : (
                (ops.data.operations ?? []).map((op) => (
                  <StatusCard
                    key={op.id}
                    label={op.type}
                    severity={toSeverity(op.priority)}
                    progress={op.progress}
                    statusTheme={op.status === "running" ? "running" : op.status === "failed" ? "failed" : "pending"}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
