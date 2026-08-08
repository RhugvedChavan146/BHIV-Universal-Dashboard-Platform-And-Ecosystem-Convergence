// ─── @bhiv/dashboard-sdk ────────────────────────────────────────────────────────
// Public API surface for the reusable dashboard SDK.
//
//   DashboardProvider   — single root provider (config + theme + filters + SDK)
//   hooks               — useDashboard, useWidget, useFilters, useTheme, ...
//   utilities           — formatTimestamp, cn, logger, useResponsive, ...
//   config              — configuration types/contract + DashboardConfigProvider
//   extensions          — registries + framework building blocks
//   registries          — Capability/Runtime/Execution/Replay/Review Registry
//                         participation contracts (DTOs + mapping; no implementation)
//   observability       — structured logs, trace ids, evidence, replay metadata,
//                         health reporting, metrics (Logging Standard / Evidence
//                         Schema / Replay Schema / Health Model — see /OBSERVABILITY.md)
//
// The underlying domain modules (theme, filters, sdk, widget, navigation,
// templates, frameworks, layout) are also exported directly for apps that
// want fine-grained, standalone access instead of the curated barrels above.

export * from "./DashboardProvider";
export * from "./hooks";
export * from "./utilities";
export * from "./config";
export * from "./extensions";
export * from "./registry";

export * from "./theme";
export * from "./sdk";
export * from "./layout";
export * from "./widget";
export * from "./filters";
export * from "./frameworks";
export * from "./navigation";
export * from "./templates";
export * from "./runtime";
export * from "./contract";
export * from "./registries";
export * from "./observability";
