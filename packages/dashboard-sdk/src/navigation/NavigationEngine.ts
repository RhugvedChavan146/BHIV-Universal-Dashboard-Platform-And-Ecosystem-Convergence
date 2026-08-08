import type { NavItem, NavigationState } from "./types";

export class NavigationEngine {
  private state: NavigationState;
  private listeners: Set<(state: NavigationState) => void> = new Set();

  constructor(items: NavItem[] = [], initialRoute: string = "/") {
    this.state = {
      activeRoute: initialRoute,
      items,
    };
  }

  public getState(): NavigationState {
    return this.state;
  }

  public setActiveRoute(path: string): void {
    this.state = { ...this.state, activeRoute: path };
    this.notify();
  }

  public setItems(items: NavItem[]): void {
    this.state = { ...this.state, items };
    this.notify();
  }

  public subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const globalNavigationEngine = new NavigationEngine([
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "operations", label: "Operations", path: "/operations" },
  { id: "telemetry", label: "Telemetry", path: "/telemetry" },
  { id: "capabilities", label: "Capabilities", path: "/capabilities" },
]);
