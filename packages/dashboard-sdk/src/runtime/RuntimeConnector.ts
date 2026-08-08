import type {
  RuntimeConnectorListener,
  RuntimeConnectorOptions,
  RuntimeStreamTransport,
} from "./types";

/**
 * A single named connection to a backend service. Consumers `subscribe()`
 * for updates and never need to know whether delivery is currently polling
 * or streaming.
 *
 * Today every BHIV service (Control Plane, Bucket, InsightFlow, PRANA, ...)
 * is polled via TanStack Query. `RuntimeConnector` exists as the shared,
 * transport-agnostic seam for that: it polls by default via `poll()`, and
 * upgrades to push delivery the moment a `RuntimeStreamTransport` (WebSocket,
 * SSE, etc.) is attached with `attachTransport()` — no consumer code changes
 * when a service adds real streaming.
 */
export class RuntimeConnector<T> {
  public readonly id: string;
  private readonly poll: () => Promise<T>;
  private readonly intervalMs: number;
  private transport?: RuntimeStreamTransport<T>;
  private timer?: ReturnType<typeof setInterval>;
  private listeners: Set<RuntimeConnectorListener<T>> = new Set();
  private errorListeners: Set<(err: unknown) => void> = new Set();
  private running = false;

  constructor(options: RuntimeConnectorOptions<T>) {
    this.id = options.id;
    this.poll = options.poll;
    this.intervalMs = options.intervalMs ?? 10_000;
    this.transport = options.transport;
  }

  public subscribe(listener: RuntimeConnectorListener<T>): () => void {
    this.listeners.add(listener);
    if (!this.running) this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  public onError(listener: (err: unknown) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /** Swap in a live streaming transport. Polling pauses while it's connected. */
  public attachTransport(transport: RuntimeStreamTransport<T>): void {
    this.transport = transport;
    if (this.running) {
      this.stopPolling();
      this.startTransport();
    }
  }

  public detachTransport(): void {
    this.transport?.disconnect();
    this.transport = undefined;
    if (this.running) this.startPolling();
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    if (this.transport) this.startTransport();
    else this.startPolling();
  }

  public stop(): void {
    this.running = false;
    this.stopPolling();
    this.transport?.disconnect();
  }

  private startTransport(): void {
    this.transport!.connect(
      (payload, traceId) => this.emit(payload, traceId),
      (err) => this.emitError(err)
    );
  }

  private startPolling(): void {
    const tick = async () => {
      try {
        const payload = await this.poll();
        this.emit(payload);
      } catch (err) {
        this.emitError(err);
      }
    };
    tick();
    this.timer = setInterval(tick, this.intervalMs);
  }

  private stopPolling(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private emit(payload: T, traceId?: string): void {
    const meta = { traceId, receivedAt: Date.now() };
    this.listeners.forEach((listener) => listener(payload, meta));
  }

  private emitError(err: unknown): void {
    this.errorListeners.forEach((listener) => listener(err));
  }
}
