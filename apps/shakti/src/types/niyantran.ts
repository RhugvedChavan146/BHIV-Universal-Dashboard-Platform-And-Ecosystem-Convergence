/**
 * NIYANTRAN Backend Data Transfer Objects (DTOs) and API Response Schemas
 * Directly mapped to NIYANTRAN backend controllers and services.
 */

export interface NiyantranDashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  testerApprovalCount: number;
  totalTasksChange?: number;
  completedTasksChange?: number;
  inProgressTasksChange?: number;
  pendingTasksChange?: number;
}

export interface NiyantranChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface NiyantranTasksOverview {
  statusData: NiyantranChartDataItem[];
  priorityData: NiyantranChartDataItem[];
}

export interface NiyantranDepartmentStat {
  id: string;
  name: string;
  color: string;
  total: number;
  completed: number;
}

export interface NiyantranLeaderboardUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  department?: {
    _id: string;
    name: string;
  } | string;
  avatar?: string;
  completedTasks: number;
  totalTasks: number;
  totalDependencies: number;
  workload: number;
  completionRate: number;
}

export interface NiyantranAttendanceSummaryRecord {
  _id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department?: Record<string, unknown>;
    biometricCode: string;
  };
  date: string;
  attendance: {
    status: string;
    isPresent: boolean;
    workedHours: number;
    verificationMethod?: string;
  };
  times: {
    clockIn: string | null;
    clockOut: string | null;
  };
  merge: {
    case: string;
    remarks: string;
    isWithinTolerance: boolean;
    timeDifferences?: Record<string, unknown>;
    hasAlert: boolean;
    alertType: string | null;
  };
  salary: {
    dailyRate: number;
    hourlyRate: number;
    earnedToday: number;
    currency: string;
    formattedEarnings: string;
  };
}

export interface NiyantranAttendanceSummary {
  success: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
  summary?: {
    totalRecords: number;
    presentCount?: number;
    absentCount?: number;
    totalWorkedHours?: number;
    mismatches?: number;
  };
  records: NiyantranAttendanceSummaryRecord[];
  count: number;
}

export interface NiyantranMergeAnalysis {
  totalRecords: number;
  byMergeCase: Record<string, number>;
  byRemarks: Record<string, number>;
  mismatches: {
    total: number;
    within20min: number;
    beyond20min: number;
  };
  mappingIssues: number;
  timeDifferences?: Record<string, unknown>;
}

export interface NiyantranExecutionSession {
  _id: string;
  executionId: string;
  traceId: string;
  tenantId: string;
  contractHash: string;
  status: string;
  receivedAt: string;
  updatedAt?: string;
}

export interface NiyantranExecutionEvent {
  _id: string;
  eventId: string;
  executionId: string;
  eventType: string;
  eventIndex: number;
  eventTimestamp: string;
  hash: string;
  payload?: Record<string, unknown>;
}

export interface NiyantranTantraExecutionHistory {
  status: string;
  execution_id: string;
  trace_id?: string;
  tenant_id?: string;
  contract_hash?: string;
  session?: NiyantranExecutionSession;
  events?: NiyantranExecutionEvent[];
  lineage?: {
    start_hash: string;
    end_hash: string;
  };
  rejections?: Array<Record<string, unknown>>;
}

export interface NiyantranAim {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  date: string;
  aims: string;
  status?: string;
  progressPercentage?: number;
  targetMetrics?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NiyantranAlert {
  _id: string;
  employee?: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface NiyantranSubmission {
  _id: string;
  task: {
    _id: string;
    title: string;
  } | string;
  user: {
    _id: string;
    name: string;
  } | string;
  submissionNotes?: string;
  attachments?: string[];
  status: string;
  aiEvaluation?: Record<string, unknown>;
  createdAt: string;
}

export interface NiyantranTask {
  _id: string;
  title: string;
  description?: string;
  assignee?: {
    _id: string;
    name: string;
    email?: string;
  } | string;
  department?: {
    _id: string;
    name: string;
  } | string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Completed' | 'In Progress' | 'Pending' | string;
  dependencies?: string[];
  dueDate?: string;
  createdAt?: string;
}

export interface NiyantranLiveLocationUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  department?: {
    _id: string;
    name: string;
    color?: string;
  };
  isPresent: boolean;
  workMode?: string;
  clockInTime?: string | null;
  location?: string;
  aims?: string;
}
