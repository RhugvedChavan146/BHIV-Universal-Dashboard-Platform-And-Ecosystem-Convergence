import * as React from "react";
import { cn } from "@bhiv/utils";

export type KPITrend = "up" | "down" | "neutral";

/**
 * KPIStat — a single key-metric stat block.
 *
 * A more configurable superset of `MetricCardFramework`
 * (`@bhiv/dashboard-sdk`): adds an optional icon, a goal/threshold
 * caption, and a `sparkline` slot so any small chart (e.g.
 * `GraphFramework`) can be dropped in underneath the number. Kept in
 * `@bhiv/ui` because it has no dependency on the dashboard SDK — usable
 * standalone in any React app.
 *
 * @example
 * ```tsx
 * <KPIGrid columns={3}>
 *   <KPIStat label="Active Sessions" value={1284} trend="up" change="+4.2%" icon={Users} />
 *   <KPIStat label="Error Rate" value="0.42" unit="%" trend="down" change="-0.1pp" tone="success" />
 *   <KPIStat label="P95 Latency" value={212} unit="ms" trend="neutral" goal="< 250ms" />
 * </KPIGrid>
 * ```
 */
export interface KPIStatProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Delta/comparison text, e.g. "+4.2% vs last week". */
  change?: string;
  trend?: KPITrend;
  /**
   * Overrides the color driven by `trend` for the change text. Useful when
   * a rising number is bad (e.g. error rate) so "up" shouldn't render green.
   */
  tone?: "success" | "danger" | "neutral";
  icon?: React.ElementType;
  /** Short caption under the value, e.g. a target/threshold ("Target: < 5%"). */
  goal?: string;
  /** Small chart or custom content rendered beneath the stat, e.g. a sparkline. */
  sparkline?: React.ReactNode;
  className?: string;
}

const TREND_TONE: Record<KPITrend, "success" | "danger" | "neutral"> = {
  up: "success",
  down: "danger",
  neutral: "neutral",
};

const TONE_TEXT: Record<"success" | "danger" | "neutral", string> = {
  success: "text-emerald-400",
  danger: "text-red-400",
  neutral: "text-slate-400",
};

export function KPIStat({
  label,
  value,
  unit,
  change,
  trend = "neutral",
  tone,
  icon: Icon,
  goal,
  sparkline,
  className,
}: KPIStatProps) {
  const resolvedTone = tone ?? TREND_TONE[trend];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-3 bg-slate-900/40 border border-slate-800 rounded-lg min-w-0",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-400 truncate" title={label}>
          {label}
        </span>
        {Icon && <Icon size={14} className="text-slate-500 shrink-0" />}
      </div>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-xl font-bold text-slate-100 font-mono tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>

      {(change || goal) && (
        <div className="flex items-center justify-between gap-2">
          {change && (
            <span className={cn("text-[10px] font-mono font-medium", TONE_TEXT[resolvedTone])}>
              {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
              {change}
            </span>
          )}
          {goal && <span className="text-[10px] font-mono text-slate-600">{goal}</span>}
        </div>
      )}

      {sparkline && <div className="mt-1">{sparkline}</div>}
    </div>
  );
}

export interface KPIGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max columns at the widest breakpoint. Collapses responsively down to 1 column. Default `4`. */
  columns?: 2 | 3 | 4 | 5 | 6;
}

const COLUMN_CLASSES: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

/** Responsive grid container for `KPIStat`s — 1 column on mobile, scaling up to `columns` on wide viewports. */
export function KPIGrid({ columns = 4, className, ...props }: KPIGridProps) {
  return <div className={cn("grid grid-cols-1 gap-3", COLUMN_CLASSES[columns], className)} {...props} />;
}
