export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type OperationalStatus = "online" | "offline" | "warning" | "degraded";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";
export type ReplayState = "idle" | "running" | "paused" | "completed" | "failed";
export type TrendDirection = "up" | "down" | "stable";

export interface ExecutiveMetric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  trend: TrendDirection;
  trendValue: string;
  status: OperationalStatus;
  icon: string;
}

export interface KPI {
  id: string;
  title: string;
  value: number;
  unit: string;
  trend: TrendDirection;
  trendValue: string;
  previousValue: number;
}

export interface Alert {
  id: string;
  severity: Severity;
  message: string;
  timestamp: string;
  source: string;
  region: string;
  acknowledged: boolean;
}

export interface GridRegion {
  id: string;
  name: string;
  status: OperationalStatus;
  load: number;
  capacity: number;
  frequency: number;
}

export interface GridStatus {
  overallStatus: OperationalStatus;
  totalLoad: number;
  totalCapacity: number;
  frequency: number;
  regions: GridRegion[];
  lastUpdated: string;
}

export interface RiskScore {
  regionId: string;
  regionName: string;
  riskLevel: Severity;
  score: number;
  factors: string[];
}

export interface ForecastPoint {
  timestamp: string;
  demand: number;
  renewable: number;
  conventional: number;
}

export interface Forecast {
  horizon: string;
  confidence: number;
  points: ForecastPoint[];
  peakDemand: number;
  peakTime: string;
}

export interface Incident {
  id: string;
  severity: Severity;
  title: string;
  location: string;
  region: string;
  status: IncidentStatus;
  assignedOperator: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  category: "system" | "operator" | "alert" | "incident";
  severity?: Severity;
}

export interface ServiceHealth {
  name: string;
  status: OperationalStatus;
  latency: number;
  uptime: number;
  lastChecked: string;
}

export interface SystemHealth {
  overallScore: number;
  services: ServiceHealth[];
  lastUpdated: string;
}

export interface ReplayJob {
  id: string;
  name: string;
  progress: number;
  duration: string;
  state: ReplayState;
  startTime: string;
  estimatedEnd: string;
  eventsProcessed: number;
  totalEvents: number;
}

export interface Evidence {
  id: string;
  source: string;
  confidence: number;
  timestamp: string;
  description: string;
  relatedIncidentId?: string;
  type: "sensor" | "log" | "operator" | "model" | "external";
}
