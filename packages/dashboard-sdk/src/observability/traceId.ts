// ─── Trace IDs ───────────────────────────────────────────────────────────────
// Trace-id/span-id generation and lightweight parent/child span linking.
// Every BHIV service and this SDK's own `RuntimeConnector` already pass an
// *optional* `traceId: string` around (see `RuntimeConnectorListener` in
// `runtime/types.ts`) — this module is what actually mints one, rather than
// leaving every caller to invent its own id format.
//
// No global/ambient trace context is held here: correlation is explicit,
// passed by the caller, the same "explicit over implicit" style
// `CapabilityRuntime`/`AgentSelector` already use. There is no
// AsyncLocalStorage-style auto-propagation — browser bundles and this SDK's
// isomorphic build target don't reliably support it, and an explicit
// `TraceContext` value is easier to unit test and to pass across a
// `RuntimeConnector` boundary anyway.

import type { TraceContext } from "./types";

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Mints a new random trace id. Uses `crypto.randomUUID` when available (browsers, modern Node), falling back to a dash-joined random id otherwise. */
export function createTraceId(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoObj?.randomUUID === "function") return cryptoObj.randomUUID();
  return `${randomSegment()}-${randomSegment()}-${randomSegment()}`;
}

/** Mints a new span id — shorter than a trace id, since spans are scoped to one trace. */
export function createSpanId(): string {
  return randomSegment();
}

/** Loose sanity check that `value` looks like an id this module could have minted (a UUID or the dash-joined fallback format) — not a cryptographic guarantee, and not a check against any specific trace registry. */
export function isTraceId(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  return /^[0-9a-f-]{8,}$/i.test(value);
}

/** Starts a new root trace context (a fresh trace id and its first span). */
export function createTraceContext(): TraceContext {
  return { traceId: createTraceId(), spanId: createSpanId() };
}

/** Derives a child span within the same trace, linking back to `parent.spanId`. */
export function createChildTraceContext(parent: TraceContext): TraceContext {
  return { traceId: parent.traceId, spanId: createSpanId(), parentSpanId: parent.spanId };
}
