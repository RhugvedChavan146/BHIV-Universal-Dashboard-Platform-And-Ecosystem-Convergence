export interface SDKWidgetConfig {
  id: string;
  title: string;
  category?: string;
  colSpan?: string;
  height?: string;
  defaultVisible?: boolean;
  props?: Record<string, unknown>;
}

export interface SDKDashboardConfig {
  appTitle: string;
  version: string;
  environment: "development" | "staging" | "production";
  refreshIntervalMs: number;
  widgets: Record<string, SDKWidgetConfig>;
}

export type SDKEventCallback<T = unknown> = (payload: T) => void;

export interface SDKEventBus {
  on<T = unknown>(event: string, callback: SDKEventCallback<T>): () => void;
  off<T = unknown>(event: string, callback: SDKEventCallback<T>): void;
  emit<T = unknown>(event: string, payload?: T): void;
}
