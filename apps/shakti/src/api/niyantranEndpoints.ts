import axios, { type AxiosError } from "axios";
import { logger } from "@bhiv/utils";
import type {
  NiyantranDashboardStats,
  NiyantranTasksOverview,
  NiyantranDepartmentStat,
  NiyantranLeaderboardUser,
  NiyantranAttendanceSummary,
  NiyantranMergeAnalysis,
  NiyantranTantraExecutionHistory,
  NiyantranAim,
  NiyantranAlert,
  NiyantranSubmission,
  NiyantranTask,
  NiyantranLiveLocationUser,
} from "@/types/niyantran";

const NIYANTRAN_BASE_URL =
  import.meta.env.VITE_NIYANTRAN_URL || "http://localhost:5000";

const DEFAULT_EXECUTION_KEY =
  import.meta.env.VITE_NIYANTRAN_EXECUTION_KEY || "niyantran-dev-exec-key";

export const niyantranClient = axios.create({
  baseURL: NIYANTRAN_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to attach authentication & execution keys
niyantranClient.interceptors.request.use(
  (config) => {
    const authToken =
      import.meta.env.VITE_NIYANTRAN_AUTH_TOKEN ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("x-auth-token")
        : null);

    if (authToken) {
      config.headers["x-auth-token"] = authToken;
    }

    if (DEFAULT_EXECUTION_KEY) {
      config.headers["x-execution-key"] = DEFAULT_EXECUTION_KEY;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize trace headers and handle network errors
niyantranClient.interceptors.response.use(
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

    if (status === 401) {
      logger.warn(`Unauthorized NIYANTRAN request to ${url}`);
    } else if (status === 403) {
      logger.warn(`Forbidden NIYANTRAN request to ${url}`);
    } else if (status === 404) {
      logger.warn(`NIYANTRAN endpoint not found: ${url}`);
    } else if (error.code === "ECONNABORTED") {
      logger.error(`NIYANTRAN request timeout: ${url}`);
    } else if (!error.response) {
      logger.error(`NIYANTRAN network error — unreachable at ${NIYANTRAN_BASE_URL}`);
    }

    return Promise.reject(error);
  }
);

// ─── API FETCH FUNCTIONS WITH NORMALIZATION & RESILIENT DEFAULTS ─────────────

/**
 * Fetch core dashboard statistics (task counts, tester approvals)
 */
export async function fetchNiyantranStats(): Promise<NiyantranDashboardStats> {
  try {
    const { data } = await niyantranClient.get<any>("/api/dashboard/stats");
    const payload = data?.data || data || {};
    return {
      totalTasks: payload.totalTasks ?? 0,
      completedTasks: payload.completedTasks ?? 0,
      inProgressTasks: payload.inProgressTasks ?? 0,
      pendingTasks: payload.pendingTasks ?? 0,
      testerApprovalCount: payload.testerApprovalCount ?? 0,
      totalTasksChange: payload.totalTasksChange ?? 0,
      completedTasksChange: payload.completedTasksChange ?? 0,
      inProgressTasksChange: payload.inProgressTasksChange ?? 0,
      pendingTasksChange: payload.pendingTasksChange ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN stats:", error);
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      testerApprovalCount: 0,
    };
  }
}

/**
 * Fetch tasks breakdown by status and priority
 */
export async function fetchNiyantranTasksOverview(): Promise<NiyantranTasksOverview> {
  try {
    const { data } = await niyantranClient.get<any>("/api/dashboard/tasks-overview");
    const payload = data?.data || data || {};
    return {
      statusData: Array.isArray(payload.statusData) ? payload.statusData : [],
      priorityData: Array.isArray(payload.priorityData) ? payload.priorityData : [],
    };
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN tasks overview:", error);
    return { statusData: [], priorityData: [] };
  }
}

/**
 * Fetch department task stats
 */
export async function fetchNiyantranDepartments(): Promise<NiyantranDepartmentStat[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/dashboard/departments");
    const list = Array.isArray(data) ? data : data?.data || data?.departments;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN departments:", error);
    return [];
  }
}

/**
 * Fetch leaderboard stats (engineer completed tasks, workload, completion rates)
 */
export async function fetchNiyantranLeaderboard(): Promise<NiyantranLeaderboardUser[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/dashboard/leaderboard");
    const list = Array.isArray(data) ? data : data?.data || data?.users || data?.leaderboard;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN leaderboard:", error);
    return [];
  }
}

/**
 * Fetch comprehensive attendance summary with worked hours, biometric codes, and merge status
 */
export async function fetchNiyantranAttendanceSummary(params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  status?: string;
}): Promise<NiyantranAttendanceSummary> {
  try {
    const { data } = await niyantranClient.get<any>(
      "/api/dashboard/attendance-summary",
      { params }
    );
    const payload = data || {};
    return {
      ...payload,
      records: Array.isArray(payload?.records) ? payload.records : [],
      count: payload?.count ?? (Array.isArray(payload?.records) ? payload.records.length : 0),
    };
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN attendance summary:", error);
    return { success: false, records: [], count: 0 };
  }
}

/**
 * BUG #1 FIX: Fetch attendance merge analysis & mismatch metrics
 * Unwraps `response.data.analysis` returned by backend
 */
export async function fetchNiyantranMergeAnalysis(params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}): Promise<NiyantranMergeAnalysis> {
  try {
    const { data } = await niyantranClient.get<any>(
      "/api/dashboard/merge-analysis",
      { params }
    );
    const analysis = data?.analysis || data || {};
    return {
      ...analysis,
      totalRecords: analysis?.totalRecords ?? 0,
      byMergeCase: analysis?.byMergeCase ?? {},
      byRemarks: analysis?.byRemarks ?? {},
      mismatches: analysis?.mismatches ?? { total: 0, within20min: 0, beyond20min: 0 },
      mappingIssues: analysis?.mappingIssues ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN merge analysis:", error);
    return {
      totalRecords: 0,
      byMergeCase: {},
      byRemarks: {},
      mismatches: { total: 0, within20min: 0, beyond20min: 0 },
      mappingIssues: 0,
    };
  }
}

/**
 * Fetch Tantra execution history, lineage hashes, events, and rejections
 */
export async function fetchNiyantranExecutionHistory(
  executionId: string
): Promise<NiyantranTantraExecutionHistory> {
  try {
    const { data } = await niyantranClient.get<any>(
      `/api/tantra/execution/${encodeURIComponent(executionId)}/history`
    );
    const payload = data || {};
    return {
      ...payload,
      events: Array.isArray(payload?.events) ? payload.events : [],
      rejections: Array.isArray(payload?.rejections) ? payload.rejections : [],
    };
  } catch (error) {
    logger.error(`Failed to fetch execution history for ${executionId}:`, error);
    return { status: "failed", execution_id: executionId, events: [], rejections: [] };
  }
}

/**
 * BUG #5 FIX: Fetch Universal AIMS (Goals & Progress)
 * Gracefully returns [] if backend returns 403 due to missing auth middleware
 */
export async function fetchNiyantranAims(): Promise<NiyantranAim[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/aims");
    const list = Array.isArray(data) ? data : data?.data || data?.aims;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN aims (Backend 403 / Auth issue):", error);
    return [];
  }
}

/**
 * BUG #4 FIX: Fetch Enhanced AIMS with progress tracking
 * Calls `/api/enhanced-aims/with-progress` and unwraps `data.data`
 */
export async function fetchNiyantranEnhancedAims(): Promise<NiyantranAim[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/enhanced-aims/with-progress");
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list;
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN enhanced aims:", error);
    return [];
  }
}

/**
 * Fetch Monitoring & System Alerts
 */
export async function fetchNiyantranAlerts(): Promise<NiyantranAlert[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/alerts");
    const list = Array.isArray(data) ? data : data?.alerts || data?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN alerts:", error);
    return [];
  }
}

/**
 * BUG #3 FIX: Fetch Task Submissions and Evidence
 * Includes `?page=1&limit=20` and unwraps `response.submissions`
 */
export async function fetchNiyantranSubmissions(): Promise<NiyantranSubmission[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/submissions", {
      params: { page: 1, limit: 20 },
    });
    const list = Array.isArray(data?.submissions)
      ? data.submissions
      : Array.isArray(data)
      ? data
      : [];
    return list;
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN submissions:", error);
    return [];
  }
}

/**
 * BUG #2 FIX: Fetch Task List
 * Includes `?page=1&limit=20` and unwraps `response.tasks`
 */
export async function fetchNiyantranTasks(): Promise<NiyantranTask[]> {
  try {
    const { data } = await niyantranClient.get<any>("/api/tasks", {
      params: { page: 1, limit: 20 },
    });
    const list = Array.isArray(data?.tasks)
      ? data.tasks
      : Array.isArray(data)
      ? data
      : [];
    return list;
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN tasks:", error);
    return [];
  }
}

/**
 * Fetch Live Employee Attendance & Location Status
 */
export async function fetchNiyantranLiveLocations(params?: {
  date?: string;
  department?: string;
}): Promise<NiyantranLiveLocationUser[]> {
  try {
    const { data } = await niyantranClient.get<any>(
      "/api/attendance-dashboard/locations",
      { params }
    );
    const list = Array.isArray(data?.data?.employees)
      ? data.data.employees
      : Array.isArray(data)
      ? data
      : [];
    return list;
  } catch (error) {
    logger.error("Failed to fetch NIYANTRAN live locations:", error);
    return [];
  }
}
