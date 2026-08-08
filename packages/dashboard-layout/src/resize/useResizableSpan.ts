import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { clampCols, measureColumnWidth, pixelDeltaToColDelta } from "../utils/grid";

export interface UseResizableSpanOptions {
  /** Current committed column span (1-12). */
  cols: number;
  minCols?: number;
  maxCols?: number;
  /** Ref to the 12-column grid container, used to measure track width. */
  containerRef: RefObject<HTMLElement | null>;
  /** Pixel gap between grid tracks — pass the value matching the grid's density (defaults to 8px / Tailwind gap-2). */
  gapPx?: number;
  /** Called once, on pointer release, with the final clamped column count. */
  onChange: (cols: number) => void;
  enabled: boolean;
}

export interface UseResizableSpanResult {
  isResizing: boolean;
  /** Live column count while actively dragging, for visual feedback; null when idle. */
  previewCols: number | null;
  onHandlePointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Drag-to-resize for a single grid zone's desktop column span. Pure pointer
 * events, no external dependency. Measures the grid container's current
 * pixel width on drag-start so it stays correct across viewport sizes.
 */
export function useResizableSpan({
  cols,
  minCols = 3,
  maxCols = 12,
  containerRef,
  gapPx = 8,
  onChange,
  enabled,
}: UseResizableSpanOptions): UseResizableSpanResult {
  const [isResizing, setIsResizing] = useState(false);
  const [previewCols, setPreviewCols] = useState<number | null>(null);
  const startXRef = useRef(0);
  const startColsRef = useRef(cols);
  const columnWidthRef = useRef(0);

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const container = containerRef.current;
      if (!container) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      columnWidthRef.current = measureColumnWidth(rect.width, gapPx);
      startXRef.current = e.clientX;
      startColsRef.current = cols;
      setIsResizing(true);
      setPreviewCols(cols);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture isn't available in every environment (e.g. some
        // test runners) — the window-level listeners below still work fine.
      }

      const handleMove = (moveEvent: PointerEvent) => {
        const deltaPx = moveEvent.clientX - startXRef.current;
        const deltaCols = pixelDeltaToColDelta(deltaPx, columnWidthRef.current);
        setPreviewCols(clampCols(startColsRef.current + deltaCols, minCols, maxCols));
      };

      const handleUp = (upEvent: PointerEvent) => {
        const deltaPx = upEvent.clientX - startXRef.current;
        const deltaCols = pixelDeltaToColDelta(deltaPx, columnWidthRef.current);
        const next = clampCols(startColsRef.current + deltaCols, minCols, maxCols);

        setIsResizing(false);
        setPreviewCols(null);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);

        if (next !== startColsRef.current) onChange(next);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [enabled, cols, minCols, maxCols, containerRef, gapPx, onChange]
  );

  return { isResizing, previewCols, onHandlePointerDown };
}
