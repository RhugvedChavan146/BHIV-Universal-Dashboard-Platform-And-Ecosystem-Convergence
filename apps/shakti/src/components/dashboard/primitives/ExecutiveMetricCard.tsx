import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trendColor, statusColor, trendIcon } from "@/utils/format";
import type { TrendDirection, OperationalStatus } from "@/types/api";

export interface ExecutiveMetricCardProps {
  /** Metric label (e.g. "Active Incidents") */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional unit (e.g. "%", "GW") */
  unit?: string;
  /** Trend direction (up, down, stable) */
  trend: TrendDirection;
  /** String to show next to trend (e.g. "+2") */
  trendValue?: string;
  /** Optional status for the top-right icon */
  status?: OperationalStatus;
  /** Icon component */
  icon?: React.ElementType;
  /** Visual variant (primary with background, or compact KPI style) */
  variant?: "primary" | "compact";
}

export const ExecutiveMetricCard = memo(function ExecutiveMetricCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  status = "online",
  icon: Icon,
  variant = "primary",
}: ExecutiveMetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  if (variant === "compact") {
    return (
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <p className="text-[12.5px] text-slate-400 font-semibold leading-none">{title}</p>
          <p className="text-[20px] font-bold text-slate-100 mt-1.5 leading-none">
            {value ?? "—"}
            {unit && <span className="text-xs text-slate-500 font-semibold ml-0.5">{unit}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-xs font-semibold ${trendColor(trend)} leading-none`}>
            {trendIcon(trend)}
          </span>
          {trendValue && (
            <span className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{trendValue}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5 flex flex-col gap-1.5 justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-slate-400 font-semibold uppercase tracking-wider leading-none">{title}</span>
        {Icon && <Icon size={14} className={statusColor(status)} />}
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-3xl font-extrabold text-slate-100 tracking-tight leading-none">
          {value}
          {unit && <span className="text-xs text-slate-500 font-semibold ml-0.5">{unit}</span>}
        </span>
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold leading-none ${trendColor(trend)}`}>
          <TrendIcon size={11} />
          {trendValue || (trend === "up" ? "↑" : trend === "down" ? "↓" : "→")}
        </span>
      </div>
    </div>
  );
});
