import type { WidgetDefinition } from "./types";

export class CapabilityRuntime {
  private activeCapabilities: Set<string> = new Set();
  private subscribers: Set<() => void> = new Set();

  public setActiveCapabilities(capabilities: string[]): void {
    this.activeCapabilities = new Set(capabilities);
    this.notify();
  }

  public activate(capability: string): void {
    if (this.activeCapabilities.has(capability)) return;
    this.activeCapabilities.add(capability);
    this.notify();
  }

  public deactivate(capability: string): void {
    if (!this.activeCapabilities.has(capability)) return;
    this.activeCapabilities.delete(capability);
    this.notify();
  }

  public isActive(capability: string): boolean {
    return this.activeCapabilities.has(capability);
  }

  public getActiveCapabilities(): string[] {
    return Array.from(this.activeCapabilities);
  }

  public widgetIsAvailable(widget: WidgetDefinition): boolean {
    if (!widget.capabilities || widget.capabilities.length === 0) return true;
    return widget.capabilities.some((c) => this.activeCapabilities.has(c));
  }

  public subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify(): void {
    this.subscribers.forEach((listener) => listener());
  }
}

export const globalCapabilityRuntime = new CapabilityRuntime();
