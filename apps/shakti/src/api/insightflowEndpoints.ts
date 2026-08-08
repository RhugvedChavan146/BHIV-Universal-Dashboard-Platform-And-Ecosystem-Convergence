import axios, { type AxiosError } from "axios";
import { logger } from "@bhiv/utils";
import type {
  InsightFlowHealthResponse,
  InsightFlowStageMetric,
  InsightFlowBucketStatus,
} from "@/types/insightflow";

const INSIGHTFLOW_BASE_URL =
  import.meta.env.VITE_INSIGHTFLOW_URL || "http://localhost:8000";

export const insightflowClient = axios.create({
  baseURL: INSIGHTFLOW_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Response interceptor to normalize trace headers
insightflowClient.interceptors.response.use(
  (response) => {
    const traceId =
      response.headers?.["x-trace-id"] ||
      response.headers?.["x-execution-id"] ||
      response.headers?.["traceparent"];

    if (traceId && response.data && typeof response.data === "object") {
      (response.data as any).trace_id = traceId;
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "unknown";

    if (status === 404) {
      logger.warn(`InsightFlow endpoint not found: ${url}`);
    } else if (error.code === "ECONNABORTED") {
      logger.error(`InsightFlow request timeout: ${url}`);
    } else if (!error.response) {
      logger.error(`InsightFlow network error — unreachable at ${INSIGHTFLOW_BASE_URL}`);
    }

    return Promise.reject(error);
  }
);

export async function fetchInsightFlowHealth(): Promise<InsightFlowHealthResponse> {
  try {
    const { data } = await insightflowClient.get<InsightFlowHealthResponse>("/health");
    return data;
  } catch (error) {
    logger.error("Failed to fetch InsightFlow health status:", error);
    return {
      status: "OFFLINE",
      uptime_seconds: 0,
      error_count_60s: 0,
    };
  }
}

export async function fetchInsightFlowStageMetrics(): Promise<InsightFlowStageMetric[]> {
  try {
    const { data } = await insightflowClient.get<InsightFlowStageMetric[]>("/stage-metrics");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error("Failed to fetch InsightFlow stage metrics:", error);
    return [];
  }
}

export async function fetchInsightFlowBucketStatus(): Promise<InsightFlowBucketStatus> {
  try {
    const { data } = await insightflowClient.get<InsightFlowBucketStatus>("/bucket/status");
    return {
      sync_percent: data?.sync_percent ?? 0,
      stages_synced: Array.isArray(data?.stages_synced) ? data.stages_synced : [],
      last_sync_utc: data?.last_sync_utc ?? "",
      pending_writes: data?.pending_writes ?? 0,
      failed_writes: data?.failed_writes ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch InsightFlow bucket status:", error);
    return {
      sync_percent: 0,
      stages_synced: [],
      last_sync_utc: "",
      pending_writes: 0,
      failed_writes: 0,
    };
  }
}
