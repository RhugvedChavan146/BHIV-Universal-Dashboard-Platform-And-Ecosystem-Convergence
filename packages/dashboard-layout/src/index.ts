// ─── @bhiv/dashboard-layout ──────────────────────────────────────────────────
// Reusable, responsive dashboard layout engine: 12-column grid, zone
// placement, drag-and-drop reordering, drag-to-resize, persistence, and
// layout templates.
//
//   GridLayoutEngine / LayoutZone  — low-level primitives, drop-in
//                                    replacements for @bhiv/dashboard-sdk's
//                                    LayoutEngine / ZoneLayoutEngine
//   useLayoutEngine                — core hook: ordering, edit mode,
//                                    persistence, templates
//   DashboardGrid                  — high-level component wiring the above
//                                    together with drag/resize interactions
//   LayoutEditToolbar              — optional pre-built edit/reset/template UI
//   persistence / templates        — pluggable storage for saved layouts
//
// Until a user actively drags or resizes a zone (or an app applies a saved
// template), every component here renders identically to a static grid —
// so swapping an existing hardcoded layout over to this package changes
// nothing visually by default.

export * from "./types";
export * from "./GridLayoutEngine";
export * from "./LayoutZone";
export * from "./DashboardGrid";
export * from "./LayoutEditToolbar";
export * from "./useLayoutEngine";

export * from "./drag-drop";
export * from "./resize";
export * from "./persistence";
export * from "./templates";
export * from "./utils/grid";
