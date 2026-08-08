// ─── Observability — Shared Type Definitions ──────────────────────────────────
// Structural types for the six observability primitives implemented in this
// module: Structured Logs, Trace IDs, Evidence, Replay Metadata, Health
// Reporting, and Metrics. See `/OBSERVABILITY.md` for the Logging Standard,
// Evidence Schema, Replay Schema, and Health Model these types encode.
//
// `HealthState`/`HealthSample` are type aliases onto the *existing*
// `ConnectionState`/`ServiceHealthSnapshot` shapes in `runtime/types.ts` —
// deliberately reused, not redefined, so this module's Health Reporting and
// `runtime/ServiceObservability.tsx`'s React provider always agree on shape.
// Every other type here is new: nothing in `runtime/types.ts`,
// `registry/AgentSelector.ts`, or elsewhere already models logs, trace ids,
// evidence, or replay metadata.
//
// Every primitive built on these types is in-memory and framework-agnostic:
// no network I/O, no execution of runtime/workflows (the same hard boundary
// `registry/AgentSelector.ts` and `registries/` already hold themselves to).

import type { ConnectionState, ServiceHealthSnapshot } from "../runtime/types";

// ─── Structured Logs ─────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

/** One structured log entry — see the Logging Standard in `/OBSERVABILITY.md` for the required-field rules this shape encodes. */
export interface StructuredLogEntry {
  /** ISO 8601 timestamp. */
  timestamp: string;
  level: LogLevel;
  message: string;
  /** Which engine/module produced this entry, e.g. "AgentSelector", "RuntimeConnector:bucket". */
  source: string;
  traceId?: string;
  product?: string;
  /** Additional structured fields. Must be plain-JSON-serializable — never pass an Error or class instance directly. */
  context?: Record<string, unknown>;
}

// ─── Trace IDs ───────────────────────────────────────────────────────────────

/** A trace id plus the current span within it, and (for a child span) the parent span it was derived from. */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export type EvidenceKind = "decision" | "validation" | "selection" | "export" | "custom";

/** One Evidence record — see the Evidence Schema in `/OBSERVABILITY.md`. Captures *why* a decision was made, distinct from `ReplayMetadata`'s *how to redo it*. */
export interface EvidenceRecord {
  id: string;
  traceId?: string;
  kind: EvidenceKind;
  /** Which engine/module recorded this, e.g. "AgentSelector.validateComposition". */
  source: string;
  product: string;
  /** ISO 8601 timestamp. */
  recordedAt: string;
  /** Human-readable one-line summary of the decision. */
  summary: string;
  /** Structured facts backing the summary. Must be plain-JSON-serializable. */
  facts: Record<string, unknown>;
}

// ─── Replay Metadata ─────────────────────────────────────────────────────────

/** How confidently a recorded decision can be reconstructed later. */
export type ReplayDeterminism = "deterministic" | "best-effort" | "non-deterministic";

/** One Replay Metadata record — see the Replay Schema in `/OBSERVABILITY.md`. Metadata only: nothing in this module re-executes anything. */
export interface ReplayMetadata {
  id: string;
  traceId: string;
  /** Points back at the `EvidenceRecord.id` this replay reconstructs, if any. */
  evidenceId?: string;
  determinism: ReplayDeterminism;
  /** ISO 8601 timestamp. */
  recordedAt: string;
  /** Inputs needed to reconstruct the original decision. Must be plain-JSON-serializable. */
  inputsSnapshot: Record<string, unknown>;
  /** Outcome originally produced, for diffing against a later replay attempt. Must be plain-JSON-serializable. */
  outcomeSnapshot: Record<string, unknown>;
}

// ─── Health Reporting ────────────────────────────────────────────────────────

/** Alias onto `ConnectionState` (`runtime/types.ts`) — see this file's header for why it's reused rather than redefined. */
export type HealthState = ConnectionState;

/** Alias onto `ServiceHealthSnapshot` (`runtime/types.ts`). */
export type HealthSample = ServiceHealthSnapshot;

/** Aggregate health across a set of samples — see the Health Model in `/OBSERVABILITY.md`. */
export interface HealthReport {
  samples: HealthSample[];
  overall: HealthState;
  /** Count of samples in "degraded" or "offline" state. */
  degradedCount: number;
  /** ids of degraded/offline samples, worst state first. */
  attention: string[];
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export type MetricType = "counter" | "gauge" | "histogram";

/** One metric's current value, as read out of a `MetricsRegistry` snapshot. */
export interface MetricSample {
  name: string;
  type: MetricType;
  /** Current value for counter/gauge; running sum for histogram (see `histogram` for the full breakdown). */
  value: number;
  histogram?: { count: number; sum: number; min: number; max: number };
  tags?: Record<string, string>;
  /** ms since epoch this metric was last updated. */
  updatedAt: number;
}

export interface MetricsSnapshot {
  observedAt: number;
  metrics: MetricSample[];
}
