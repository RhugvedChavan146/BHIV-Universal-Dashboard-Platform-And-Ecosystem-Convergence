// ─── Structured Logger ─────────────────────────────────────────────────────────
// Implements the Logging Standard documented in `/OBSERVABILITY.md`: every
// entry carries a level, an ISO timestamp, a source, and optional
// trace/product/context fields — never a bare, unstructured string.
//
// Wraps the existing `logger` from `@bhiv/utils` for actual console output
// (that file is unchanged — still the project's one console sink) and
// additionally keeps the last N entries in an in-memory ring buffer, so a
// widget/tool can read recent structured logs back out without wiring its
// own console interceptor.
//
// One `StructuredLogger` instance per engine/module
// (`createStructuredLogger({ source: "AgentSelector" })`); instances are
// independent — there is no shared global buffer, the same "explicit
// instance over ambient singleton" style `AgentSelector`/`CapabilityRuntime`
// already use (their `global*` singletons are opt-in conveniences, not the
// only way to construct one).

import { logger as consoleLogger } from "@bhiv/utils";
import type { LogLevel, StructuredLogEntry } from "./types";

const DEFAULT_BUFFER_SIZE = 200;

export interface StructuredLoggerOptions {
  /** Default `source` attached to every entry unless overridden per call. */
  source: string;
  /** Default `product` attached to every entry unless overridden per call. */
  product?: string;
  /** How many recent entries to retain in memory (oldest evicted first). */
  bufferSize?: number;
}

export interface LogCallOptions {
  traceId?: string;
  /** Overrides this logger's default product for a single call. */
  product?: string;
  context?: Record<string, unknown>;
}

export class StructuredLogger {
  private readonly source: string;
  private readonly defaultProduct?: string;
  private readonly bufferSize: number;
  private buffer: StructuredLogEntry[] = [];

  constructor(options: StructuredLoggerOptions) {
    this.source = options.source;
    this.defaultProduct = options.product;
    this.bufferSize = options.bufferSize ?? DEFAULT_BUFFER_SIZE;
  }

  public debug(message: string, options?: LogCallOptions): StructuredLogEntry {
    return this.write("debug", message, options);
  }

  public info(message: string, options?: LogCallOptions): StructuredLogEntry {
    return this.write("info", message, options);
  }

  public warn(message: string, options?: LogCallOptions): StructuredLogEntry {
    return this.write("warn", message, options);
  }

  public error(message: string, options?: LogCallOptions): StructuredLogEntry {
    return this.write("error", message, options);
  }

  /** Entries currently in the ring buffer, oldest first. */
  public getEntries(): StructuredLogEntry[] {
    return [...this.buffer];
  }

  /** Entries matching a given trace id, oldest first. */
  public getEntriesByTraceId(traceId: string): StructuredLogEntry[] {
    return this.buffer.filter((entry) => entry.traceId === traceId);
  }

  public clear(): void {
    this.buffer = [];
  }

  private write(level: LogLevel, message: string, options?: LogCallOptions): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: this.source,
      traceId: options?.traceId,
      product: options?.product ?? this.defaultProduct,
      context: options?.context,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.bufferSize) this.buffer.shift();

    const consoleContext = {
      source: entry.source,
      ...(entry.traceId ? { traceId: entry.traceId } : {}),
      ...(entry.product ? { product: entry.product } : {}),
      ...(entry.context ?? {}),
    };

    switch (level) {
      case "debug":
        consoleLogger.debug(message, consoleContext);
        break;
      case "info":
        consoleLogger.info(message, consoleContext);
        break;
      case "warn":
        consoleLogger.warn(message, consoleContext);
        break;
      case "error":
        consoleLogger.error(message, undefined, consoleContext);
        break;
    }

    return entry;
  }
}

export function createStructuredLogger(options: StructuredLoggerOptions): StructuredLogger {
  return new StructuredLogger(options);
}
