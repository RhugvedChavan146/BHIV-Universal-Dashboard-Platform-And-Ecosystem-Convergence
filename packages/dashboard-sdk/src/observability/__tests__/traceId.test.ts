import { describe, expect, it } from "vitest";
import { createChildTraceContext, createSpanId, createTraceContext, createTraceId, isTraceId } from "../traceId";

describe("trace ids", () => {
  it("mints non-empty, distinct trace ids", () => {
    const a = createTraceId();
    const b = createTraceId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("mints span ids shorter than a full trace id", () => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    expect(spanId.length).toBeLessThan(traceId.length);
  });

  it("recognizes ids it mints as valid via isTraceId", () => {
    expect(isTraceId(createTraceId())).toBe(true);
    expect(isTraceId(createSpanId())).toBe(true);
  });

  it("rejects obviously invalid values", () => {
    expect(isTraceId("")).toBe(false);
    expect(isTraceId("not a trace id!!")).toBe(false);
    expect(isTraceId(42)).toBe(false);
    expect(isTraceId(undefined)).toBe(false);
    expect(isTraceId(null)).toBe(false);
  });

  it("creates a root trace context with a fresh trace id and no parent span", () => {
    const ctx = createTraceContext();
    expect(ctx.traceId.length).toBeGreaterThan(0);
    expect(ctx.spanId.length).toBeGreaterThan(0);
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it("derives a child span sharing the parent's trace id and pointing at the parent span", () => {
    const root = createTraceContext();
    const child = createChildTraceContext(root);
    expect(child.traceId).toBe(root.traceId);
    expect(child.parentSpanId).toBe(root.spanId);
    expect(child.spanId).not.toBe(root.spanId);
  });

  it("supports multi-level nesting", () => {
    const root = createTraceContext();
    const child = createChildTraceContext(root);
    const grandchild = createChildTraceContext(child);
    expect(grandchild.traceId).toBe(root.traceId);
    expect(grandchild.parentSpanId).toBe(child.spanId);
  });
});
