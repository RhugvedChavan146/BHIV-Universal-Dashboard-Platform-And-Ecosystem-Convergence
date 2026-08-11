import type { LineageNode, LineageSourceType, TraceLineage } from "./types";

export interface LineageSource<TRecord> {
  sourceType: LineageSourceType;
  records: TRecord[];
  getTraceId: (record: TRecord) => string | null | undefined;
  getId: (record: TRecord) => string;
  getLabel: (record: TRecord) => string;
  getTimestamp: (record: TRecord) => string;
  getStatus?: (record: TRecord) => string | undefined;
}

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
