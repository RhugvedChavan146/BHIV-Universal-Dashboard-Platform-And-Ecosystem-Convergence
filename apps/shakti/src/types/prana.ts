// ─── PRANA Service TypeScript Contracts ──────────────────────────────────────
// Configured via VITE_PRANA_SERVICE_URL in .env

export interface PranaHealthResponse {
  status: string;
  service?: string;
  forwarding_enabled?: boolean;
  timestamp?: string;
}

export interface PranaSystemHealthResponse {
  status: string;
  mode?: string;
  forwarding_enabled?: boolean;
  timestamp?: string;
  details?: Record<string, any>;
}

export interface PranaPropagationLogItem {
  logged_at: string;
  trace_id: string;
  destination: string;
  status: string;
  http_status?: number | null;
  attempt?: number;
  details?: any;
}

export interface PranaPropagationLogResponse {
  logs: PranaPropagationLogItem[];
  total?: number;
  count?: number;
}
