import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { cn } from "@bhiv/utils";

/** Chart kinds supported by `ChartFramework`. `GraphFramework` remains the dedicated area-chart primitive. */
export type ChartKind = "bar" | "line" | "pie" | "donut";

export interface ChartSeriesConfig {
  /** Object key in each datum this series reads its value from. */
  dataKey: string;
  /** Legend / tooltip label. Defaults to `dataKey`. */
  label?: string;
  color?: string;
}

/** Default series palette — matches the indigo/accent tokens used across the design system's dark theme. */
export const DEFAULT_CHART_PALETTE = [
  "#6366f1", // indigo (primary)
  "#38bdf8", // accent
  "#34d399", // success
  "#fbbf24", // warning
  "#f87171", // danger
  "#818cf8", // info
];

export interface ChartFrameworkProps {
  /** Chart kind. `"donut"` is a `"pie"` with an inner radius. */
  kind: ChartKind;
  data: Array<Record<string, unknown>>;
  /**
   * Series to render. For `"bar"`/`"line"` this may be multiple series
   * (grouped bars / multiple lines) sharing one categorical axis. For
   * `"pie"`/`"donut"`, only the first entry is used as the value key.
   */
  series: ChartSeriesConfig[];
  /** Key used for the categorical (x) axis on bar/line charts, or the slice label on pie/donut charts. */
  categoryKey: string;
  height?: number;
  /** Show the built-in legend. Default `true` for pie/donut, `series.length > 1` for bar/line. */
  showLegend?: boolean;
  /** Show cartesian grid lines (bar/line only). Default `true`. */
  showGrid?: boolean;
  className?: string;
}

/**
 * ChartFramework — a single, configurable entry point for bar, line, and
 * pie/donut charts, matching the same dark-surface container styling as
 * `GraphFramework` (area charts). Colors default to the design system's
 * indigo/accent palette but are overridable per-series.
 *
 * @example
 * ```tsx
 * <ChartFramework
 *   kind="bar"
 *   data={[{ region: "US", requests: 420 }, { region: "EU", requests: 310 }]}
 *   categoryKey="region"
 *   series={[{ dataKey: "requests", label: "Requests" }]}
 * />
 *
 * <ChartFramework
 *   kind="donut"
 *   data={[{ tier: "P0", count: 4 }, { tier: "P1", count: 12 }]}
 *   categoryKey="tier"
 *   series={[{ dataKey: "count" }]}
 * />
 * ```
 */
export function ChartFramework({
  kind,
  data,
  series,
  categoryKey,
  height = 220,
  showLegend,
  showGrid = true,
  className,
}: ChartFrameworkProps) {
  const resolvedSeries = series.map((s, i) => ({
    ...s,
    color: s.color ?? DEFAULT_CHART_PALETTE[i % DEFAULT_CHART_PALETTE.length],
  }));

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      fontSize: "11px",
      color: "#f8fafc",
    },
  } as const;

  return (
    <div className={cn("w-full bg-slate-900/30 p-2 rounded-lg border border-slate-800", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {kind === "bar" ? (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />}
            <XAxis dataKey={categoryKey} stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            {(showLegend ?? resolvedSeries.length > 1) && <Legend wrapperStyle={{ fontSize: "10px" }} />}
            {resolvedSeries.map((s) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.label ?? s.dataKey} fill={s.color} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : kind === "line" ? (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />}
            <XAxis dataKey={categoryKey} stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            {(showLegend ?? resolvedSeries.length > 1) && <Legend wrapperStyle={{ fontSize: "10px" }} />}
            {resolvedSeries.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label ?? s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip {...tooltipStyle} />
            {(showLegend ?? true) && <Legend wrapperStyle={{ fontSize: "10px" }} />}
            <Pie
              data={data}
              dataKey={resolvedSeries[0]?.dataKey}
              nameKey={categoryKey}
              innerRadius={kind === "donut" ? "55%" : 0}
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DEFAULT_CHART_PALETTE[i % DEFAULT_CHART_PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
