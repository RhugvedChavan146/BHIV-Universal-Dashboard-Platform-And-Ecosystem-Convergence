import "./env.d.ts";

/**
 * Structured Logger for frontend telemetry.
 * In production, this can be wired to Datadog, Sentry, or ELK.
 *
 * In dev (`import.meta.env.DEV`), output stays human-readable in the
 * browser console. In production builds, each call emits a single-line
 * JSON record (timestamp, level, message, context, error) so it can be
 * captured by a log collector without any string parsing.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

function isDev(): boolean {
  try {
    return Boolean(import.meta.env.DEV);
  } catch {
    return false;
  }
}

function serializeError(error: unknown): LogRecord["error"] | undefined {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (error !== undefined) {
    return { name: "UnknownError", message: String(error) };
  }
  return undefined;
}

function consoleMethodFor(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case "debug":
      return console.debug;
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    default:
      return console.info;
  }
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): void {
  const method = consoleMethodFor(level);

  if (isDev()) {
    // Human-readable in development — keeps the original console UX.
    const parts: unknown[] = [`[${level.toUpperCase()}] ${message}`];
    if (error !== undefined) parts.push(error);
    if (context && Object.keys(context).length > 0) parts.push(context);
    method(...parts);
    return;
  }

  const record: LogRecord = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
    ...(serializeError(error) ? { error: serializeError(error) } : {}),
  };
  method(JSON.stringify(record));
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => emit("error", message, context, error),
  debug: (message: string, context?: Record<string, unknown>) => {
    if (isDev()) emit("debug", message, context);
  },
};
