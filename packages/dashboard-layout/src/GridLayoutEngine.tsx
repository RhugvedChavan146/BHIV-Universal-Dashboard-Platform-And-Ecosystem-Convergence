import { forwardRef } from "react";
import { cn } from "@bhiv/utils";
import type { LayoutEngineProps } from "./types";

/**
 * 12-column responsive grid container. Produces byte-for-byte the same
 * `className` output as the legacy `@bhiv/dashboard-sdk` `LayoutEngine` for
 * the same props — this is a drop-in replacement, extended with a
 * forwarded ref so the resize engine can measure the grid's live pixel
 * width.
 */
export const GridLayoutEngine = forwardRef<HTMLDivElement, LayoutEngineProps>(function GridLayoutEngine(
  { density = "standard", gap, className, children },
  ref
) {
  const gapClass = gap ? gap : density === "compact" ? "gap-1.5" : density === "relaxed" ? "gap-4" : "gap-2";

  return (
    <div ref={ref} className={cn("grid grid-cols-12 w-full", gapClass, className)}>
      {children}
    </div>
  );
});
