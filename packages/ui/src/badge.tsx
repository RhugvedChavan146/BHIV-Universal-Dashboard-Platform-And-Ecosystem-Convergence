import * as React from "react";
import { cn } from "@bhiv/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "ghost";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-700/80 text-slate-200 border-slate-600/50",
    secondary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    outline: "border-slate-600/60 text-slate-300 bg-transparent",
    ghost: "bg-slate-800/40 text-slate-400 border-transparent hover:bg-slate-700/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono border transition-colors shrink-0",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
