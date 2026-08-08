// ─── Observability ─────────────────────────────────────────────────────────
// Public barrel for the six observability primitives: Structured Logs
// (`logger.ts`), Trace IDs (`traceId.ts`), Evidence (`evidence.ts`), Replay
// Metadata (`replay.ts`), Health Reporting (`health.ts`), and Metrics
// (`metrics.ts`). See `/OBSERVABILITY.md` for the Logging Standard, Evidence
// Schema, Replay Schema, and Health Model these implement.
//
// Every primitive here is in-memory, framework-agnostic, and additive: no
// network I/O anywhere in this folder, no existing engine's behavior is
// modified, and nothing here executes runtime/workflows. Re-exported once
// from the SDK's public surface (`index.ts`'s `export * from "./observability"`).

export * from "./types";
export * from "./logger";
export * from "./traceId";
export * from "./evidence";
export * from "./replay";
export * from "./health";
export * from "./metrics";
