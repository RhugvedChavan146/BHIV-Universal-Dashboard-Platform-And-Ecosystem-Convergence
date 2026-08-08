import { describe, expect, it } from "vitest";
import { buildReplayMetadata, mapTraceLineageToReplayMetadata, ReplayLog } from "../replay";
import type { TraceLineage } from "../../runtime/types";

describe("buildReplayMetadata", () => {
  it("builds a record with a minted id and current timestamp by default", () => {
    const record = buildReplayMetadata({
      traceId: "trace-1",
      determinism: "deterministic",
      inputsSnapshot: { a: 1 },
      outcomeSnapshot: { b: 2 },
    });
    expect(record.id.length).toBeGreaterThan(0);
    expect(record.traceId).toBe("trace-1");
    expect(() => new Date(record.recordedAt).toISOString()).not.toThrow();
  });

  it("honors an explicit id/timestamp/evidenceId when supplied", () => {
    const record = buildReplayMetadata({
      id: "fixed-id",
      traceId: "trace-1",
      evidenceId: "evidence-1",
      determinism: "best-effort",
      inputsSnapshot: {},
      outcomeSnapshot: {},
      recordedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(record.id).toBe("fixed-id");
    expect(record.evidenceId).toBe("evidence-1");
    expect(record.recordedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("never mutates the passed-in snapshots and is JSON-serializable", () => {
    const inputs = { a: 1 };
    const record = buildReplayMetadata({ traceId: "t", determinism: "deterministic", inputsSnapshot: inputs, outcomeSnapshot: {} });
    expect(record.inputsSnapshot).toBe(inputs);
    expect(() => JSON.stringify(record)).not.toThrow();
  });
});

describe("ReplayLog", () => {
  it("records and lists entries in insertion order, and filters by trace id", () => {
    const log = new ReplayLog();
    log.record(buildReplayMetadata({ traceId: "t1", determinism: "deterministic", inputsSnapshot: {}, outcomeSnapshot: {} }));
    log.record(buildReplayMetadata({ traceId: "t2", determinism: "deterministic", inputsSnapshot: {}, outcomeSnapshot: {} }));
    expect(log.getAll()).toHaveLength(2);
    expect(log.getByTraceId("t1")).toHaveLength(1);
  });

  it("evicts the oldest record once capacity is exceeded", () => {
    const log = new ReplayLog(1);
    log.record(buildReplayMetadata({ traceId: "t1", determinism: "deterministic", inputsSnapshot: {}, outcomeSnapshot: {} }));
    log.record(buildReplayMetadata({ traceId: "t2", determinism: "deterministic", inputsSnapshot: {}, outcomeSnapshot: {} }));
    expect(log.getAll().map((r) => r.traceId)).toEqual(["t2"]);
  });

  it("clears on demand", () => {
    const log = new ReplayLog();
    log.record(buildReplayMetadata({ traceId: "t1", determinism: "deterministic", inputsSnapshot: {}, outcomeSnapshot: {} }));
    log.clear();
    expect(log.getAll()).toEqual([]);
  });
});

describe("mapTraceLineageToReplayMetadata", () => {
  const lineage: TraceLineage = {
    traceId: "trace-1",
    nodes: [
      { sourceType: "execution", id: "exec-1", label: "Run", timestamp: "2026-01-01T00:00:00.000Z", status: "completed", raw: { x: 1 } },
      { sourceType: "replay", id: "replay-1", label: "Replay", timestamp: "2026-01-01T00:01:00.000Z", raw: { y: 2 } },
    ],
  };

  it("maps one ReplayMetadata entry per lineage node, sharing the trace id", () => {
    const entries = mapTraceLineageToReplayMetadata(lineage);
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.traceId === "trace-1")).toBe(true);
  });

  it("defaults determinism to best-effort, and honors an override", () => {
    expect(mapTraceLineageToReplayMetadata(lineage)[0].determinism).toBe("best-effort");
    expect(mapTraceLineageToReplayMetadata(lineage, "deterministic")[0].determinism).toBe("deterministic");
  });

  it("falls back to 'unknown' status in the outcome snapshot when a node has none", () => {
    const entries = mapTraceLineageToReplayMetadata(lineage);
    expect(entries[1].outcomeSnapshot.status).toBe("unknown");
    expect(entries[0].outcomeSnapshot.status).toBe("completed");
  });

  it("carries each node's raw record into the inputs snapshot unchanged", () => {
    const entries = mapTraceLineageToReplayMetadata(lineage);
    expect(entries[0].inputsSnapshot.raw).toEqual({ x: 1 });
  });
});
