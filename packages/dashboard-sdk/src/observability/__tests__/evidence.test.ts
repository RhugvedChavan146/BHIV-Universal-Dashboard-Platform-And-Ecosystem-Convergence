import { describe, expect, it } from "vitest";
import { buildEvidenceRecord, EvidenceLog, mapCompositionReportToEvidence } from "../evidence";
import type { CompositionValidationReport } from "../../registry/AgentSelector";

describe("buildEvidenceRecord", () => {
  it("builds a record with a minted id and current timestamp by default", () => {
    const record = buildEvidenceRecord({
      kind: "decision",
      source: "TestEngine",
      product: "shakti",
      summary: "did a thing",
      facts: { foo: "bar" },
    });
    expect(record.id.length).toBeGreaterThan(0);
    expect(() => new Date(record.recordedAt).toISOString()).not.toThrow();
    expect(record.summary).toBe("did a thing");
    expect(record.facts).toEqual({ foo: "bar" });
  });

  it("honors an explicit id/timestamp when supplied", () => {
    const record = buildEvidenceRecord({
      kind: "decision",
      source: "TestEngine",
      product: "shakti",
      summary: "x",
      facts: {},
      id: "fixed-id",
      recordedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(record.id).toBe("fixed-id");
    expect(record.recordedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("is JSON-serializable", () => {
    const record = buildEvidenceRecord({ kind: "custom", source: "x", product: "shakti", summary: "s", facts: { a: 1 } });
    expect(() => JSON.stringify(record)).not.toThrow();
  });
});

describe("EvidenceLog", () => {
  it("records and lists entries in insertion order", () => {
    const log = new EvidenceLog();
    const a = buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "a", facts: {} });
    const b = buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "b", facts: {} });
    log.record(a);
    log.record(b);
    expect(log.getAll().map((r) => r.summary)).toEqual(["a", "b"]);
  });

  it("filters by trace id", () => {
    const log = new EvidenceLog();
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "a", facts: {}, traceId: "t1" }));
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "b", facts: {}, traceId: "t2" }));
    expect(log.getByTraceId("t1").map((r) => r.summary)).toEqual(["a"]);
  });

  it("evicts the oldest record once capacity is exceeded", () => {
    const log = new EvidenceLog(2);
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "1", facts: {} }));
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "2", facts: {} }));
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "3", facts: {} }));
    expect(log.getAll().map((r) => r.summary)).toEqual(["2", "3"]);
  });

  it("clears on demand", () => {
    const log = new EvidenceLog();
    log.record(buildEvidenceRecord({ kind: "decision", source: "x", product: "shakti", summary: "a", facts: {} }));
    log.clear();
    expect(log.getAll()).toEqual([]);
  });
});

describe("mapCompositionReportToEvidence", () => {
  const validReport: CompositionValidationReport = {
    product: "shakti",
    layoutId: "command-center",
    valid: true,
    zoneCount: 2,
    resolvedCount: 2,
    issues: [],
  };

  const invalidReport: CompositionValidationReport = {
    product: "shakti",
    layoutId: "command-center",
    valid: false,
    zoneCount: 2,
    resolvedCount: 1,
    issues: [{ zoneKey: "ghost-widget", code: "unresolved-widget", message: "missing" }],
  };

  it("summarizes a valid composition without inventing new facts", () => {
    const evidence = mapCompositionReportToEvidence(validReport);
    expect(evidence.summary).toContain("valid");
    expect(evidence.facts).toEqual({
      layoutId: "command-center",
      valid: true,
      zoneCount: 2,
      resolvedCount: 2,
      issues: [],
    });
  });

  it("summarizes an invalid composition, carrying its issues through unchanged", () => {
    const evidence = mapCompositionReportToEvidence(invalidReport);
    expect(evidence.summary).toContain("1 issue");
    expect(evidence.facts.issues).toBe(invalidReport.issues);
  });

  it("defaults source and passes traceId through when given", () => {
    const evidence = mapCompositionReportToEvidence(invalidReport, undefined, "trace-42");
    expect(evidence.source).toBe("AgentSelector.validateComposition");
    expect(evidence.traceId).toBe("trace-42");
  });

  it("honors an explicit source override", () => {
    const evidence = mapCompositionReportToEvidence(invalidReport, "CustomCaller");
    expect(evidence.source).toBe("CustomCaller");
  });
});
