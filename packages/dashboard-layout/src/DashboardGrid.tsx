import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { DensityMode, LayoutZoneDefinition } from "./types";
import type { UseLayoutEngineResult } from "./useLayoutEngine";
import { GridLayoutEngine } from "./GridLayoutEngine";
import { LayoutZone } from "./LayoutZone";
import { useDragToReorder } from "./drag-drop/useDragToReorder";
import type { DragProps } from "./drag-drop/useDragToReorder";
import { useResizableSpan } from "./resize/useResizableSpan";
import { colSpanStyle } from "./utils/grid";

const GAP_PX_BY_DENSITY: Record<DensityMode, number> = {
  compact: 6,
  standard: 8,
  relaxed: 16,
};

export interface DashboardGridProps {
  /** Result of `useLayoutEngine` — owns ordering, edit mode, persistence. */
  engine: UseLayoutEngineResult;
  density?: DensityMode;
  gap?: string;
  /** Pixel gap between tracks, used for resize math. Inferred from `density` if omitted. */
  gapPx?: number;
  className?: string;
  /** Renders a zone's content. Receives the full zone definition (component, title, etc.). */
  renderZone: (zone: LayoutZoneDefinition) => ReactNode;
}

/**
 * Wires `GridLayoutEngine`, `LayoutZone`, drag-to-reorder, and drag-to-resize
 * together around a `useLayoutEngine` instance. This is the fastest path to
 * a fully-featured layout — when `engine.editMode` is `false` (the default),
 * it renders exactly the same DOM as a hand-rolled static grid using
 * `GridLayoutEngine` + `LayoutZone` directly.
 */
export function DashboardGrid({ engine, density = "standard", gap, gapPx, className, renderZone }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orderedKeys = engine.orderedZones.map((z) => z.key);
  const { draggingKey, dragOverKey, getDragProps } = useDragToReorder(orderedKeys, engine.reorder, engine.editMode);
  const resolvedGapPx = gapPx ?? GAP_PX_BY_DENSITY[density];

  return (
    <GridLayoutEngine ref={containerRef} density={density} gap={gap} className={className}>
      {engine.orderedZones.map((zone) => (
        <DashboardGridZone
          key={zone.key}
          zone={zone}
          engine={engine}
          containerRef={containerRef}
          gapPx={resolvedGapPx}
          dragProps={getDragProps(zone.key)}
          isDragging={draggingKey === zone.key}
          isDragOver={dragOverKey === zone.key}
        >
          {renderZone(zone)}
        </DashboardGridZone>
      ))}
    </GridLayoutEngine>
  );
}

interface DashboardGridZoneProps {
  zone: LayoutZoneDefinition;
  engine: UseLayoutEngineResult;
  containerRef: RefObject<HTMLDivElement | null>;
  gapPx: number;
  dragProps: DragProps;
  isDragging: boolean;
  isDragOver: boolean;
  children: ReactNode;
}

function DashboardGridZone({
  zone,
  engine,
  containerRef,
  gapPx,
  dragProps,
  isDragging,
  isDragOver,
  children,
}: DashboardGridZoneProps) {
  const cols = engine.getCols(zone.key);
  const { isResizing, previewCols, onHandlePointerDown } = useResizableSpan({
    cols,
    minCols: zone.minCols,
    maxCols: zone.maxCols,
    containerRef,
    gapPx,
    enabled: engine.editMode && !zone.locked,
    onChange: (next) => engine.resizeZone(zone.key, next),
  });

  const spanStyle = previewCols != null ? colSpanStyle(previewCols) : engine.getSpanStyle(zone.key);

  return (
    <LayoutZone
      zone={zone}
      editable={engine.editMode}
      spanStyle={spanStyle}
      dragProps={dragProps}
      isDragging={isDragging}
      isDragOver={isDragOver}
      isResizing={isResizing}
      onResizeHandlePointerDown={onHandlePointerDown}
    >
      {children}
    </LayoutZone>
  );
}
