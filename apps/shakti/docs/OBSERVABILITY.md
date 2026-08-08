# Observability — BHIV Dashboard Platform

**Status: IMPLEMENTED — additive, in-memory, framework-agnostic.** This
document is both the **Logging Standard**, the **Evidence Schema**, the
**Replay Schema**, and the **Health Model** for this platform, and a guide
to the six observability primitives that implement them in
`packages/dashboard-sdk/src/observability/`: **Structured Logs, Trace IDs,
Evidence, Replay Metadata, Health Reporting, and Metrics.**

Every primitive is in-memory and performs no network I/O. Nothing here
executes runtime/workflows — the same hard boundary
[`registry/AgentSelector.ts`](./packages/dashboard-sdk/src/registry/AgentSelector.ts)
and [`registries/`](./REGISTRY_PARTICIPATION.md) already hold themselves
to. No existing file's behavior was changed to add this module — see
[What changed](#what-changed) at the bottom.

Machine-readable source: `packages/dashboard-sdk/src/observability/`
(barrel: `export * from "./observability"`, re-exported from
`@bhiv/dashboard-sdk`'s public surface). Keep this document and that code
in sync.

---

## 1. Logging Standard (Structured Logs)

Every log entry is a `StructuredLogEntry`, never a bare string:

```ts
interface StructuredLogEntry {
  timestamp: string;     // ISO 8601, set automatically
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source: string;        // which engine/module logged this, e.g. "AgentSelector"
  traceId?: string;
  product?: string;
  context?: Record<string, unknown>;  // plain-JSON-serializable only
}
```

**Rules:**
- One `StructuredLogger` instance per engine/module: `createStructuredLogger({ source: "AgentSelector" })`. No shared global buffer — the same explicit-instance style `AgentSelector`/`CapabilityRuntime` already use.
- `context` must be plain-JSON-serializable. Never pass an `Error` object, a class instance, or a React element as `context` — stringify/summarize it first.
- `error()` calls still route through `@bhiv/utils`'s existing `logger.error(message, error, context)` signature for the actual `Error` object; `context` on the `StructuredLogEntry` itself stays serializable.
- Attach `traceId` whenever the log is part of a request/decision that has one (see [§2](#2-trace-ids)), so `getEntriesByTraceId()` can pull the full story for one trace.
- Levels: `debug` for step-by-step internals (off by default in `@bhiv/utils`'s console sink outside dev builds), `info` for normal lifecycle events, `warn` for recoverable/degraded conditions, `error` for failures a caller should notice.
- Each `StructuredLogger` keeps a bounded in-memory ring buffer (`bufferSize`, default 200) of its own recent entries, readable via `getEntries()`/`getEntriesByTraceId()` — for a tool/widget that wants to show "recent activity" without wiring a console interceptor. This buffer is not persisted and does not survive a page reload.
- Console output is unchanged: every entry is still also written through `@bhiv/utils`'s existing `logger` (`console.info`/`warn`/`error`/`debug`) — that file is untouched.

Module: `observability/logger.ts` (`StructuredLogger`, `createStructuredLogger`).

---

## 2. Trace IDs

```ts
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}
```

- `createTraceId()` mints a random id (`crypto.randomUUID()` when available, a dash-joined fallback otherwise).
- `createTraceContext()` starts a new root trace; `createChildTraceContext(parent)` derives a child span in the same trace, linking `parentSpanId` back to the parent's `spanId`.
- **No ambient/global propagation.** A `TraceContext` (or a bare `traceId` string) is passed explicitly by the caller — the same "explicit over implicit" style `CapabilityRuntime`/`AgentSelector` already use, and consistent with `RuntimeConnectorListener`'s existing `meta.traceId?: string` field (`runtime/types.ts`), which this module is what actually mints values for.
- `isTraceId(value)` is a loose format sanity check only — not a lookup against any registry of issued ids.

Module: `observability/traceId.ts` (`createTraceId`, `createSpanId`, `isTraceId`, `createTraceContext`, `createChildTraceContext`).

---

## 3. Evidence Schema

Evidence answers **why** a decision was made. Several existing engines'
identity cards in [`RUNTIME_IDENTITY.md`](./RUNTIME_IDENTITY.md) document
`evidence: "None"` today — this is the primitive that changes that, without
this module reaching into or modifying any of those engines itself.

```ts
type EvidenceKind = "decision" | "validation" | "selection" | "export" | "custom";

interface EvidenceRecord {
  id: string;
  traceId?: string;
  kind: EvidenceKind;
  source: string;          // e.g. "AgentSelector.validateComposition"
  product: string;
  recordedAt: string;      // ISO 8601
  summary: string;         // one human-readable line
  facts: Record<string, unknown>;  // plain-JSON-serializable
}
```

**Rules:**
- `buildEvidenceRecord(input)` is pure — no I/O, no storage. It just shapes the record; you decide what to do with it (log it, hold it in an `EvidenceLog`, or hand it to a Review Registry adapter — see [`REGISTRY_PARTICIPATION.md`](./REGISTRY_PARTICIPATION.md)).
- `EvidenceLog` is an in-memory, append-only, bounded (default capacity 500, oldest evicted first) store with `record()`, `getAll()`, `getByTraceId()`, `clear()`. Not persisted.
- `facts` must be plain-JSON-serializable — pass the structured data behind a decision (e.g. a `CompositionValidationReport`'s fields), not a live object reference to something mutable.
- **Concrete bridge:** `mapCompositionReportToEvidence(report, source?, traceId?)` builds an `EvidenceRecord` directly from `AgentSelector.validateComposition()`'s existing, already-computed `CompositionValidationReport` — no new introspection, no re-resolution.

Module: `observability/evidence.ts` (`EvidenceRecord`, `buildEvidenceRecord`, `EvidenceLog`, `mapCompositionReportToEvidence`).

---

## 4. Replay Schema (Replay Metadata)

Replay metadata answers **how to reconstruct** a past decision later —
distinct from Evidence's *why*. Several engines' identity cards document
`replay: "Not supported"` today; this is the primitive for that.

```ts
type ReplayDeterminism = "deterministic" | "best-effort" | "non-deterministic";

interface ReplayMetadata {
  id: string;
  traceId: string;
  evidenceId?: string;     // points back at an EvidenceRecord.id, if any
  determinism: ReplayDeterminism;
  recordedAt: string;      // ISO 8601
  inputsSnapshot: Record<string, unknown>;   // plain-JSON-serializable
  outcomeSnapshot: Record<string, unknown>;  // plain-JSON-serializable
}
```

**Rules:**
- `buildReplayMetadata(input)` is pure — it records *metadata about* how to redo something; it never re-executes anything, and nothing in `observability/` opens a network connection or triggers a workflow.
- `determinism` is a caller-asserted claim, not verified by this module: `"deterministic"` (same inputs always produce the same outcome), `"best-effort"` (usually reproducible, e.g. depends on external state), `"non-deterministic"` (a replay attempt may legitimately differ).
- `ReplayLog` mirrors `EvidenceLog`'s shape (bounded, in-memory, `record()`/`getAll()`/`getByTraceId()`/`clear()`).
- **Concrete bridge:** `mapTraceLineageToReplayMetadata(lineage, determinism?)` builds one `ReplayMetadata` entry per node in an existing `TraceLineage` (`runtime/traceLineage.ts`'s `buildTraceLineage()` output), defaulting `determinism` to `"best-effort"` since lineage alone can't prove determinism either way.

Module: `observability/replay.ts` (`ReplayMetadata`, `buildReplayMetadata`, `ReplayLog`, `mapTraceLineageToReplayMetadata`).

---

## 5. Health Model (Health Reporting)

```ts
type HealthState = ConnectionState; // "online" | "degraded" | "offline" | "pending" | "unknown" — reused from runtime/types.ts, not redefined

interface HealthReport {
  samples: ServiceHealthSnapshot[]; // reused from runtime/types.ts
  overall: HealthState;
  degradedCount: number;
  attention: string[]; // degraded/offline ids, worst state first
}
```

**Aggregation rule — worst-state-wins:**
1. Any sample `"offline"` → overall `"offline"`.
2. Else any sample `"degraded"` → overall `"degraded"`.
3. Else every sample `"online"` → overall `"online"`.
4. Empty input, or any other mix (e.g. all `"pending"`/`"unknown"`) → overall `"unknown"`.

This is the exact aggregation `ServiceObservabilityProvider`
(`runtime/ServiceObservability.tsx`) already performs for React trees —
`computeHealthReport()` is that same rule, extracted as a standalone, pure,
unit-tested function, with one addition (`attention`, sorted worst-first)
so a caller knows *what* to look at, not just the overall state.
`ServiceObservability.tsx` itself is unchanged; neither module imports the
other, both build on the same `ConnectionState`/`ServiceHealthSnapshot`
types.

**Non-React usage:** `HealthReporter` is the framework-agnostic counterpart
to `useReportServiceHealth`/`useServiceObservability` — for Node tooling,
CLIs, or tests that want the same aggregation without mounting a
`ServiceObservabilityProvider`. `report(snapshot)` upserts by `id` and
notifies `subscribe()`d listeners; `getReport()` reads the current
aggregate on demand.

**Rule:** like `ServiceObservabilityProvider`, this module never infers or
fabricates a service's state — every `ServiceHealthSnapshot` must come from
a caller that actually observed it (a query hook, a poll result, etc.).

Module: `observability/health.ts` (`computeHealthReport`, `HealthReporter`, `createHealthReporter`).

---

## 6. Metrics

```ts
type MetricType = "counter" | "gauge" | "histogram";

interface MetricSample {
  name: string;
  type: MetricType;
  value: number;                 // current value (counter/gauge) or running sum (histogram)
  histogram?: { count: number; sum: number; min: number; max: number };
  tags?: Record<string, string>;
  updatedAt: number;             // ms since epoch
}
```

**Rules:**
- `MetricsRegistry` (`createMetricsRegistry()`) supports three kinds: `incrementCounter(name, delta?, tags?)` accumulates, `setGauge(name, value, tags?)` replaces, `recordHistogram(name, value, tags?)` accumulates count/sum/min/max.
- In-memory only, one process's lifetime — no persistence, no network. An app that wants durable metrics (Prometheus, Datadog, etc.) reads `getSnapshot()` on its own interval and forwards it.
- `getSnapshot()` returns every tracked metric as a `MetricsSnapshot` (`{ observedAt, metrics }`), safe to `JSON.stringify`.
- No global singleton — an engine that wants metrics creates its own `MetricsRegistry` instance, the same explicit-instance style every other primitive in this module (and `AgentSelector`/`CapabilityRuntime`) uses.

Module: `observability/metrics.ts` (`MetricsRegistry`, `createMetricsRegistry`).

---

## How the six primitives relate

```
 TraceContext (§2)
       │ traceId
       ├──────────────► StructuredLogEntry.traceId (§1)   — what happened, narrated
       ├──────────────► EvidenceRecord.traceId (§3)        — why a decision was made
       └──────────────► ReplayMetadata.traceId (§4)         — how to reconstruct it
                              │ evidenceId
                              └──────────────► links back to EvidenceRecord.id

 ServiceHealthSnapshot × N ──► computeHealthReport() (§5) ──► HealthReport

 MetricsRegistry (§6) — independent of trace ids; tracks counts/gauges/histograms per engine
```

A single `TraceContext` is the connective tissue across logs, evidence, and
replay metadata for one request/decision. Health and metrics are
per-service/per-engine aggregates, not per-trace.

---

## What this is not

- **Not a client.** No file under `observability/` performs `fetch`, opens a socket, or imports `RuntimeConnector`.
- **Not persistence.** `StructuredLogger`'s ring buffer, `EvidenceLog`, `ReplayLog`, `HealthReporter`, and `MetricsRegistry` are all in-memory only — nothing here writes to disk, a database, or a remote service. Durable storage/forwarding is a consuming deployment's concern (e.g. via the Review Registry adapter contract in [`REGISTRY_PARTICIPATION.md`](./REGISTRY_PARTICIPATION.md)).
- **Not automatic instrumentation.** Nothing in this module wires itself into `WidgetRegistry`, `CapabilityRuntime`, `AgentSelector`, `RuntimeConnector`, or any other existing engine — each remains exactly as documented in [`RUNTIME_IDENTITY.md`](./RUNTIME_IDENTITY.md). A caller that wants an engine to emit structured logs/evidence/metrics constructs and calls these primitives itself.
- **Not execution.** Building `ReplayMetadata` never re-runs anything; it only records what would be needed to do so later.

---

## What changed

Purely additive. New folder `packages/dashboard-sdk/src/observability/`
(`types.ts`, `logger.ts`, `traceId.ts`, `evidence.ts`, `replay.ts`,
`health.ts`, `metrics.ts`, `index.ts`, and six files under `__tests__/`),
re-exported once from `packages/dashboard-sdk/src/index.ts`. This
document. No existing file's behavior was altered; no file or folder was
removed.
