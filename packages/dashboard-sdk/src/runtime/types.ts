// ─── Shared Runtime Connector Contracts ───────────────────────────────────────
// Product-agnostic types for connecting dashboard widgets to live backend
// services: connection/health state, polling-now/streaming-ready transport,
// and cross-service trace correlation. Every BHIV product (SHAKTI, etc.)
// wires its own typed API clients into these shapes instead of inventing a
// bespoke connectivity/lineage model per widget.

/** Coarse connectivity state for a single upstream service. "pending" = registered in the shared connector list but not yet wired to a live endpoint. */
export type ConnectionState = "online" | "degraded" | "offline" | "pending" | "unknown";

/** A point-in-time snapshot of one service's reachability, as observed by its query hook(s). */
export interface ServiceHealthSnapshot {
  /** Stable service id, e.g. "control-plane", "bucket", "insightflow", "prana". */
  id: string;
  /** Human label for display. */
  label: string;
  state: ConnectionState;
  /** ms since epoch this snapshot was produced. */
  observedAt: number;
  /** Optional round-trip latency, if known. */
  latencyMs?: number | null;
  /** Optional human-readable detail (last error, endpoint, etc). */
  detail?: string | null;
}

/** Aggregate view across every registered service. */
export interface CrossServiceObservability {
  services: ServiceHealthSnapshot[];
  overall: ConnectionState;
  /** Count of services in "offline" or "degraded" state. */
  degradedCount: number;
}

/**
 * Transport-agnostic subscription callback. `RuntimeConnector` invokes this
 * on every successful poll (or, once a streaming transport is attached,
 * every pushed message) — consumers never need to know which transport is
 * active.
 */
export type RuntimeConnectorListener<T> = (payload: T, meta: { traceId?: string; receivedAt: number }) => void;

/**
 * Injectable streaming transport. `RuntimeConnector` falls back to polling
 * when no transport is provided; passing one (e.g. a WebSocket/SSE client)
 * upgrades delivery to push without changing any call site.
 */
export interface RuntimeStreamTransport<T> {
  connect(onMessage: (payload: T, traceId?: string) => void, onError: (err: unknown) => void): void;
  disconnect(): void;
}

export interface RuntimeConnectorOptions<T> {
  id: string;
  /** Polling fetcher — always required as the streaming fallback. */
  poll: () => Promise<T>;
  intervalMs?: number;
  /** Optional push transport; when present, polling pauses while it's connected. */
  transport?: RuntimeStreamTransport<T>;
}

// ─── Execution / Replay / Provenance Lineage ──────────────────────────────────

export type LineageSourceType = "execution" | "replay" | "artifact" | "telemetry" | "audit";

/** One correlated event in a trace's lineage, normalized across registries/services. */
export interface LineageNode {
  sourceType: LineageSourceType;
  id: string;
  label: string;
  timestamp: string;
  status?: string;
  /** Original record, kept for detail rendering — never re-shaped further than this. */
  raw: unknown;
}

export interface TraceLineage {
  traceId: string;
  nodes: LineageNode[];
}
