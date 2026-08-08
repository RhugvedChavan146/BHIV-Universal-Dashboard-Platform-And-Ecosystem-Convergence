import * as React from "react";
import { cn } from "@bhiv/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-[10px] font-mono text-slate-200 bg-slate-900 border border-slate-700 rounded shadow-md bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity animate-in fade-in-0 duration-150",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-2 py-1 text-[10px] font-mono text-slate-200 bg-slate-900 border border-slate-700 rounded shadow-md", className)}>
      {children}
    </div>
  );
}
