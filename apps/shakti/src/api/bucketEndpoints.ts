import axios from "axios";
import type {
  BucketArtifactsResponse,
  BucketStorageStatsResponse,
  BucketChainStateResponse,
  BucketHealthResponse,
  AuditRecentResponse,
  MetricsScaleStatusResponse,
  MetricsQueryPerformanceResponse,
  MetricsAlertsResponse,
  ConstitutionalStatusResponse,
} from "@/types/bucket";

const BUCKET_BASE_URL =
  import.meta.env.VITE_BUCKET_SERVICE_URL ?? import.meta.env.VITE_BUCKET_URL ?? "";

export const bucketClient = axios.create({
  baseURL: BUCKET_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export async function fetchBucketArtifacts(limit = 50, offset = 0, trace_id?: string): Promise<BucketArtifactsResponse> {
  const params: Record<string, any> = { limit, offset };
  if (trace_id) params.trace_id = trace_id;
  const { data } = await bucketClient.get<BucketArtifactsResponse>("/bucket/artifacts", { params });
  return {
    ...data,
    artifacts: data?.artifacts ?? [],
  };
}

export async function fetchBucketStorageStats(): Promise<BucketStorageStatsResponse> {
  const { data } = await bucketClient.get<BucketStorageStatsResponse>("/bucket/storage-stats");
  return data;
}

export async function fetchBucketChainState(): Promise<BucketChainStateResponse> {
  const { data } = await bucketClient.get<BucketChainStateResponse>("/bucket/chain-state");
  return data;
}

export async function fetchBucketHealth(): Promise<BucketHealthResponse> {
  const { data } = await bucketClient.get<BucketHealthResponse>("/health");
  return data;
}

export async function fetchAuditRecent(limit = 20): Promise<AuditRecentResponse> {
  const { data } = await bucketClient.get<AuditRecentResponse>("/audit/recent", { params: { limit } });
  return {
    ...data,
    operations: data?.operations ?? [],
  };
}

export async function fetchAuditFailed(limit = 20): Promise<AuditRecentResponse> {
  const { data } = await bucketClient.get<AuditRecentResponse>("/audit/failed", { params: { limit } });
  return {
    ...data,
    operations: data?.operations ?? [],
  };
}

export async function fetchMetricsScaleStatus(): Promise<MetricsScaleStatusResponse> {
  const { data } = await bucketClient.get<MetricsScaleStatusResponse>("/metrics/scale-status");
  return data;
}

export async function fetchMetricsQueryPerformance(): Promise<MetricsQueryPerformanceResponse> {
  const { data } = await bucketClient.get<MetricsQueryPerformanceResponse>("/metrics/query-performance");
  return data;
}

export async function fetchMetricsAlerts(): Promise<MetricsAlertsResponse> {
  const { data } = await bucketClient.get<MetricsAlertsResponse>("/metrics/alerts");
  return {
    ...data,
    alerts: Array.isArray(data?.alerts) ? data.alerts : [],
  };
}

export async function fetchConstitutionalStatus(): Promise<ConstitutionalStatusResponse> {
  const { data } = await bucketClient.get<ConstitutionalStatusResponse>("/constitutional/status");
  return data;
}
