import { useEffect } from "react";
import { useReportServiceHealth } from "@bhiv/dashboard-sdk";
import type { ConnectionState, ServiceHealthSnapshot } from "@bhiv/dashboard-sdk";
import { useHealth, useSystemStatus, useCapabilityRegistry } from "@/hooks/useQueries";
import { useBucketHealth, useConstitutionalStatus } from "@/hooks/useBucketQueries";
import { useInsightFlowHealth } from "@/hooks/useInsightFlowQueries";
import { usePranaHealth } from "@/hooks/usePranaQueries";
import { resolveEcosystemConnectors } from "@/config/ecosystemConnectors";

interface QueryLike {
  data: unknown;
  isError: boolean;
  isFetching: boolean;
  dataUpdatedAt?: number;
}

function toConnectionState(query: QueryLike, statusField?: string | null): ConnectionState {
  if (query.isError) return "offline";
  if (query.data === undefined) return "unknown";
  if (statusField && !["ok", "healthy", "online", "operational"].includes(statusField.toLowerCase())) {
    return "degraded";
  }
  return "online";
}

/** Maps an `EcosystemConnectorSnapshot.status` string onto the shared `ConnectionState`. */
function ecosystemStatusToConnectionState(status: string | undefined, hasRuntimeData: boolean): ConnectionState {
  if (status === "pending") return "pending";
  if (!hasRuntimeData || !status) return "unknown";
  const normalized = status.toLowerCase();
  if (["healthy", "operational", "online", "ok", "active"].includes(normalized)) return "online";
  if (["offline", "failed", "unhealthy"].includes(normalized)) return "offline";
  return "degraded";
}

// Ids already published individually below (Control Plane, Bucket, InsightFlow,
// PRANA) — skipped when iterating the shared ecosystem registry so each system
// appears exactly once in the observability strip.
const ALREADY_PUBLISHED_ECOSYSTEM_IDS = new Set(["BHEX", "PRANA", "InsightFlow"]);

/**
 * Mounted once near the app root. Each service already has its own typed
 * health hook (`useHealth`, `useBucketHealth`, `useInsightFlowHealth`,
 * `usePranaHealth`) — this hook only *reports* what those hooks already know
 * into the shared cross-service observability context, so every widget
 * reads one aggregated view instead of re-deriving connectivity per layout.
 *
 * It also reports every other BHIV ecosystem connector (Karma, SETU,
 * MASTERDB, Workflow Executor, Capability Registry, Execution Engine, and
 * the pending systems — AKASHIC, SAAKSHI, SANSKAR, ARTHA, SAMACHAR, AIAIC,
 * NAMAMI GANGE) from the same shared registry `OperationsLayout` uses, so
 * the header strip and the operations panel never disagree.
 */
export function useServiceObservabilityPublisher(): void {
  const report = useReportServiceHealth();

  const controlPlane = useHealth();
  const bucket = useBucketHealth();
  const insightFlow = useInsightFlowHealth();
  const prana = usePranaHealth();
  const systemStatus = useSystemStatus();
  const capabilityRegistry = useCapabilityRegistry();
  const constStatus = useConstitutionalStatus();

  useEffect(() => {
    const snapshot: ServiceHealthSnapshot = {
      id: "control-plane",
      label: "Control Plane",
      state: toConnectionState(controlPlane, controlPlane.data?.status),
      observedAt: Date.now(),
      detail: controlPlane.data?.version ? `v${controlPlane.data.version}` : null,
    };
    report(snapshot);
  }, [controlPlane.data, controlPlane.isError, report]);

  useEffect(() => {
    const snapshot: ServiceHealthSnapshot = {
      id: "bucket",
      label: "Bucket",
      state: toConnectionState(bucket, bucket.data?.status),
      observedAt: Date.now(),
      detail: bucket.data?.bucket_version ?? null,
    };
    report(snapshot);
  }, [bucket.data, bucket.isError, report]);

  useEffect(() => {
    const snapshot: ServiceHealthSnapshot = {
      id: "insightflow",
      label: "InsightFlow",
      state: toConnectionState(insightFlow, insightFlow.data?.status),
      observedAt: Date.now(),
      detail: insightFlow.data?.service ?? null,
    };
    report(snapshot);
  }, [insightFlow.data, insightFlow.isError, report]);

  useEffect(() => {
    const snapshot: ServiceHealthSnapshot = {
      id: "prana",
      label: "PRANA",
      state: toConnectionState(prana, prana.data?.status),
      observedAt: Date.now(),
      detail: prana.data?.forwarding_enabled ? "forwarding" : null,
    };
    report(snapshot);
  }, [prana.data, prana.isError, report]);

  useEffect(() => {
    const connectors = resolveEcosystemConnectors({
      components: systemStatus.data?.components ?? [],
      capabilityRegistry: capabilityRegistry.data,
      constStatus: constStatus.data,
    });

    connectors
      .filter((c) => !ALREADY_PUBLISHED_ECOSYSTEM_IDS.has(c.id))
      .forEach((c) => {
        const snapshot: ServiceHealthSnapshot = {
          id: c.id,
          label: c.label,
          state: ecosystemStatusToConnectionState(typeof c.status === "string" ? c.status : undefined, c.hasRuntimeData),
          observedAt: Date.now(),
          detail: c.detail ?? null,
        };
        report(snapshot);
      });
  }, [systemStatus.data, capabilityRegistry.data, constStatus.data, report]);
}
