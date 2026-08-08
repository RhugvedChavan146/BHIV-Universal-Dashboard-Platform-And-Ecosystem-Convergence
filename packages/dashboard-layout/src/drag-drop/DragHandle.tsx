import { GripVertical } from "lucide-react";
import { cn } from "@bhiv/utils";

export interface DragHandleProps {
  className?: string;
  label?: string;
}

/**
 * Purely visual affordance indicating a zone is draggable. The actual
 * `draggable` attribute and drag event handlers live on the zone's outer
 * container (see `LayoutZone`) — HTML5 drag-and-drop doesn't restrict the
 * drag origin to a sub-element without extra plumbing, so this is a labelled
 * grip icon rather than an isolated drag-start target.
 */
export function DragHandle({ className, label = "Drag to reorder" }: DragHandleProps) {
  return (
    <div
      className={cn(
        "absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded bg-slate-800/90 px-1.5 py-1 text-slate-400 shadow-sm cursor-grab active:cursor-grabbing",
        className
      )}
      title={label}
      aria-hidden="true"
    >
      <GripVertical size={12} />
    </div>
  );
}
