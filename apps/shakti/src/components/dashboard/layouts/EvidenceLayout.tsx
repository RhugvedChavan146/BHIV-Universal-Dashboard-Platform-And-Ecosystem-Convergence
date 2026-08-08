import { memo, useState, useMemo } from "react";
import { Activity, Clock, Zap, Database, Layers, FileText, ShieldCheck, GitBranch } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EvidenceCard } from "@/components/dashboard/primitives/EvidenceCard";
import { useTelemetryDashboard, useExecutionRegistry, useReplayRegistry } from "@/hooks/useQueries";
import { useBucketArtifacts, useAuditRecent } from "@/hooks/useBucketQueries";
import { usePranaPropagationLog } from "@/hooks/usePranaQueries";
import { buildTraceLineage, type LineageSource } from "@bhiv/dashboard-sdk";

import { formatTime, formatRelativeTime } from "@/utils/format";

export default memo(function EvidenceLayout() {
  const telemetry = useTelemetryDashboard();
  const bucket = useBucketArtifacts();
  const audit = useAuditRecent(20);
  const pranaLog = usePranaPropagationLog(20);
  const executions = useExecutionRegistry();
  const replays = useReplayRegistry();


  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [selectedArtifactTab, setSelectedArtifactTab] = useState<string>("instruction");

  const bucketArtifacts = bucket.data?.artifacts ?? [];
  const auditOperations = audit.data?.operations ?? [];
  const pranaLogs = pranaLog.data?.logs ?? [];
  const telemetryItems = telemetry.data?.recent_telemetry ?? [];


  // Active artifact selection
  const activeArtifact = useMemo(() => {
    if (selectedArtifactId) {
      const bArt = bucketArtifacts.find(a => a.artifact_id === selectedArtifactId || a.trace_id === selectedArtifactId);
      if (bArt) return { type: "bucket" as const, bucket: bArt, trace_id: bArt.trace_id };
      const pLog = pranaLogs.find(l => l.trace_id === selectedArtifactId);
      if (pLog) return { type: "prana" as const, prana: pLog, trace_id: pLog.trace_id };
      const aOp = auditOperations.find(o => o._id === selectedArtifactId || o.artifact_id === selectedArtifactId);
      if (aOp) return { type: "audit" as const, audit: aOp, trace_id: aOp.data_after?.artifact?.trace_id || aOp._id };
      const tArt = telemetryItems.find(t => t.trace_id === selectedArtifactId);
      if (tArt) return { type: "telemetry" as const, telemetry: tArt, trace_id: tArt.trace_id };
    }
    if (bucketArtifacts.length > 0) {
      return { type: "bucket" as const, bucket: bucketArtifacts[0], trace_id: bucketArtifacts[0].trace_id };
    }
    if (pranaLogs.length > 0) {
      return { type: "prana" as const, prana: pranaLogs[0], trace_id: pranaLogs[0].trace_id };
    }
    if (auditOperations.length > 0) {
      const aOp = auditOperations[0];
      return { type: "audit" as const, audit: aOp, trace_id: aOp.data_after?.artifact?.trace_id || aOp._id };
    }
    if (telemetryItems.length > 0) {
      return { type: "telemetry" as const, telemetry: telemetryItems[0], trace_id: telemetryItems[0].trace_id };
    }
    return null;
  }, [bucketArtifacts, pranaLogs, auditOperations, telemetryItems, selectedArtifactId]);

  // Cross-service provenance: correlates the active trace across Execution
  // Registry, Replay Registry, Bucket artifacts, PRANA propagation, and audit
  // records via the shared `buildTraceLineage` utility — one correlation
  // implementation instead of a per-source lookup duplicated in this file.
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
      {
        sourceType: "telemetry",
        records: pranaLogs,
        getTraceId: (r) => r.trace_id,
        getId: (r) => `${r.trace_id}-${r.attempt ?? 1}`,
        getLabel: (r) => `PRANA \u2192 ${r.destination}`,
        getTimestamp: (r) => r.logged_at,
        getStatus: (r) => r.status,
      },
      {
        sourceType: "audit",
        records: auditOperations,
        getTraceId: (r) => r.data_after?.artifact?.trace_id,
        getId: (r) => r._id,
        getLabel: (r) => r.operation_type,
        getTimestamp: (r) => r.timestamp,
        getStatus: (r) => r.status,
      },
    ];

    return buildTraceLineage(activeArtifact.trace_id, sources);
  }, [activeArtifact?.trace_id, executions.data, replays.data, bucketArtifacts, pranaLogs, auditOperations]);

  const isLoading = bucket.isLoading && audit.isLoading && telemetry.isLoading && pranaLog.isLoading;
  const isError = !isLoading && bucket.isError && audit.isError && telemetry.isError && pranaLog.isError;
  const hasData = bucketArtifacts.length > 0 || pranaLogs.length > 0 || auditOperations.length > 0 || telemetryItems.length > 0;

  const timestamp = pranaLogs.length > 0 ? pranaLogs[0].logged_at : audit.data ? new Date().toISOString() : bucket.data ? new Date().toISOString() : telemetry.data?.timestamp;

  return (
    <DashboardCard
      title="Evidence & Intelligence"
      isLoading={isLoading}
      isError={isError}
      hasData={hasData}
      onRetry={() => { bucket.refetch(); audit.refetch(); telemetry.refetch(); executions.refetch(); replays.refetch(); }}
      errorMessage="Failed to load evidence"
      skeletonCount={4}
      skeletonHeight="h-10"
      isEmpty={!isLoading && !hasData}
      emptyMessage="No Runtime Data Available"
      timestamp={timestamp}
      isFetching={bucket.isFetching || audit.isFetching || telemetry.isFetching}
      isStale={bucket.isStale || audit.isStale || telemetry.isStale}
      traceId={activeArtifact?.trace_id}
      dataSource="Bucket Service & Audit Trail"
      headerRight={timestamp ? <span className="text-xs text-slate-500">{formatTime(timestamp)}</span> : undefined}
    >
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0 flex-1">
          {/* Column 1: Bucket Evidence (Artifacts / Audit list) */}
          <div className="lg:col-span-6 flex flex-col min-h-0 border-r border-slate-700/30 pr-2">
            <h3 className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Recent Evidence</span>
              <span className="text-[10px] font-mono text-slate-500">
                {bucketArtifacts.length > 0 ? `${bucketArtifacts.length} artifacts` : `${auditOperations.length} audit records`}
              </span>
            </h3>
            <div className="space-y-1 overflow-y-auto flex-1 max-h-[300px] pr-1">
              {bucketArtifacts.length > 0 ? (
                bucketArtifacts.map((art) => {
                  const isSelected = activeArtifact?.type === "bucket" && activeArtifact.bucket.artifact_id === art.artifact_id;
                  return (
                    <div
                      key={art.artifact_id}
                      onClick={() => {
                        setSelectedArtifactId(art.artifact_id);
                        setSelectedArtifactTab("instruction");
                      }}
                      className={`cursor-pointer rounded p-1 transition-colors ${isSelected ? 'bg-slate-700/40 border border-slate-600/50' : 'hover:bg-slate-800/30 border border-transparent'}`}
                    >
                      <EvidenceCard
                        source={art.source_module_id || "Bucket Module"}
                        description={`Type: ${art.artifact_type} | Schema: ${art.schema_version}`}
                        confidence={99.9}
                        icon={Database}
                        iconColor="text-cyan-400"
                        secondaryText={`ID: ${art.artifact_id.slice(0, 8)}... | Trace: ${art.trace_id.slice(0, 8)}...`}
                        noBorder
                      />
                    </div>
                  );
                })
              ) : pranaLogs.length > 0 ? (
                pranaLogs.map((log) => {
                  const isSelected = activeArtifact?.type === "prana" && activeArtifact.prana.trace_id === log.trace_id;
                  return (
                    <div
                      key={log.trace_id}
                      onClick={() => {
                        setSelectedArtifactId(log.trace_id);
                        setSelectedArtifactTab("instruction");
                      }}
                      className={`cursor-pointer rounded p-1 transition-colors ${isSelected ? 'bg-slate-700/40 border border-slate-600/50' : 'hover:bg-slate-800/30 border border-transparent'}`}
                    >
                      <EvidenceCard
                        source={log.destination || "PRANA Forwarder"}
                        description={`Propagation: ${log.status} | Code: ${log.http_status ?? 'N/A'}`}
                        confidence={log.status === "success" ? 99.8 : 50.0}
                        icon={Zap}
                        iconColor={log.status === "success" ? "text-cyan-400" : "text-amber-400"}
                        secondaryText={`Trace: ${log.trace_id.slice(0, 10)}... | Attempt: ${log.attempt ?? 1}`}
                        noBorder
                      />
                    </div>
                  );
                })
              ) : auditOperations.length > 0 ? (
                auditOperations.map((op) => {
                  const isSelected = activeArtifact?.type === "audit" && activeArtifact.audit._id === op._id;
                  const artInfo = op.data_after?.artifact;
                  const itemTitle = artInfo ? `Artifact ${artInfo.artifact_type}` : `Audit Op: ${op.operation_type}`;
                  const artId = op.artifact_id || artInfo?.artifact_id || op._id;

                  return (
                    <div
                      key={op._id}
                      onClick={() => {
                        setSelectedArtifactId(op._id);
                        setSelectedArtifactTab("instruction");
                      }}
                      className={`cursor-pointer rounded p-1 transition-colors ${isSelected ? 'bg-slate-700/40 border border-slate-600/50' : 'hover:bg-slate-800/30 border border-transparent'}`}
                    >
                      <EvidenceCard
                        source={op.requester_id || op.integration_id || "bucket_audit"}
                        description={`${itemTitle} (${op.status})`}
                        confidence={op.status === "success" ? 99.5 : 45.0}
                        icon={ShieldCheck}
                        iconColor={op.status === "success" ? "text-emerald-400" : "text-amber-400"}
                        secondaryText={`ID: ${artId.slice(0, 8)}... | ${formatRelativeTime(op.timestamp)}`}
                        noBorder
                      />
                    </div>
                  );
                })
              ) : (
                telemetryItems.map((item) => {
                  const isSelected = activeArtifact?.type === "telemetry" && activeArtifact.telemetry.trace_id === item.trace_id;
                  const classification = item.signal?.classification || "nominal";
                  const confidence = classification === "critical" ? 95.8 : classification === "warning" ? 78.4 : 99.2;
                  const iconColor = classification === "critical" ? "text-red-400" : classification === "warning" ? "text-yellow-400" : "text-emerald-400";
                  const icon = classification === "critical" ? Zap : classification === "warning" ? Clock : Activity;

                  return (
                    <div
                      key={item.trace_id}
                      onClick={() => {
                        setSelectedArtifactId(item.trace_id);
                        setSelectedArtifactTab("instruction");
                      }}
                      className={`cursor-pointer rounded p-1 transition-colors ${isSelected ? 'bg-slate-700/40 border border-slate-600/50' : 'hover:bg-slate-800/30 border border-transparent'}`}
                    >
                      <EvidenceCard
                        source={item.telemetry?.source_id || "System Source"}
                        description={item.signal?.prompt || item.telemetry?.metric || "Telemetry data point"}
                        confidence={confidence}
                        icon={icon}
                        iconColor={iconColor}
                        secondaryText={`Trace: ${item.trace_id.slice(0, 10)}...`}
                        noBorder
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Execution Chain & Artifact Viewer */}
          <div className="lg:col-span-6 flex flex-col min-h-0">
            {activeArtifact ? (
              <div className="flex flex-col h-full min-h-0">
                <h3 className="text-xs font-semibold text-slate-400 mb-1">Execution Chain</h3>

                {/* Chain Steps horizontal navigation */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900/40 rounded border border-slate-800/80 mb-2">
                  {[
                    { id: "instruction", label: "A1 Instruction", icon: FileText },
                    { id: "blueprint", label: "A2 Blueprint", icon: Database },
                    { id: "execution", label: "A3 Execution", icon: Layers }
                  ].map((step) => {
                    const StepIcon = step.icon;
                    const isStepSelected = selectedArtifactTab === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedArtifactTab(step.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold transition-colors ${isStepSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-850 text-slate-400'}`}
                      >
                        <StepIcon size={10} />
                        <span>{step.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Artifact Details Viewer */}
                <div className="flex-1 overflow-y-auto bg-slate-900/20 rounded border border-slate-800/50 p-2 text-[11px] max-h-[250px]">
                  <h4 className="font-semibold text-slate-350 border-b border-slate-800 pb-1 mb-1.5 uppercase tracking-wider text-[9px]">
                    Artifact Viewer - {selectedArtifactTab}
                  </h4>

                  {activeArtifact.type === "bucket" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Artifact ID:</span> <span className="text-cyan-400 font-mono font-bold truncate max-w-[140px]">{activeArtifact.bucket.artifact_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Artifact Type:</span> <span className="text-slate-200 font-mono font-semibold">{activeArtifact.bucket.artifact_type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Source Module:</span> <span className="text-slate-300 font-mono">{activeArtifact.bucket.source_module_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span className="text-slate-400 font-mono">{formatRelativeTime(activeArtifact.bucket.timestamp_utc)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Trace ID:</span> <span className="text-slate-350 font-mono truncate max-w-[140px]">{activeArtifact.bucket.trace_id}</span></div>
                      {activeArtifact.bucket.parent_hash && (
                        <div className="flex justify-between"><span className="text-slate-500">Parent Hash:</span> <span className="text-slate-400 font-mono truncate max-w-[140px]">{activeArtifact.bucket.parent_hash}</span></div>
                      )}
                      {activeArtifact.bucket.hash && (
                        <div className="flex justify-between"><span className="text-slate-500">Hash:</span> <span className="text-emerald-400 font-mono truncate max-w-[140px]">{activeArtifact.bucket.hash}</span></div>
                      )}
                    </div>
                  )}

                  {activeArtifact.type === "prana" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">PRANA Log Trace:</span> <span className="text-cyan-400 font-mono font-bold truncate max-w-[140px]">{activeArtifact.prana.trace_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Destination:</span> <span className="text-slate-200 font-mono font-semibold">{activeArtifact.prana.destination}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-mono uppercase font-bold">{activeArtifact.prana.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">HTTP Code:</span> <span className="text-slate-300 font-mono">{activeArtifact.prana.http_status ?? 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Attempt:</span> <span className="text-slate-400 font-mono">{activeArtifact.prana.attempt ?? 1}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Time:</span> <span className="text-slate-400 font-mono">{formatRelativeTime(activeArtifact.prana.logged_at)}</span></div>
                    </div>
                  )}

                  {activeArtifact.type === "audit" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Audit Record ID:</span> <span className="text-cyan-400 font-mono font-bold truncate max-w-[140px]">{activeArtifact.audit._id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Operation:</span> <span className="text-slate-200 font-mono font-semibold">{activeArtifact.audit.operation_type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Requester:</span> <span className="text-slate-300 font-mono">{activeArtifact.audit.requester_id || activeArtifact.audit.integration_id || "bucket_storage"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-mono uppercase font-bold">{activeArtifact.audit.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Time:</span> <span className="text-slate-400 font-mono">{formatRelativeTime(activeArtifact.audit.timestamp)}</span></div>
                      {activeArtifact.audit.artifact_id && (
                        <div className="flex justify-between"><span className="text-slate-500">Artifact ID:</span> <span className="text-slate-300 font-mono truncate max-w-[140px]">{activeArtifact.audit.artifact_id}</span></div>
                      )}
                      {activeArtifact.audit.data_after?.artifact && (
                        <div className="mt-1 pt-1 border-t border-slate-800">
                          <span className="text-slate-500 block mb-0.5">Payload Type:</span>
                          <span className="text-cyan-300 font-mono text-[10px]">{activeArtifact.audit.data_after.artifact.artifact_type}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activeArtifact.type === "telemetry" && selectedArtifactTab === "instruction" && activeArtifact.telemetry.telemetry && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Source:</span> <span className="text-slate-300 font-mono">{activeArtifact.telemetry.telemetry.source_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Metric:</span> <span className="text-slate-300 font-mono">{activeArtifact.telemetry.telemetry.metric}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Value:</span> <span className="text-emerald-400 font-bold font-mono">{activeArtifact.telemetry.telemetry.value} {activeArtifact.telemetry.telemetry.unit}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="text-slate-300 font-mono capitalize">{activeArtifact.telemetry.telemetry.status}</span></div>
                    </div>
                  )}

                  {activeArtifact.type === "telemetry" && selectedArtifactTab === "blueprint" && activeArtifact.telemetry.signal && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Signal ID:</span> <span className="text-slate-300 font-mono">{activeArtifact.telemetry.signal.signal_id.slice(0, 12)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Classification:</span> <span className="text-yellow-400 font-semibold uppercase">{activeArtifact.telemetry.signal.classification}</span></div>
                      <div className="mt-1 pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-500 block mb-1">Instruction prompt:</span>
                        <div className="bg-slate-900/60 p-1.5 rounded text-slate-300 leading-normal font-sans border border-slate-850">
                          {activeArtifact.telemetry.signal.prompt}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedArtifactTab === "execution" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold uppercase">COMPLETED</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Storage:</span> <span className="text-cyan-400 font-mono font-semibold">Bucket Append-Only Log</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Trace ID:</span> <span className="text-slate-300 font-mono">{activeArtifact.trace_id}</span></div>
                    </div>
                  )}
                </div>

                {/* Provenance Lineage — cross-registry correlation for the active trace */}
                {lineage && lineage.nodes.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60">
                    <h4 className="flex items-center gap-1 font-semibold text-slate-350 pb-1 mb-1 uppercase tracking-wider text-[9px]">
                      <GitBranch size={10} className="text-indigo-400" />
                      Provenance Lineage ({lineage.nodes.length})
                    </h4>
                    <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto pr-1">
                      {lineage.nodes.map((node) => (
                        <div key={`${node.sourceType}-${node.id}`} className="flex items-center justify-between gap-2 text-[10px] bg-slate-900/30 rounded px-1.5 py-1">
                          <span className="uppercase font-mono text-slate-500 shrink-0">{node.sourceType}</span>
                          <span className="text-slate-300 truncate flex-1" title={node.label}>{node.label}</span>
                          {node.status && <span className="text-slate-500 shrink-0">{node.status}</span>}
                          <span className="text-slate-600 shrink-0">{formatRelativeTime(node.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No trace details selected</p>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
