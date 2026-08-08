import { cn } from "@bhiv/utils";
import type { LayoutEngineProps } from "./types";

export function LayoutEngine({
  density = "standard",
  gap,
  className,
  children,
}: LayoutEngineProps) {
  const gapClass = gap
    ? gap
    : density === "compact"
    ? "gap-1.5"
    : density === "relaxed"
    ? "gap-4"
    : "gap-2";

  return (
    <div className={cn("grid grid-cols-12 w-full", gapClass, className)}>
      {children}
    </div>
  );
}
