import { describe, expect, it } from "vitest";
import { computeHealthReport, createHealthReporter } from "../health";
import type { ServiceHealthSnapshot } from "../../runtime/types";

function snapshot(overrides: Partial<ServiceHealthSnapshot> = {}): ServiceHealthSnapshot {
  return { id: "control-plane", label: "Control Plane", state: "online", observedAt: Date.now(), ...overrides };
}

describe("computeHealthReport", () => {
  it("is 'unknown' overall with zero samples", () => {
    const report = computeHealthReport([]);
    expect(report.overall).toBe("unknown");
    expect(report.degradedCount).toBe(0);
    expect(report.attention).toEqual([]);
  });

  it("is 'online' only when every sample is online", () => {
    const report = computeHealthReport([snapshot({ id: "a" }), snapshot({ id: "b" })]);
    expect(report.overall).toBe("online");
  });

  it("is 'degraded' when any sample is degraded and none are offline", () => {
    const report = computeHealthReport([snapshot({ id: "a" }), snapshot({ id: "b", state: "degraded" })]);
    expect(report.overall).toBe("degraded");
  });

  it("is 'offline' when any sample is offline, even if others are online", () => {
    const report = computeHealthReport([
      snapshot({ id: "a", state: "offline" }),
      snapshot({ id: "b", state: "degraded" }),
      snapshot({ id: "c", state: "online" }),
    ]);
    expect(report.overall).toBe("offline");
  });

  it("counts degraded+offline samples and lists them in attention, worst state first", () => {
    const report = computeHealthReport([
      snapshot({ id: "a", state: "online" }),
      snapshot({ id: "b", state: "degraded" }),
      snapshot({ id: "c", state: "offline" }),
    ]);
    expect(report.degradedCount).toBe(2);
    expect(report.attention).toEqual(["c", "b"]);
  });

  it("treats 'pending' and 'unknown' samples as not-offline/not-degraded but also not fully online", () => {
    const report = computeHealthReport([snapshot({ id: "a", state: "pending" })]);
    expect(report.overall).toBe("unknown");
    expect(report.degradedCount).toBe(0);
  });

  it("never mutates the input array", () => {
    const samples = [snapshot({ id: "a" })];
    computeHealthReport(samples);
    expect(samples).toHaveLength(1);
  });
});

describe("HealthReporter", () => {
  it("aggregates every reported snapshot via computeHealthReport", () => {
    const reporter = createHealthReporter();
    reporter.report(snapshot({ id: "a", state: "online" }));
    reporter.report(snapshot({ id: "b", state: "offline" }));
    expect(reporter.getReport().overall).toBe("offline");
  });

  it("overwrites a service's prior snapshot by id rather than accumulating duplicates", () => {
    const reporter = createHealthReporter();
    reporter.report(snapshot({ id: "a", state: "offline" }));
    reporter.report(snapshot({ id: "a", state: "online" }));
    const report = reporter.getReport();
    expect(report.samples).toHaveLength(1);
    expect(report.overall).toBe("online");
  });

  it("notifies subscribers with the updated report on every report() call", () => {
    const reporter = createHealthReporter();
    const seen: string[] = [];
    reporter.subscribe((report) => seen.push(report.overall));
    reporter.report(snapshot({ id: "a", state: "online" }));
    reporter.report(snapshot({ id: "b", state: "degraded" }));
    expect(seen).toEqual(["online", "degraded"]);
  });

  it("stops notifying after unsubscribe", () => {
    const reporter = createHealthReporter();
    let calls = 0;
    const unsubscribe = reporter.subscribe(() => {
      calls += 1;
    });
    reporter.report(snapshot());
    unsubscribe();
    reporter.report(snapshot({ state: "offline" }));
    expect(calls).toBe(1);
  });
});
