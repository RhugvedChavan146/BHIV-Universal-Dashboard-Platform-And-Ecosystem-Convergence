import * as React from "react";
import { cn } from "@bhiv/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      className={cn(
        "shrink-0 bg-slate-700/50",
        orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full self-stretch",
        className
      )}
      {...props}
    />
  );
}
