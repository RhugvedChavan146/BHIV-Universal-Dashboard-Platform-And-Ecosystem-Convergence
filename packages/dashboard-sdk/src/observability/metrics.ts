// ─── Metrics ─────────────────────────────────────────────────────────────────
// In-memory counters/gauges/histograms — the fourth observability primitive
// alongside Structured Logs, Evidence, and Health Reporting. Framework-
// agnostic, no network, no wiring into any existing engine: an engine that
// wants to record metrics creates its own `MetricsRegistry` instance and
// calls into it, the same explicit-instance style `AgentSelector`/
// `CapabilityRuntime` already use.

import type { MetricSample, MetricsSnapshot, MetricType } from "./types";

interface CounterState {
  type: "counter";
  value: number;
  tags?: Record<string, string>;
  updatedAt: number;
}

interface GaugeState {
  type: "gauge";
  value: number;
  tags?: Record<string, string>;
  updatedAt: number;
}

interface HistogramState {
  type: "histogram";
  count: number;
  sum: number;
  min: number;
  max: number;
  tags?: Record<string, string>;
  updatedAt: number;
}

type MetricState = CounterState | GaugeState | HistogramState;

export class MetricsRegistry {
  private metrics = new Map<string, MetricState>();

  /** Increments (or creates) a counter. `delta` may be any positive number; counters here don't enforce integer-only or monotonic-only, unlike some metrics backends — see the Metrics section of `/OBSERVABILITY.md`. */
  public incrementCounter(name: string, delta = 1, tags?: Record<string, string>): void {
    const existing = this.metrics.get(name);
    const value = (existing?.type === "counter" ? existing.value : 0) + delta;
    this.metrics.set(name, { type: "counter", value, tags, updatedAt: Date.now() });
  }

  /** Sets a gauge to an absolute value, replacing whatever was there before. */
  public setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.set(name, { type: "gauge", value, tags, updatedAt: Date.now() });
  }

  /** Records one observation into a histogram, updating its running count/sum/min/max. */
  public recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const existing = this.metrics.get(name);
    const prior = existing?.type === "histogram" ? existing : undefined;
    this.metrics.set(name, {
      type: "histogram",
      count: (prior?.count ?? 0) + 1,
      sum: (prior?.sum ?? 0) + value,
      min: prior ? Math.min(prior.min, value) : value,
      max: prior ? Math.max(prior.max, value) : value,
      tags,
      updatedAt: Date.now(),
    });
  }

  /** Current value of a single metric, or `undefined` if it has never been recorded. */
  public get(name: string): MetricSample | undefined {
    const state = this.metrics.get(name);
    if (!state) return undefined;
    return this.toSample(name, state);
  }

  /** Every currently-tracked metric, as a point-in-time snapshot. */
  public getSnapshot(): MetricsSnapshot {
    const metrics: MetricSample[] = Array.from(this.metrics.entries()).map(([name, state]) =>
      this.toSample(name, state),
    );
    return { observedAt: Date.now(), metrics };
  }

  public reset(): void {
    this.metrics.clear();
  }

  private toSample(name: string, state: MetricState): MetricSample {
    if (state.type === "histogram") {
      return {
        name,
        type: "histogram" as MetricType,
        value: state.sum,
        histogram: { count: state.count, sum: state.sum, min: state.min, max: state.max },
        tags: state.tags,
        updatedAt: state.updatedAt,
      };
    }
    return { name, type: state.type, value: state.value, tags: state.tags, updatedAt: state.updatedAt };
  }
}

export function createMetricsRegistry(): MetricsRegistry {
  return new MetricsRegistry();
}
