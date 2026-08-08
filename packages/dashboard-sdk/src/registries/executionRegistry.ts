// ─── Execution Registry — Participation Contract ──────────────────────────────
// Contract + DTO + pure mapping for registering execution-lineage records
// (already normalized as `LineageNode`s of `sourceType: "execution"` by
// `runtime/traceLineage.ts`) with an external Execution Registry, so it can
// correlate what the dashboard already displays with its own trace store.
//
// No implementation: `ExecutionRegistryAdapter` is an interface only. This
// module reuses `LineageNode` rather than redefining an execution shape —
// see `runtime/types.ts` for the source of truth. The mapping function is a
// pure filter + field projection: it performs no lookup, no trace
// correlation of its own (that's `buildTraceLineage`'s job), and no I/O.

import type { LineageNode } from "../runtime/types";
import type { RegistryAdapter } from "./types";

/** One execution record, ready to submit to an Execution Registry. */
export interface ExecutionRecordDTO {
  id: string;
  traceId: string;
  label: string;
  status?: string;
  /** ISO timestamp, carried through unchanged from the source `LineageNode`. */
  observedAt: string;
  product: string;
}

/** Contract-only adapter for the Execution Registry. No concrete implementation ships in this package. */
export type ExecutionRegistryAdapter = RegistryAdapter<ExecutionRecordDTO>;

/**
 * Maps one `LineageNode` to an `ExecutionRecordDTO`, or `null` if the node's
 * `sourceType` isn't `"execution"` — this registry only participates with
 * execution-sourced lineage, never replay/artifact/telemetry/audit nodes.
 */
export function mapLineageNodeToExecutionRecord(
  node: LineageNode,
  traceId: string,
  product: string,
): ExecutionRecordDTO | null {
  if (node.sourceType !== "execution") return null;
  return {
    id: node.id,
    traceId,
    label: node.label,
    status: node.status,
    observedAt: node.timestamp,
    product,
  };
}

/** Convenience: maps every `"execution"`-sourced node in a `TraceLineage.nodes` array; non-execution nodes are silently skipped. */
export function mapLineageNodesToExecutionRecords(
  nodes: LineageNode[],
  traceId: string,
  product: string,
): ExecutionRecordDTO[] {
  return nodes
    .map((node) => mapLineageNodeToExecutionRecord(node, traceId, product))
    .filter((record): record is ExecutionRecordDTO => record !== null);
}
