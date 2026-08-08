// The widget registry has moved to `../registry/WidgetRegistry` — it now
// supports versioning, discovery, permissions/visibility, runtime capability
// mapping, and dynamic (code-split) component loading. Re-exported here so
// existing `@bhiv/dashboard-sdk` imports of `./widget` keep working.
export { WidgetRegistry, globalWidgetRegistry } from "../registry/WidgetRegistry";
export type { WidgetDefinition } from "../registry/types";
