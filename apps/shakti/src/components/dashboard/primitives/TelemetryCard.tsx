import { memo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface TelemetrySeries {
  name: string;
  dataKey: string;
  color: string;
}

export interface TelemetrySummaryMetric {
  label: string;
  value: string | number;
  unit?: string;
}

export interface TelemetryCardProps {
  /** Array of data points, must include a key for the X-axis (usually 'time') */
  data: any[];
  /** Name of the key to use for the X-axis */
  xAxisKey?: string;
  /** Series configurations to render */
  series: TelemetrySeries[];
  /** Array of summary metrics to display above the chart */
  summaryMetrics?: TelemetrySummaryMetric[];
  /** Height of the chart component in pixels or percentage string */
  chartHeight?: number | `${number}%`;
  /** Optional overall query tracing ID to display inside the tooltip */
  traceId?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  traceId,
}: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur border border-slate-700 shadow-xl rounded-md p-2.5 text-[12.5px] space-y-1.5 z-50 min-w-[160px]">
      <p className="text-slate-400 font-semibold pb-1 border-b border-slate-800/80">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-slate-400">{p.name}</span>
            </div>
            <span className="font-bold text-slate-100" style={{ color: p.color }}>
              {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : p.value}
            </span>
          </div>
        ))}
      </div>
      {traceId && (
        <div className="border-t border-slate-800/80 pt-1.5 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Trace ID</span>
          <span className="text-[10.5px] font-mono text-slate-400 break-all">{traceId}</span>
        </div>
      )}
    </div>
  );
};

export const TelemetryCard = memo(function TelemetryCard({
  data,
  xAxisKey = "time",
  series,
  summaryMetrics,
  chartHeight = "100%",
  traceId,
}: TelemetryCardProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3 w-full">
      {summaryMetrics && summaryMetrics.length > 0 && (
        <div className={`grid gap-2 grid-cols-${Math.min(summaryMetrics.length, 4)} shrink-0`}>
          {summaryMetrics.map((sm, i) => (
            <div key={i} className="bg-slate-700/30 border border-slate-600/30 rounded p-2">
              <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">{sm.label}</p>
              <p className="text-[14px] font-bold text-slate-200 mt-0.5">
                {sm.value}
                {sm.unit && <span className="text-[11px] font-normal text-slate-500 ml-1">{sm.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {hasData ? (
        <div className="relative flex-1 min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.dataKey} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                interval="preserveEnd"
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip traceId={traceId} />} />
              {series.map((s, i) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${i})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend inside the chart (bottom-right) */}
          <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-700/50 rounded px-2 py-1 flex items-center gap-3 text-[10px] text-slate-300 font-semibold pointer-events-none shadow-md">
            {series.map(s => (
              <span key={s.dataKey} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[200px] border border-dashed border-slate-800 rounded bg-slate-950/20">
          <p className="text-xs font-semibold text-slate-300 font-mono">Telemetry stream connected.</p>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Awaiting historical samples.</p>
        </div>
      )}
    </div>
  );
});
