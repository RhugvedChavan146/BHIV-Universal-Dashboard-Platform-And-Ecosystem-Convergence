import { cn } from "@bhiv/utils";
import type { PointerEvent } from "react";

export interface ResizeHandleProps {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  active?: boolean;
  className?: string;
}

/** Draggable handle on a zone's right edge — resizes its desktop column span. */
export function ResizeHandle({ onPointerDown, active, className }: ResizeHandleProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize"
      className={cn(
        "absolute top-0 right-0 z-10 h-full w-2.5 cursor-col-resize touch-none",
        "flex items-center justify-center",
        className
      )}
    >
      <div
        className={cn(
          "h-8 w-1 rounded-full bg-slate-600/70 transition-colors",
          active && "bg-indigo-400"
        )}
      />
    </div>
  );
}
