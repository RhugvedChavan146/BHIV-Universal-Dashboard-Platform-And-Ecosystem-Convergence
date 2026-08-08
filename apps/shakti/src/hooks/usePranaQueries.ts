import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchPranaHealth,
  fetchPranaSystemHealth,
  fetchPranaPropagationLog,
} from "@/api/pranaEndpoints";

export const usePranaHealth = () =>
  useQuery({
    queryKey: ["prana-health"],
    queryFn: fetchPranaHealth,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const usePranaSystemHealth = () =>
  useQuery({
    queryKey: ["prana-system-health"],
    queryFn: fetchPranaSystemHealth,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const usePranaPropagationLog = (limit = 50) =>
  useQuery({
    queryKey: ["prana-propagation-log", limit],
    queryFn: () => fetchPranaPropagationLog(limit),
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
  });
