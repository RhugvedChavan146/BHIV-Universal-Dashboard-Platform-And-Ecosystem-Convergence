import type { LineageNode, LineageSourceType, TraceLineage } from "./types";

/**
 * One typed source an app feeds into `buildTraceLineage`: a list of already-
 * fetched records plus the accessors needed to normalize each into a
 * `LineageNode`. No network calls happen here — this only correlates data
 * the app's typed services already retrieved, so it works identically
 * across products without any product coupling.
 */
export interface LineageSource<TRecord> {
  sourceType: LineageSourceType;
  records: TRecord[];
  getTraceId: (record: TRecord) => string | null | undefined;
  getId: (record: TRecord) => string;
  getLabel: (record: TRecord) => string;
  getTimestamp: (record: TRecord) => string;
  getStatus?: (record: TRecord) => string | undefined;
}

/**
 * Correlates records across an arbitrary set of typed sources (Execution
 * Registry, Replay Registry, Bucket artifacts, InsightFlow events, audit
 * log, ...) that share a `trace_id`, and returns them as one ordered
 * lineage. This is the single place that logic lives — widgets no longer
 * each reimplement their own "find matching record by trace id" heuristic.
 */
export function buildTraceLineage(
  traceId: string,
  sources: LineageSource<any>[]
): TraceLineage {
  const nodes: LineageNode[] = [];

  for (const source of sources) {
    for (const record of source.records) {
      if (source.getTraceId(record) !== traceId) continue;
      nodes.push({
        sourceType: source.sourceType,
        id: source.getId(record),
        label: source.getLabel(record),
        timestamp: source.getTimestamp(record),
        status: source.getStatus?.(record),
        raw: record,
      });
    }
  }

  nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { traceId, nodes };
}

/** Convenience: collect every distinct trace id observed across a set of sources. */
export function collectTraceIds(sources: LineageSource<any>[]): string[] {
  const ids = new Set<string>();
  for (const source of sources) {
    for (const record of source.records) {
      const traceId = source.getTraceId(record);
      if (traceId) ids.add(traceId);
    }
  }
  return Array.from(ids);
}
