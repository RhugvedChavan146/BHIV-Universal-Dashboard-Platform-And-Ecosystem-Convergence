import * as React from "react";
import { cn } from "@bhiv/utils";

/**
 * Generic semantic tone used by every status-related primitive in the
 * design system. Domain types (e.g. an app's `OperationalStatus` or
 * `Severity` enums) should be mapped to a `StatusTone` once, centrally,
 * instead of every component re-deriving its own color classes.
 */
export type StatusTone =
  | "success"
  | "warning"
  | "caution"
  | "danger"
  | "info"
  | "neutral"
  | "active";

export const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-emerald-400",
  warning: "text-yellow-400",
  caution: "text-orange-400",
  danger: "text-red-400",
  info: "text-blue-400",
  neutral: "text-slate-400",
  active: "text-indigo-400",
};

export const TONE_DOT: Record<StatusTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-yellow-400",
  caution: "bg-orange-400",
  danger: "bg-red-400",
  info: "bg-blue-400",
  neutral: "bg-slate-400",
  active: "bg-indigo-400",
};

export const TONE_BAR: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-yellow-500",
  caution: "bg-orange-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-500",
  active: "bg-indigo-500",
};

export const TONE_SURFACE: Record<StatusTone, string> = {
  success: "bg-emerald-500/15 border-emerald-500/30",
  warning: "bg-yellow-500/15 border-yellow-500/30",
  caution: "bg-orange-500/15 border-orange-500/30",
  danger: "bg-red-500/15 border-red-500/30",
  info: "bg-blue-500/15 border-blue-500/30",
  neutral: "bg-slate-500/15 border-slate-500/30",
  active: "bg-indigo-500/15 border-indigo-500/30",
};

/** Small colored status dot. The single source of truth for "online dot" UI. */
export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  pulse?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function StatusDot({
  tone = "neutral",
  pulse = false,
  size = "sm",
  className,
  ...props
}: StatusDotProps) {
  const sizeStyles = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <span
      className={cn(
        "rounded-full shrink-0",
        sizeStyles[size],
        TONE_DOT[tone],
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/** Uppercase, bold status text, optionally paired with a dot. */
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  showDot?: boolean;
  pulse?: boolean;
  /** Render as a bordered/filled pill instead of bare text. */
  variant?: "text" | "pill";
}

export function StatusBadge({
  tone = "neutral",
  showDot = false,
  pulse = false,
  variant = "text",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
        variant === "pill" && cn("px-2 py-0.5 rounded border", TONE_SURFACE[tone]),
        TONE_TEXT[tone],
        className
      )}
      {...props}
    >
      {showDot && <StatusDot tone={tone} pulse={pulse} />}
      {children}
    </span>
  );
}

/** Thin horizontal progress/percentage bar, shared by every "progress" style card. */
export interface ProgressBarProps {
  /** 0-100 */
  value: number;
  tone?: StatusTone;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ value, tone = "info", className, trackClassName }: ProgressBarProps) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
   <div className={cn("h-1.5 bg-slate-700 rounded-full overflow-hidden", className, trackClassName)}>
  <div
     className={cn("h-full rounded-full transition-all", TONE_BAR[tone])}
      style={{ width: `${pct}%` }}
     />
+   </div>
  );
}

/**
 * A single row: dot + label + up to two right-aligned metric columns + trailing status text.
 * Generalizes the "health check list row" pattern (API/service/dependency health lists).
 */
export interface StatusIndicatorRowProps {
  /** Name of the component, service, or API */
  label: string;
  /** Semantic tone driving the dot + trailing text color */
  tone: StatusTone;
  /** Text shown at the trailing edge (usually the status word itself) */
  statusText: string;
  /** Optional secondary metric columns, e.g. response time, detail string */
  metrics?: Array<{ value: React.ReactNode; width?: string; title?: string }>;
  pulse?: boolean;
  /** Hide the row's bottom border (useful for the last row in a list) */
  noBorder?: boolean;
  className?: string;
}

export function StatusIndicatorRow({
  label,
  tone,
  statusText,
  metrics = [],
  pulse = false,
  noBorder = false,
  className,
}: StatusIndicatorRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5",
        !noBorder && "border-b border-slate-700/30 last:border-0",
        className
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      <span className="text-xs text-slate-300 flex-1 truncate" title={label}>
        {label}
      </span>
      {metrics.map((m, i) => (
        <span
          key={i}
          title={m.title}
          className={cn("text-xs text-slate-500 text-right truncate", m.width ?? "w-14")}
        >
          {m.value}
        </span>
      ))}
      <span className={cn("text-xs font-medium w-20 text-right capitalize shrink-0", TONE_TEXT[tone])}>
        {statusText}
      </span>
    </div>
  );
}

/**
 * A single row: dot + label + progress bar + percentage + trailing status text.
 * Generalizes the "task/job progress list row" pattern.
 */
export interface ProgressStatusRowProps {
  label: string;
  /** 0-100 */
  progress: number;
  /** Tone driving the dot + trailing text */
  tone: StatusTone;
  /** Tone driving the progress bar fill (defaults to `tone`) */
  barTone?: StatusTone;
  trailingText: string;
  noBorder?: boolean;
  className?: string;
}

export function ProgressStatusRow({
  label,
  progress,
  tone,
  barTone,
  trailingText,
  noBorder = false,
  className,
}: ProgressStatusRowProps) {
  const pct = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-1.5",
        !noBorder && "border-b border-slate-700/40 last:border-0",
        className
      )}
    >
      <StatusDot tone={tone} size="md" />
      <span className="text-[13px] font-medium text-slate-200 w-24 shrink-0 truncate" title={label}>
        {label}
      </span>
      <ProgressBar value={pct} tone={barTone ?? tone} className="flex-1" />
      <span className="text-[11px] text-slate-400 w-10 text-right font-mono shrink-0">{pct}%</span>
      <span className={cn("text-[11.5px] font-bold w-16 text-right capitalize shrink-0", TONE_TEXT[tone])}>
        {trailingText}
      </span>
    </div>
  );
}
