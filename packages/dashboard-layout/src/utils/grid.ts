import type { CSSProperties } from "react";

// ─── Grid math helpers ─────────────────────────────────────────────────────────
// The engine's default (unedited) zones keep rendering via their original
// literal Tailwind `colSpan` class (so Tailwind's JIT has already generated
// the CSS for them and behavior is pixel-identical to the legacy engine).
// Once a zone is dragged or resized, we switch that single zone over to an
// inline `gridColumn` style instead — dynamically computed class names like
// `col-span-7` are not guaranteed to exist in Tailwind's generated output, but
// inline styles always work regardless of what the JIT scanner has seen.

export const DEFAULT_MIN_COLS = 3;
export const DEFAULT_MAX_COLS = 12;
export const GRID_COLUMNS = 12;

export function clampCols(cols: number, min = DEFAULT_MIN_COLS, max = DEFAULT_MAX_COLS): number {
  const bounded = Math.max(min, Math.min(max, Math.round(cols)));
  return Math.max(1, Math.min(GRID_COLUMNS, bounded));
}

/** Best-effort extraction of a zone's "desktop" (lg) column span from its legacy Tailwind colSpan string. */
export function parseDesktopColsFromClassName(colSpan: string | undefined): number {
  if (!colSpan) return GRID_COLUMNS;
  const lgMatch = colSpan.match(/(?:^|\s)lg:col-span-(\d+)/);
  if (lgMatch) return clampCols(Number(lgMatch[1]));
  const mdMatch = colSpan.match(/(?:^|\s)md:col-span-(\d+)/);
  if (mdMatch) return clampCols(Number(mdMatch[1]));
  const baseMatch = colSpan.match(/(?:^|\s)col-span-(\d+)/);
  if (baseMatch) return clampCols(Number(baseMatch[1]));
  return GRID_COLUMNS;
}

/** Inline style equivalent of `col-span-N` — used for the "desktop" breakpoint once a zone is customized. */
export function colSpanStyle(cols: number): CSSProperties {
  const span = clampCols(cols);
  return { gridColumn: `span ${span} / span ${span}` };
}

/** Given a grid container's measured width, gap, and column count, returns the pixel width of one column track. */
export function measureColumnWidth(containerWidthPx: number, gapPx: number, columns = GRID_COLUMNS): number {
  const totalGap = gapPx * (columns - 1);
  return Math.max(1, (containerWidthPx - totalGap) / columns);
}

/** Converts a horizontal pixel delta into a signed column delta, rounded to the nearest whole column. */
export function pixelDeltaToColDelta(deltaPx: number, columnWidthPx: number): number {
  if (columnWidthPx <= 0) return 0;
  return Math.round(deltaPx / columnWidthPx);
}
