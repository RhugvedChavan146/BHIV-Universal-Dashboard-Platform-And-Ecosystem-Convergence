import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchInsightFlowHealth,
  fetchInsightFlowStageMetrics,
  fetchInsightFlowBucketStatus,
} from "@/api/insightflowEndpoints";

export const useInsightFlowHealth = () =>
  useQuery({
    queryKey: ["insightflow-health"],
    queryFn: fetchInsightFlowHealth,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useInsightFlowStageMetrics = () =>
  useQuery({
    queryKey: ["insightflow-stage-metrics"],
    queryFn: fetchInsightFlowStageMetrics,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useInsightFlowBucketStatus = () =>
  useQuery({
    queryKey: ["insightflow-bucket-status"],
    queryFn: fetchInsightFlowBucketStatus,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });
