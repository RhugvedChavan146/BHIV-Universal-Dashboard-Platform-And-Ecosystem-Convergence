// ─── Replay Registry — Participation Contract ─────────────────────────────────
// Contract + DTO + pure mapping for registering replay-lineage records
// (`LineageNode`s of `sourceType: "replay"`, per `runtime/traceLineage.ts`)
// with an external Replay Registry — the counterpart to `executionRegistry.ts`
// for replayed/re-run traces rather than original executions.
//
// No implementation: `ReplayRegistryAdapter` is an interface only. Reuses
// `LineageNode` from `runtime/types.ts` rather than redefining a replay
// shape. The mapping function is a pure filter + field projection — no
// lookup, no correlation, no I/O.

import type { LineageNode } from "../runtime/types";
import type { RegistryAdapter } from "./types";

/** One replay record, ready to submit to a Replay Registry. */
export interface ReplayRecordDTO {
  id: string;
  traceId: string;
  label: string;
  status?: string;
  /** ISO timestamp, carried through unchanged from the source `LineageNode`. */
  observedAt: string;
  product: string;
}

/** Contract-only adapter for the Replay Registry. No concrete implementation ships in this package. */
export type ReplayRegistryAdapter = RegistryAdapter<ReplayRecordDTO>;

/**
 * Maps one `LineageNode` to a `ReplayRecordDTO`, or `null` if the node's
 * `sourceType` isn't `"replay"` — this registry only participates with
 * replay-sourced lineage, never execution/artifact/telemetry/audit nodes.
 */
export function mapLineageNodeToReplayRecord(
  node: LineageNode,
  traceId: string,
  product: string,
): ReplayRecordDTO | null {
  if (node.sourceType !== "replay") return null;
  return {
    id: node.id,
    traceId,
    label: node.label,
    status: node.status,
    observedAt: node.timestamp,
    product,
  };
}

/** Convenience: maps every `"replay"`-sourced node in a `TraceLineage.nodes` array; non-replay nodes are silently skipped. */
export function mapLineageNodesToReplayRecords(
  nodes: LineageNode[],
  traceId: string,
  product: string,
): ReplayRecordDTO[] {
  return nodes
    .map((node) => mapLineageNodeToReplayRecord(node, traceId, product))
    .filter((record): record is ReplayRecordDTO => record !== null);
}
