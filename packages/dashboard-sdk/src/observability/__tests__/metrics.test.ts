import { describe, expect, it } from "vitest";
import { createMetricsRegistry } from "../metrics";

describe("MetricsRegistry counters", () => {
  it("starts a counter at the increment amount and accumulates across calls", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("widgets.resolved");
    metrics.incrementCounter("widgets.resolved");
    metrics.incrementCounter("widgets.resolved", 3);
    expect(metrics.get("widgets.resolved")?.value).toBe(5);
  });

  it("defaults the increment delta to 1", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("hits");
    expect(metrics.get("hits")?.value).toBe(1);
  });

  it("carries tags through to the sample", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("requests", 1, { product: "shakti" });
    expect(metrics.get("requests")?.tags).toEqual({ product: "shakti" });
  });
});

describe("MetricsRegistry gauges", () => {
  it("replaces the value on each set rather than accumulating", () => {
    const metrics = createMetricsRegistry();
    metrics.setGauge("active-widgets", 3);
    metrics.setGauge("active-widgets", 7);
    expect(metrics.get("active-widgets")?.value).toBe(7);
  });
});

describe("MetricsRegistry histograms", () => {
  it("tracks count/sum/min/max across observations", () => {
    const metrics = createMetricsRegistry();
    metrics.recordHistogram("resolve-ms", 10);
    metrics.recordHistogram("resolve-ms", 30);
    metrics.recordHistogram("resolve-ms", 20);
    const sample = metrics.get("resolve-ms");
    expect(sample?.histogram).toEqual({ count: 3, sum: 60, min: 10, max: 30 });
    expect(sample?.value).toBe(60); // value mirrors the running sum
  });
});

describe("MetricsRegistry.getSnapshot", () => {
  it("returns every tracked metric with a top-level observedAt", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("a");
    metrics.setGauge("b", 1);
    metrics.recordHistogram("c", 5);
    const snapshot = metrics.getSnapshot();
    expect(snapshot.metrics.map((m) => m.name).sort()).toEqual(["a", "b", "c"]);
    expect(typeof snapshot.observedAt).toBe("number");
  });

  it("is JSON-serializable", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("a");
    expect(() => JSON.stringify(metrics.getSnapshot())).not.toThrow();
  });

  it("returns undefined for a metric that was never recorded", () => {
    expect(createMetricsRegistry().get("nope")).toBeUndefined();
  });
});

describe("MetricsRegistry.reset", () => {
  it("clears every tracked metric", () => {
    const metrics = createMetricsRegistry();
    metrics.incrementCounter("a");
    metrics.reset();
    expect(metrics.getSnapshot().metrics).toEqual([]);
  });
});
