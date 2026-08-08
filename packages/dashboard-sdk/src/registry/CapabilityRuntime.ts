import type { WidgetDefinition } from "./types";

/**
 * Tracks which BHIV/TANTRA runtime capabilities are currently active (e.g.
 * discovered from a capability-graph API at boot or over a live connection)
 * and maps that set onto widget availability. Widgets with no declared
 * `capabilities` are always available; widgets that declare capabilities are
 * available once at least one of them is active.
 */
export class CapabilityRuntime {
  private active: Set<string> = new Set();
  private listeners: Set<(capabilities: string[]) => void> = new Set();

  public setActiveCapabilities(capabilities: string[]): void {
    this.active = new Set(capabilities);
    this.notify();
  }

  public activate(capability: string): void {
    if (this.active.has(capability)) return;
    this.active.add(capability);
    this.notify();
  }

  public deactivate(capability: string): void {
    if (!this.active.has(capability)) return;
    this.active.delete(capability);
    this.notify();
  }

  public isActive(capability: string): boolean {
    return this.active.has(capability);
  }

  public getActiveCapabilities(): string[] {
    return Array.from(this.active);
  }

  /** True if `widget` declares no capabilities, or at least one of its declared capabilities is active. */
  public widgetIsAvailable(widget: WidgetDefinition): boolean {
    if (!widget.capabilities || widget.capabilities.length === 0) return true;
    return widget.capabilities.some((capability) => this.active.has(capability));
  }

  public subscribe(listener: (capabilities: string[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getActiveCapabilities();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const globalCapabilityRuntime = new CapabilityRuntime();
