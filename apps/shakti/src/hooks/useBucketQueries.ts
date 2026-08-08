import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchBucketArtifacts,
  fetchBucketStorageStats,
  fetchBucketChainState,
  fetchBucketHealth,
  fetchAuditRecent,
  fetchAuditFailed,
  fetchMetricsScaleStatus,
  fetchMetricsQueryPerformance,
  fetchMetricsAlerts,
  fetchConstitutionalStatus,
} from "@/api/bucketEndpoints";

export const useBucketArtifacts = (limit = 50, offset = 0, trace_id?: string) =>
  useQuery({
    queryKey: ["bucket-artifacts", limit, offset, trace_id],
    queryFn: () => fetchBucketArtifacts(limit, offset, trace_id),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useBucketStorageStats = () =>
  useQuery({
    queryKey: ["bucket-storage-stats"],
    queryFn: fetchBucketStorageStats,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });

export const useBucketChainState = () =>
  useQuery({
    queryKey: ["bucket-chain-state"],
    queryFn: fetchBucketChainState,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useBucketHealth = () =>
  useQuery({
    queryKey: ["bucket-health"],
    queryFn: fetchBucketHealth,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useAuditRecent = (limit = 20) =>
  useQuery({
    queryKey: ["audit-recent", limit],
    queryFn: () => fetchAuditRecent(limit),
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });

export const useAuditFailed = (limit = 20) =>
  useQuery({
    queryKey: ["audit-failed", limit],
    queryFn: () => fetchAuditFailed(limit),
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });

export const useMetricsScaleStatus = () =>
  useQuery({
    queryKey: ["metrics-scale-status"],
    queryFn: fetchMetricsScaleStatus,
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });

export const useMetricsQueryPerformance = () =>
  useQuery({
    queryKey: ["metrics-query-performance"],
    queryFn: fetchMetricsQueryPerformance,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useMetricsAlerts = () =>
  useQuery({
    queryKey: ["metrics-alerts"],
    queryFn: fetchMetricsAlerts,
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });

export const useConstitutionalStatus = () =>
  useQuery({
    queryKey: ["constitutional-status"],
    queryFn: fetchConstitutionalStatus,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
