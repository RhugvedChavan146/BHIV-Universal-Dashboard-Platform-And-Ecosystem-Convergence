import { Suspense } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ErrorBoundary, Skeleton } from "@bhiv/ui";
import { cn } from "@bhiv/utils";
import type { LayoutZoneDefinition } from "./types";
import { DragHandle } from "./drag-drop/DragHandle";
import type { DragProps } from "./drag-drop/useDragToReorder";
import { ResizeHandle } from "./resize/ResizeHandle";

export interface LayoutZoneProps {
  zone: LayoutZoneDefinition;
  fallbackTitle?: string;
  skeletonHeight?: string;
  children?: ReactNode;
  /** Shows drag/resize chrome and wires up interactions. Defaults to false — identical to the legacy static zone. */
  editable?: boolean;
  /** Inline style for a customized desktop span (from `useLayoutEngine.getSpanStyle`). Applies regardless of `editable`, so a saved layout keeps rendering outside edit mode too. */
  spanStyle?: CSSProperties;
  dragProps?: DragProps;
  isDragging?: boolean;
  isDragOver?: boolean;
  onResizeHandlePointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  isResizing?: boolean;
}

/**
 * Renders a single dashboard zone: error boundary, suspense fallback, and
 * grid placement — the exact same contract as `@bhiv/dashboard-sdk`'s
 * `ZoneLayoutEngine`. When `editable` is false (the default) and no
 * `spanStyle` override is supplied, output is unchanged from the legacy
 * component.
 */
export function LayoutZone({
  zone,
  fallbackTitle,
  skeletonHeight = "h-64",
  children,
  editable = false,
  spanStyle,
  dragProps,
  isDragging,
  isDragOver,
  onResizeHandlePointerDown,
  isResizing,
}: LayoutZoneProps) {
  if (!zone || zone.visible === false) {
    return null;
  }

  const Component = zone.component;
  const colSpanClass = spanStyle ? undefined : zone.colSpan || "col-span-12";
  const title = fallbackTitle || zone.fallbackTitle || (zone.title ? `${zone.title} Crashed` : "Zone Crashed");
  const height = skeletonHeight || zone.skeletonHeight || "h-64";
  const canEdit = editable && !zone.locked;

  return (
    <div
      id={`zone-${zone.id}`}
      className={cn(
        colSpanClass,
        "h-full relative",
        editable && "rounded-lg transition-shadow",
        canEdit && "ring-1 ring-dashed ring-slate-600/60",
        isDragging && "opacity-40",
        isDragOver && "ring-2 ring-indigo-400",
        isResizing && "ring-2 ring-indigo-400"
      )}
      style={spanStyle}
      {...(canEdit ? dragProps : undefined)}
    >
      {canEdit && <DragHandle label={zone.title ? `Drag ${zone.title}` : "Drag to reorder"} />}
      <ErrorBoundary fallbackTitle={title}>
        <Suspense fallback={<Skeleton className={cn(height, "w-full rounded-lg bg-slate-800/40 animate-pulse")} />}>
          {children ? children : Component ? <Component /> : null}
        </Suspense>
      </ErrorBoundary>
      {canEdit && onResizeHandlePointerDown && (
        <ResizeHandle onPointerDown={onResizeHandlePointerDown} active={isResizing} />
      )}
    </div>
  );
}
