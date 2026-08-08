// ─── Dashboard SDK Hooks ───────────────────────────────────────────────────────
// The primary hook surface for apps consuming the SDK. `useDashboard` and
// `useWidget` are defined here; the rest are re-exported from their owning
// domain modules so `import { useX } from "@bhiv/dashboard-sdk"` works for
// every hook without needing to know which internal module owns it.

export * from "./useDashboard";
export * from "./useWidget";
export { useDashboardConfig } from "../config/useDashboardConfig";
export { useTheme } from "../theme/useTheme";
export { useFilters } from "../filters/useFilters";
export { useDashboardSDK } from "../sdk/useDashboardSDK";
export { useNavigation } from "../navigation/useNavigation";
