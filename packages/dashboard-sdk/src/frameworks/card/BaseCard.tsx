import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@bhiv/ui";
import { cn } from "@bhiv/utils";

export interface BaseCardProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function BaseCard({
  title,
  subtitle,
  headerRight,
  footer,
  className,
  children,
}: BaseCardProps) {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-1.5">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-[10px] text-slate-400 font-mono">{subtitle}</p>}
        </div>
        {headerRight}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export interface MetricCardFrameworkProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCardFramework({
  label,
  value,
  unit,
  change,
  trend = "neutral",
  className,
}: MetricCardFrameworkProps) {
  const trendColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <div className={cn("p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex flex-col gap-1", className)}>
      <span className="text-[11px] font-mono text-slate-400">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-slate-100 font-mono tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>
      {change && (
        <span className={cn("text-[10px] font-mono font-medium", trendColors[trend])}>
          {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}{change}
        </span>
      )}
    </div>
  );
}
