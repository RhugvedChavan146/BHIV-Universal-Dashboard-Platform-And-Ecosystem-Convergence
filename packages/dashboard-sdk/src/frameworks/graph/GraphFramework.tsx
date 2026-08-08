import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@bhiv/utils";

export interface GraphDataPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

export interface GraphFrameworkProps {
  data: GraphDataPoint[];
  dataKey?: string;
  strokeColor?: string;
  fillColor?: string;
  height?: number;
  className?: string;
}

export function GraphFramework({
  data,
  dataKey = "value",
  strokeColor = "#6366f1",
  fillColor = "#6366f1",
  height = 180,
  className,
}: GraphFrameworkProps) {
  return (
    <div className={cn("w-full bg-slate-900/30 p-2 rounded-lg border border-slate-800", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              fontSize: "11px",
              color: "#f8fafc",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            fillOpacity={1}
            fill={`url(#gradient-${dataKey})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
