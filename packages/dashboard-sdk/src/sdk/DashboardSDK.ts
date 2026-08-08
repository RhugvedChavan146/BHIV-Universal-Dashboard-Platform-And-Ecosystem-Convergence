import type { SDKDashboardConfig, SDKEventBus, SDKEventCallback, SDKWidgetConfig } from "./types";

export class DashboardSDK implements SDKEventBus {
  private config: SDKDashboardConfig;
  private listeners: Map<string, Set<SDKEventCallback<unknown>>> = new Map();

  constructor(initialConfig?: Partial<SDKDashboardConfig>) {
    this.config = {
      appTitle: "Operational Command Platform",
      version: "1.0.0",
      environment: "production",
      refreshIntervalMs: 10000,
      widgets: {},
      ...initialConfig,
    };
  }

  public getConfig(): SDKDashboardConfig {
    return this.config;
  }

  public updateConfig(patch: Partial<SDKDashboardConfig>): void {
    this.config = { ...this.config, ...patch };
    this.emit("config:updated", this.config);
  }

  public registerWidget(widget: SDKWidgetConfig): void {
    this.config.widgets[widget.id] = widget;
    this.emit("widget:registered", widget);
  }

  public unregisterWidget(widgetId: string): void {
    if (this.config.widgets[widgetId]) {
      delete this.config.widgets[widgetId];
      this.emit("widget:unregistered", widgetId);
    }
  }

  public getWidget(widgetId: string): SDKWidgetConfig | undefined {
    return this.config.widgets[widgetId];
  }

  // Event Bus implementation
  public on<T = unknown>(event: string, callback: SDKEventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as SDKEventCallback<unknown>);

    return () => {
      this.off(event, callback);
    };
  }

  public off<T = unknown>(event: string, callback: SDKEventCallback<T>): void {
    const eventSet = this.listeners.get(event);
    if (eventSet) {
      eventSet.delete(callback as SDKEventCallback<unknown>);
    }
  }

  public emit<T = unknown>(event: string, payload?: T): void {
    const eventSet = this.listeners.get(event);
    if (eventSet) {
      eventSet.forEach((cb) => cb(payload));
    }
  }
}

export const globalDashboardSDK = new DashboardSDK();
