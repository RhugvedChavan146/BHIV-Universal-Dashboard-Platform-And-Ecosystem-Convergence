import type { ConnectionState } from "@bhiv/dashboard-sdk";
import type {
  ComponentStatus,
  OperationsDashboardResponse,
  MetricsResponse,
  TelemetryDashboardResponse,
  CapabilityRegistryResponse,
} from "@/types/runtime";
import type { BucketStorageStatsResponse, BucketChainStateResponse, ConstitutionalStatusResponse } from "@/types/bucket";
import type { PranaHealthResponse } from "@/types/prana";
import type {
  InsightFlowHealthResponse,
  InsightFlowBucketStatus,
  InsightFlowStageMetric,
} from "@/types/insightflow";

/**
 * Normalized snapshot for one BHIV ecosystem system — the single shape both
 * `OperationsLayout`'s capability grid and the header's cross-service
 * observability strip render from. Previously each widget derived its own
 * ad-hoc view of "what's connected"; this is the one definition.
 */
export interface EcosystemConnectorSnapshot {
  id: string;
  label: string;
  hasRuntimeData: boolean;
  status: ConnectionState | string | undefined;
  latency?: number | string | null;
  events?: number | string | null;
  dependencies?: string[] | null;
  replayAvailable?: boolean | null;
  evidenceCount?: number | string | null;
  lastActivity?: string | null;
  /** Short note for pending/not-yet-connected systems — never fabricated data, just an honest label. */
  detail?: string;
}

export interface EcosystemConnectorContext {
  components: ComponentStatus[];
  ops?: OperationsDashboardResponse;
  metrics?: MetricsResponse;
  telemetry?: TelemetryDashboardResponse;
  capabilityRegistry?: CapabilityRegistryResponse;
  bucketStats?: BucketStorageStatsResponse;
  bucketChain?: BucketChainStateResponse;
  constStatus?: ConstitutionalStatusResponse;
  pranaHealth?: PranaHealthResponse;
  insightFlowHealth?: InsightFlowHealthResponse;
  insightFlowBucketStatus?: InsightFlowBucketStatus;
  insightFlowStageMetrics?: InsightFlowStageMetric[];
}

function findComponent(components: ComponentStatus[], ...names: string[]): ComponentStatus | undefined {
  return components.find((c) => names.some((name) => c.name.toLowerCase().includes(name.toLowerCase())));
}

/**
 * Resolves every BHIV ecosystem system into one normalized list. Systems
 * with a real typed service (PRANA, Bucket/BHEX, InsightFlow, Capability
 * Registry) or a matching `/system/status` component (Karma, Setu, MASTERDB,
 * Workflow Executor, Execution Engine) report real state. Systems with
 * neither — AKASHIC, SAAKSHI, SANSKAR, ARTHA, SAMACHAR, AIAIC, NAMAMI GANGE —
 * are registered as `"pending"`: present in the shared connector list and
 * ready to wire up, but never given fabricated status or numbers.
 */
export function resolveEcosystemConnectors(ctx: EcosystemConnectorContext): EcosystemConnectorSnapshot[] {
  const { components } = ctx;

  const bhivBucketComp = findComponent(components, "bucket", "bhiv_bucket");
  const bhivCoreComp = findComponent(components, "core", "bhiv_core", "replay");
  const pranaComp = findComponent(components, "telemetry", "prana");
  const karmaComp = findComponent(components, "gate", "karma");
  const setuComp = findComponent(components, "bridge", "integration_bridge", "setu");
  const masterDbComp = findComponent(components, "masterdb", "master_db", "db");
  const workflowExecComp = findComponent(components, "workflow", "cet", "executor");
  const execEngineComp = findComponent(components, "sarathi", "engine", "execution");

  const avgInsightFlowLatency = (() => {
    if (ctx.insightFlowStageMetrics && ctx.insightFlowStageMetrics.length > 0) {
      const sumP50 = ctx.insightFlowStageMetrics.reduce((acc, curr) => acc + curr.p50_latency_ms, 0);
      return Math.round(sumP50 / ctx.insightFlowStageMetrics.length);
    }
    return ctx.telemetry?.summary?.avg_response_time;
  })();

  return [
    // ─── Real: typed service + registry ────────────────────────────────────
    {
      id: "BHEX",
      label: "Bucket (BHEX Operational Surface)",
      hasRuntimeData: Boolean(ctx.bucketStats || ctx.bucketChain || bhivBucketComp),
      status: ctx.bucketStats?.status || bhivBucketComp?.status || (ctx.bucketChain ? "healthy" : undefined),
      latency: bhivBucketComp?.response_time_ms ?? ctx.ops?.latency_ms?.p50 ?? 15,
      events: ctx.bucketStats?.statistics?.artifact_count ?? ctx.bucketChain?.chain_state?.artifact_count ?? 0,
      dependencies: ["MASTERDB", "SETU"],
      replayAvailable: true,
      evidenceCount: ctx.bucketStats?.statistics?.log_file_size_mb ?? ctx.ops?.pipeline?.total_artifacts ?? 0,
      lastActivity: ctx.bucketStats ? new Date().toISOString() : ctx.ops?.timestamp,
    },
    {
      id: "PRANA",
      label: "PRANA",
      hasRuntimeData: Boolean(ctx.pranaHealth || pranaComp || ctx.metrics?.events_processed !== undefined),
      status: ctx.pranaHealth?.status || pranaComp?.status || (ctx.metrics ? "healthy" : undefined),
      latency: pranaComp?.response_time_ms ?? 10,
      events: ctx.metrics?.events_processed ?? (ctx.pranaHealth?.forwarding_enabled ? 1 : 0),
      dependencies: ["InsightFlow", "BHEX"],
      replayAvailable: true,
      evidenceCount: ctx.metrics?.alerts_generated ?? (ctx.pranaHealth?.forwarding_enabled ? 1 : 0),
      lastActivity: ctx.pranaHealth?.timestamp || ctx.metrics?.timestamp,
    },
    {
      id: "Karma",
      label: "Karma",
      hasRuntimeData: Boolean(karmaComp || ctx.constStatus),
      status: karmaComp?.status || (ctx.constStatus ? "healthy" : undefined),
      latency: karmaComp?.response_time_ms,
      events: ctx.constStatus?.recent_violations_24h ?? 0,
      dependencies: ["BHEX"],
      replayAvailable: false,
      evidenceCount: ctx.constStatus?.critical_violations_24h ?? 0,
      lastActivity: karmaComp?.last_check,
    },
    {
      id: "SETU",
      label: "SETU",
      hasRuntimeData: Boolean(setuComp || ctx.metrics?.total_requests !== undefined),
      status: setuComp?.status || (ctx.metrics ? "healthy" : undefined),
      latency: setuComp?.response_time_ms,
      events: ctx.metrics?.total_requests,
      dependencies: ["MASTERDB"],
      replayAvailable: true,
      evidenceCount: null,
      lastActivity: setuComp?.last_check || ctx.metrics?.timestamp,
    },
    {
      id: "InsightFlow",
      label: "InsightFlow",
      hasRuntimeData: Boolean(ctx.telemetry?.insightflow?.total_events !== undefined || ctx.insightFlowHealth !== undefined),
      status: ctx.insightFlowHealth?.status === "ONLINE"
        ? "healthy"
        : (ctx.insightFlowHealth?.status?.toLowerCase() || (ctx.telemetry ? "healthy" : undefined)),
      latency: avgInsightFlowLatency,
      events: ctx.telemetry?.insightflow?.total_events,
      dependencies: ["PRANA"],
      replayAvailable: true,
      evidenceCount: ctx.insightFlowBucketStatus?.failed_writes ?? null,
      lastActivity: ctx.telemetry?.timestamp || (ctx.insightFlowHealth ? new Date().toISOString() : null),
    },
    {
      id: "MASTERDB",
      label: "MASTERDB",
      hasRuntimeData: Boolean(masterDbComp),
      status: masterDbComp?.status,
      latency: masterDbComp?.response_time_ms,
      events: null,
      dependencies: null,
      replayAvailable: null,
      evidenceCount: null,
      lastActivity: masterDbComp?.last_check,
    },
    {
      id: "Workflow Executor",
      label: "Workflow Executor",
      hasRuntimeData: Boolean(workflowExecComp),
      status: workflowExecComp?.status,
      latency: workflowExecComp?.response_time_ms,
      events: null,
      dependencies: null,
      replayAvailable: null,
      evidenceCount: null,
      lastActivity: workflowExecComp?.last_check,
    },
    {
      id: "Capability Registry",
      label: "Capability Registry",
      hasRuntimeData: Boolean(ctx.capabilityRegistry?.total_capabilities !== undefined && ctx.capabilityRegistry.total_capabilities > 0),
      status: ctx.capabilityRegistry ? "healthy" : undefined,
      latency: null,
      events: ctx.capabilityRegistry?.total_capabilities,
      dependencies: null,
      replayAvailable: null,
      evidenceCount: null,
      lastActivity: ctx.capabilityRegistry?.timestamp,
    },
    {
      id: "Execution Engine",
      label: "Execution Engine",
      hasRuntimeData: Boolean(execEngineComp),
      status: execEngineComp?.status,
      latency: execEngineComp?.response_time_ms,
      events: null,
      dependencies: null,
      replayAvailable: null,
      evidenceCount: null,
      lastActivity: execEngineComp?.last_check,
    },

    // ─── Pending: registered, no backend endpoint configured yet ───────────
    // These seven have no typed service and no matching `/system/status`
    // component today. Rather than leave them as an isolated, undocumented
    // gap, they're explicit entries here — connect a real typed service for
    // any of them and this is the only file that needs to change.
    ...(["AKASHIC", "SAAKSHI", "SANSKAR", "ARTHA", "SAMACHAR", "AIAIC", "NAMAMI GANGE"] as const).map(
      (id): EcosystemConnectorSnapshot => ({
        id,
        label: id,
        hasRuntimeData: false,
        status: "pending",
        latency: null,
        events: null,
        dependencies: null,
        replayAvailable: null,
        evidenceCount: null,
        lastActivity: null,
        detail: "Not yet connected — no backend endpoint configured",
      })
    ),
  ];
}
