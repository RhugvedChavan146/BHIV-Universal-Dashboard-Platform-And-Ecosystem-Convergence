import { memo, useState, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useTelemetryDashboard, useExecutionRegistry, useReplayRegistry } from "@/hooks/useQueries";
import { useBucketArtifacts, useAuditRecent } from "@/hooks/useBucketQueries";
import { usePranaPropagationLog } from "@/hooks/usePranaQueries";
import { buildTraceLineage, type LineageSource } from "@bhiv/dashboard-sdk";

export default memo(function EvidenceLayout() {
  const telemetry = useTelemetryDashboard();
  const bucket = useBucketArtifacts();
  const audit = useAuditRecent(20);
  const pranaLog = usePranaPropagationLog(20);
  const executions = useExecutionRegistry();
  const replays = useReplayRegistry();

  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const bucketArtifacts = bucket.data?.artifacts ?? [];
  const auditOperations = audit.data?.operations ?? [];
  const pranaLogs = pranaLog.data?.logs ?? [];
  const telemetryItems = telemetry.data?.recent_telemetry ?? [];

  const activeArtifact = useMemo(() => {
    if (selectedArtifactId) {
      const bArt = bucketArtifacts.find(a => a.artifact_id === selectedArtifactId || a.trace_id === selectedArtifactId);
      if (bArt) return { type: "bucket" as const, bucket: bArt, trace_id: bArt.trace_id };
    }
    if (bucketArtifacts.length > 0) {
      return { type: "bucket" as const, bucket: bucketArtifacts[0], trace_id: bucketArtifacts[0].trace_id };
    }
    return null;
  }, [bucketArtifacts, pranaLogs, auditOperations, telemetryItems, selectedArtifactId]);

  // Cross-service provenance: correlates the active trace across Execution
  // Registry, Replay Registry, Bucket artifacts, PRANA propagation, and audit
  // records via the shared `buildTraceLineage` utility.
  const lineage = useMemo(() => {
    if (!activeArtifact?.trace_id) return null;

    const sources: LineageSource<any>[] = [
      {
        sourceType: "execution",
        records: executions.data?.executions ?? [],
        getTraceId: (r) => r.trace_id,
        getId: (r) => r.execution_id,
        getLabel: (r) => r.workflow,
        getTimestamp: (r) => r.started_at,
        getStatus: (r) => r.status,
      },
      {
        sourceType: "replay",
        records: replays.data?.replays ?? [],
        getTraceId: (r) => r.source_trace_id,
        getId: (r) => r.replay_id,
        getLabel: (r) => r.current_operation ?? "Replay",
        getTimestamp: (r) => r.started_at,
        getStatus: (r) => r.status,
      },
      {
        sourceType: "artifact",
        records: bucketArtifacts,
        getTraceId: (r) => r.trace_id,
        getId: (r) => r.artifact_id,
        getLabel: (r) => r.artifact_type,
        getTimestamp: (r) => r.timestamp_utc,
      },
    ];

    return buildTraceLineage(activeArtifact.trace_id, sources);
  }, [activeArtifact, executions.data, replays.data, bucketArtifacts]);

  return (
    <DashboardCard title="Evidence & Provenance" traceId={activeArtifact?.trace_id}>
      <div className="text-xs font-mono text-slate-300">
        Trace Lineage Nodes: {lineage?.nodes.length ?? 0}
      </div>
    </DashboardCard>
  );
});
