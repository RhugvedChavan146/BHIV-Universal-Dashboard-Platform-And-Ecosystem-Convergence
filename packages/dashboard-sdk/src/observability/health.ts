// ─── Health Reporting ────────────────────────────────────────────────────────
// Implements the Health Model documented in `/OBSERVABILITY.md` as a pure,
// framework-agnostic function plus a small in-memory reporter class.
//
// `ServiceObservabilityProvider` (`runtime/ServiceObservability.tsx`)
// already aggregates service snapshots for React trees — `computeHealthReport`
// below is that same worst-state-wins aggregation, extracted as a
// standalone, unit-testable function (with one addition: an `attention`
// list of degraded/offline ids, worst state first) so non-React callers
// (CLIs, Node-side tooling, tests) get the identical Health Model without
// mounting a provider. `ServiceObservability.tsx` itself is unchanged —
// both it and this module build on the same `ConnectionState`/
// `ServiceHealthSnapshot` shapes from `runtime/types.ts`, neither redefines
// the other, and neither imports the other.

import type { ConnectionState, ServiceHealthSnapshot } from "../runtime/types";
import type { HealthReport } from "./types";

const SEVERITY: Record<ConnectionState, number> = {
  offline: 3,
  degraded: 2,
  unknown: 1,
  pending: 1,
  online: 0,
};

/**
 * Aggregates a set of service snapshots into one `HealthReport` using
 * worst-state-wins: any `"offline"` sample makes the overall state offline;
 * otherwise any `"degraded"` sample makes it degraded; `"online"` only if
 * every sample is online; empty input is `"unknown"`. Pure — no I/O, and
 * (like `ServiceObservabilityProvider`) never infers a state a caller
 * didn't report.
 */
export function computeHealthReport(samples: ServiceHealthSnapshot[]): HealthReport {
  let overall: ConnectionState = "unknown";
  if (samples.length > 0) {
    if (samples.some((sample) => sample.state === "offline")) overall = "offline";
    else if (samples.some((sample) => sample.state === "degraded")) overall = "degraded";
    else if (samples.every((sample) => sample.state === "online")) overall = "online";
  }

  const degraded = samples.filter((sample) => sample.state === "degraded" || sample.state === "offline");
  const attention = [...degraded]
    .sort((a, b) => SEVERITY[b.state] - SEVERITY[a.state])
    .map((sample) => sample.id);

  return { samples: [...samples], overall, degradedCount: degraded.length, attention };
}

/**
 * Small in-memory, framework-agnostic health reporter — the non-React
 * counterpart to `useReportServiceHealth`/`useServiceObservability`. Useful
 * from Node tooling, CLIs, or tests that want the same worst-state-wins
 * aggregation without mounting a `ServiceObservabilityProvider`.
 */
export class HealthReporter {
  private states = new Map<string, ServiceHealthSnapshot>();
  private listeners = new Set<(report: HealthReport) => void>();

  public report(snapshot: ServiceHealthSnapshot): void {
    this.states.set(snapshot.id, snapshot);
    const report = this.getReport();
    this.listeners.forEach((listener) => listener(report));
  }

  public getReport(): HealthReport {
    return computeHealthReport(Array.from(this.states.values()));
  }

  public subscribe(listener: (report: HealthReport) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createHealthReporter(): HealthReporter {
  return new HealthReporter();
}
