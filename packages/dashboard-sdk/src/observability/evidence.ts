// ─── Evidence ────────────────────────────────────────────────────────────────
// Implements the Evidence Schema documented in `/OBSERVABILITY.md`: a
// structured record of *why* a decision was made — e.g. why AgentSelector
// resolved, gated, or rejected a zone. Several existing engines' identity
// cards (see `/RUNTIME_IDENTITY.md`) document `evidence: "None"` today; this
// module is the reusable primitive a caller can now use to change that,
// without this module itself reaching into or modifying any of those
// engines. `mapCompositionReportToEvidence` below is the one concrete
// bridge provided, built entirely from `AgentSelector`'s already-computed,
// already-exported `CompositionValidationReport` (`registry/AgentSelector.ts`)
// — no new introspection, no re-resolution.
//
// `EvidenceLog` is in-memory only: no persistence, no network. A deployment
// that wants durable evidence storage owns that itself — the natural next
// step is handing an `EvidenceRecord`'s facts to the Review Registry's
// `RegistryAdapter` contract (`registries/reviewRegistry.ts`), which is
// likewise contract-only and unimplemented here.

import type { EvidenceKind, EvidenceRecord } from "./types";
import type { CompositionValidationReport } from "../registry/AgentSelector";
import { createTraceId } from "./traceId";

export interface BuildEvidenceInput {
  kind: EvidenceKind;
  /** Which engine/module recorded this, e.g. "AgentSelector.validateComposition". */
  source: string;
  product: string;
  summary: string;
  /** Structured facts backing the summary. Must be plain-JSON-serializable. */
  facts: Record<string, unknown>;
  traceId?: string;
  /** Supply to make the id deterministic (e.g. in a test); otherwise a random id is minted via `createTraceId`. */
  id?: string;
  /** ISO 8601 timestamp; defaults to now. */
  recordedAt?: string;
}

/** Builds one `EvidenceRecord`. Pure — no I/O, no storage; pass the result to an `EvidenceLog` (or onward to a registry adapter) to persist/submit it. */
export function buildEvidenceRecord(input: BuildEvidenceInput): EvidenceRecord {
  return {
    id: input.id ?? createTraceId(),
    traceId: input.traceId,
    kind: input.kind,
    source: input.source,
    product: input.product,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    summary: input.summary,
    facts: input.facts,
  };
}

/** In-memory, append-only evidence store. Bounded by `capacity` (oldest evicted first) so a long-running session can't grow it unbounded. */
export class EvidenceLog {
  private readonly capacity: number;
  private records: EvidenceRecord[] = [];

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  public record(record: EvidenceRecord): EvidenceRecord {
    this.records.push(record);
    if (this.records.length > this.capacity) this.records.shift();
    return record;
  }

  public getAll(): EvidenceRecord[] {
    return [...this.records];
  }

  public getByTraceId(traceId: string): EvidenceRecord[] {
    return this.records.filter((entry) => entry.traceId === traceId);
  }

  public clear(): void {
    this.records = [];
  }
}

/**
 * Maps an `AgentSelector.validateComposition()` report into an
 * `EvidenceRecord` — the "why" behind a composition's resolved/blocked
 * status, ready to hand to an `EvidenceLog` or onward to a Review Registry
 * submission. Pure — reuses the report's own fields, computes nothing new.
 */
export function mapCompositionReportToEvidence(
  report: CompositionValidationReport,
  source = "AgentSelector.validateComposition",
  traceId?: string,
): EvidenceRecord {
  return buildEvidenceRecord({
    kind: "validation",
    source,
    product: report.product,
    traceId,
    summary: report.valid
      ? `Layout "${report.layoutId}" composition is valid (${report.resolvedCount}/${report.zoneCount} zones resolved).`
      : `Layout "${report.layoutId}" composition has ${report.issues.length} issue(s).`,
    facts: {
      layoutId: report.layoutId,
      valid: report.valid,
      zoneCount: report.zoneCount,
      resolvedCount: report.resolvedCount,
      issues: report.issues,
    },
  });
}
