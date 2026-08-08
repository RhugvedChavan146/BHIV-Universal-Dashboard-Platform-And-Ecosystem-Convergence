import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchNiyantranStats,
  fetchNiyantranTasksOverview,
  fetchNiyantranDepartments,
  fetchNiyantranLeaderboard,
  fetchNiyantranAttendanceSummary,
  fetchNiyantranMergeAnalysis,
  fetchNiyantranExecutionHistory,
  fetchNiyantranAims,
  fetchNiyantranEnhancedAims,
  fetchNiyantranAlerts,
  fetchNiyantranSubmissions,
  fetchNiyantranTasks,
  fetchNiyantranLiveLocations,
} from "@/api/niyantranEndpoints";

export const useNiyantranStats = () =>
  useQuery({
    queryKey: ["niyantran-stats"],
    queryFn: fetchNiyantranStats,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranTasksOverview = () =>
  useQuery({
    queryKey: ["niyantran-tasks-overview"],
    queryFn: fetchNiyantranTasksOverview,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranDepartments = () =>
  useQuery({
    queryKey: ["niyantran-departments"],
    queryFn: fetchNiyantranDepartments,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranLeaderboard = () =>
  useQuery({
    queryKey: ["niyantran-leaderboard"],
    queryFn: fetchNiyantranLeaderboard,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranAttendanceSummary = (params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  status?: string;
}) =>
  useQuery({
    queryKey: ["niyantran-attendance-summary", params],
    queryFn: () => fetchNiyantranAttendanceSummary(params),
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranMergeAnalysis = (params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}) =>
  useQuery({
    queryKey: ["niyantran-merge-analysis", params],
    queryFn: () => fetchNiyantranMergeAnalysis(params),
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranExecutionHistory = (executionId?: string) =>
  useQuery({
    queryKey: ["niyantran-execution-history", executionId],
    queryFn: () => fetchNiyantranExecutionHistory(executionId!),
    enabled: Boolean(executionId),
    refetchInterval: 5_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranAims = () =>
  useQuery({
    queryKey: ["niyantran-aims"],
    queryFn: fetchNiyantranAims,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranEnhancedAims = () =>
  useQuery({
    queryKey: ["niyantran-enhanced-aims"],
    queryFn: fetchNiyantranEnhancedAims,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranAlerts = () =>
  useQuery({
    queryKey: ["niyantran-alerts"],
    queryFn: fetchNiyantranAlerts,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranSubmissions = () =>
  useQuery({
    queryKey: ["niyantran-submissions"],
    queryFn: fetchNiyantranSubmissions,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranTasks = () =>
  useQuery({
    queryKey: ["niyantran-tasks"],
    queryFn: fetchNiyantranTasks,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useNiyantranLiveLocations = (params?: {
  date?: string;
  department?: string;
}) =>
  useQuery({
    queryKey: ["niyantran-live-locations", params],
    queryFn: () => fetchNiyantranLiveLocations(params),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
