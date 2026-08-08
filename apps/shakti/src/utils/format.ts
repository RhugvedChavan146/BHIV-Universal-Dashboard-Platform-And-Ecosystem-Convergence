import type { StatusTone } from "@bhiv/ui";
import { TONE_TEXT, TONE_DOT, TONE_SURFACE } from "@bhiv/ui";
import type { Severity, OperationalStatus, TrendDirection, IncidentStatus, ReplayState } from "@/types/api";

// ─── Domain → shared StatusTone mappers ────────────────────────────────────
// SHAKTI's domain enums (Severity, OperationalStatus) map onto the design
// system's generic StatusTone exactly once, here. Components should prefer
// `severityTone` / `statusTone` + the shared <StatusDot>/<StatusBadge>
// primitives from @bhiv/ui over hand-rolled color classes.

export function severityTone(severity: Severity): StatusTone {
  return {
    critical: "danger",
    high: "caution",
    medium: "warning",
    low: "info",
    info: "neutral",
  }[severity];
}

export function statusTone(status: OperationalStatus): StatusTone {
  return {
    online: "success",
    offline: "danger",
    warning: "warning",
    degraded: "caution",
  }[status];
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Legacy string-class helpers ───────────────────────────────────────────
// Kept for existing callers that want a raw Tailwind class string rather
// than a <StatusDot>/<StatusBadge> component. Colors are sourced from the
// single shared tone palette in @bhiv/ui — no color values are duplicated
// here. Prefer `severityTone`/`statusTone` + the shared components in new code.

export function severityColor(severity: Severity): string {
  return TONE_TEXT[severityTone(severity)];
}

export function severityBg(severity: Severity): string {
  return TONE_SURFACE[severityTone(severity)];
}

export function statusColor(status: OperationalStatus): string {
  return TONE_TEXT[statusTone(status)];
}

export function statusDot(status: OperationalStatus): string {
  return TONE_DOT[statusTone(status)];
}

export function trendIcon(trend: TrendDirection): string {
  return { up: "↑", down: "↓", stable: "→" }[trend];
}

export function trendColor(trend: TrendDirection, inverse = false): string {
  if (trend === "stable") return "text-slate-400";
  const isPositive = trend === "up";
  return (isPositive !== inverse) ? "text-emerald-400" : "text-red-400";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Runtime → UI type mappers ────────────────────────────────────────────────
// Consolidated from duplicate local functions in dashboard components.
// Maps untyped runtime API strings to strongly-typed UI enums.

export function toSeverity(s: string): Severity {
  if (s === "critical" || s === "high" || s === "medium" || s === "low" || s === "info") return s;
  return "info";
}

export function toStatus(s: string): OperationalStatus {
  if (s === "normal" || s === "operational") return "online";
  if (s === "warning") return "warning";
  if (s === "critical" || s === "offline") return "offline";
  if (s === "degraded") return "degraded";
  return "online";
}

export function toTrend(t: string): TrendDirection {
  if (t === "up" || t === "down" || t === "stable") return t;
  return "stable";
}

export function toIncidentStatus(s: string): IncidentStatus {
  if (s === "running")   return "investigating";
  if (s === "completed") return "resolved";
  if (s === "failed")    return "closed";
  if (s === "pending")   return "open";
  if (s === "paused")    return "open";
  return "open";
}

export function toReplayState(s: string): ReplayState {
  if (s === "active")    return "running";
  if (s === "completed") return "completed";
  if (s === "failed")    return "failed";
  if (s === "idle")      return "idle";
  return "idle";
}
