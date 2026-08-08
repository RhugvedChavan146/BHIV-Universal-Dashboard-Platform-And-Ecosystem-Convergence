// ─── Replay Metadata ───────────────────────────────────────────────────────────
// Implements the Replay Schema documented in `/OBSERVABILITY.md`: what's
// needed to reconstruct/re-run a past decision later. Distinct from an
// `EvidenceRecord` (the "why") — `ReplayMetadata` is the "how to redo it".
// Several existing engines' identity cards document `replay: "Not
// supported"` today (see `/RUNTIME_IDENTITY.md`); this module is the
// reusable primitive a caller can build on. `mapTraceLineageToReplayMetadata`
// bridges from the existing `TraceLineage`/`LineageNode` shape
// (`runtime/traceLineage.ts`) without redefining it.
//
// `ReplayLog` is in-memory only — no persistence, no network, and no actual
// re-execution. Nothing in this file, or anywhere in `observability/`,
// executes runtime/workflows — the same hard boundary `AgentSelector.ts`
// and `registries/` already hold themselves to.

import type { ReplayDeterminism, ReplayMetadata } from "./types";
import type { TraceLineage } from "../runtime/types";
import { createTraceId } from "./traceId";

export interface BuildReplayMetadataInput {
  traceId: string;
  /** Points back at the `EvidenceRecord.id` this replay reconstructs, if any. */
  evidenceId?: string;
  determinism: ReplayDeterminism;
  /** Inputs needed to reconstruct the original decision. Must be plain-JSON-serializable. */
  inputsSnapshot: Record<string, unknown>;
  /** Outcome originally produced, for diffing against a later replay attempt. Must be plain-JSON-serializable. */
  outcomeSnapshot: Record<string, unknown>;
  /** Supply to make the id deterministic (e.g. in a test); otherwise a random id is minted via `createTraceId`. */
  id?: string;
  /** ISO 8601 timestamp; defaults to now. */
  recordedAt?: string;
}

/** Builds one `ReplayMetadata` record. Pure — no I/O, no storage, and no re-execution of anything. */
export function buildReplayMetadata(input: BuildReplayMetadataInput): ReplayMetadata {
  return {
    id: input.id ?? createTraceId(),
    traceId: input.traceId,
    evidenceId: input.evidenceId,
    determinism: input.determinism,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    inputsSnapshot: input.inputsSnapshot,
    outcomeSnapshot: input.outcomeSnapshot,
  };
}

/** In-memory, append-only replay-metadata store. Bounded by `capacity` (oldest evicted first). */
export class ReplayLog {
  private readonly capacity: number;
  private records: ReplayMetadata[] = [];

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  public record(entry: ReplayMetadata): ReplayMetadata {
    this.records.push(entry);
    if (this.records.length > this.capacity) this.records.shift();
    return entry;
  }

  public getAll(): ReplayMetadata[] {
    return [...this.records];
  }

  public getByTraceId(traceId: string): ReplayMetadata[] {
    return this.records.filter((entry) => entry.traceId === traceId);
  }

  public clear(): void {
    this.records = [];
  }
}

/**
 * Builds `ReplayMetadata` for every node in an existing `TraceLineage` (see
 * `runtime/traceLineage.ts`'s `buildTraceLineage`) — one entry per node,
 * using that node's own `raw` record as both the inputs and outcome
 * snapshot (the most that can be reconstructed from lineage alone; a caller
 * with a real before/after pair should call `buildReplayMetadata` directly
 * instead). `determinism` defaults to `"best-effort"` since lineage alone
 * can't prove determinism either way.
 */
export function mapTraceLineageToReplayMetadata(
  lineage: TraceLineage,
  determinism: ReplayDeterminism = "best-effort",
): ReplayMetadata[] {
  return lineage.nodes.map((node) =>
    buildReplayMetadata({
      traceId: lineage.traceId,
      determinism,
      inputsSnapshot: { sourceType: node.sourceType, id: node.id, raw: node.raw },
      outcomeSnapshot: { status: node.status ?? "unknown", timestamp: node.timestamp },
    }),
  );
}
