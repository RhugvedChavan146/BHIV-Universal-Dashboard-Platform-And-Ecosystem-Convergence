// ─── Capability Contract — Type Definitions ───────────────────────────────────
// Structural types for documenting the platform's *stable* runtime contracts
// as typed data (documentation-as-code), the same pattern used by
// `registry/runtimeIdentity.ts`. Nothing here is executed against a live
// system — these types describe the shape of the constants exported from
// `./capabilityContract.ts`, which mirror `/CAPABILITY_CONTRACT.md`.

/** Stability guarantee attached to every contract entry below. */
export type ContractStability =
  /** May change in a minor version without notice. Not yet relied upon by more than one consumer. */
  | "experimental"
  /** Additive changes only within a major version (new optional fields/events are safe to add). Breaking changes require a major bump. */
  | "stable"
  /** Kept only for existing callers; do not build new integrations against it. */
  | "deprecated";

/** One SDK event flowing through `DashboardSDK` (the `SDKEventBus`) or `RuntimeConnector`. */
export interface EventContract {
  /** Literal event name as passed to `sdk.on(name, ...)` / `sdk.emit(name, ...)`. */
  name: string;
  /** "in" = a producer calls `emit()` and the platform reacts; "out" = the platform emits and app code subscribes with `on()`. Most SDK events are both — documented from the app/consumer's point of view. */
  direction: "in" | "out";
  /** Where the event is emitted from. */
  source: string;
  /** Shape of the payload passed to listeners. Reference a type name from the owning module. */
  payloadType: string;
  description: string;
  stability: ContractStability;
}

/** One REST endpoint a typed API client wraps (see `/API.md` for the full per-service catalog). */
export interface RestEndpointContract {
  service: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  /** Exported fetch function that wraps this endpoint, e.g. `fetchHealth`. */
  clientFn: string;
  /** Response TypeScript type name. */
  responseType: string;
  /** True if the client function normalizes/backfills missing fields rather than passing the raw payload through. */
  normalizes: boolean;
  /** True if a network/4xx/5xx error is caught and a safe empty/default value is returned instead of throwing. */
  resilientFallback: boolean;
  stability: ContractStability;
}

/** One field/branch of the `DashboardConfig` / `SDKDashboardConfig` config schemas. */
export interface ConfigSchemaContract {
  schema: string;
  owner: string;
  description: string;
  /** How consumers change it at runtime — e.g. "deepMerge(defaultConfig, overrides)". */
  mutationPath: string;
  stability: ContractStability;
}

/** One exported hook in the SDK's public hook surface. */
export interface SdkHookContract {
  name: string;
  module: string;
  /** Must be rendered under this provider (or "none"). */
  requiresProvider: string;
  returns: string;
  description: string;
  stability: ContractStability;
}

/** One normalized error condition a runtime connector/API client contract commits to surfacing. */
export interface ErrorContract {
  code: string;
  /** Where today's implementations raise/normalize this condition (may list more than one call site). */
  raisedBy: string[];
  /** Message shape the caller receives (an `Error` unless noted). */
  surfacedAs: string;
  /** What a widget/hook should do when it receives this condition. */
  recommendedHandling: string;
  stability: ContractStability;
}

/** One place the platform is designed to be extended without modifying core files. */
export interface ExtensionPointContract {
  name: string;
  module: string;
  /** What you register/provide. */
  extendWith: string;
  /** What the platform hands back / does with it. */
  effect: string;
  stability: ContractStability;
}

/** One rule governing how a versioned artifact in this platform may change. */
export interface VersionRule {
  subject: string;
  rule: string;
  /** Where the rule is enforced today: "code" (checked at runtime/build), "convention" (documented only), or "package.json" (semver range). */
  enforcement: "code" | "convention" | "package.json";
}

/**
 * Generic structural shape an extension-point payload can be introspected
 * through: a stable pointer back to the `ExtensionPointContract.name` it
 * targets, plus whatever fields that extension point actually requires.
 * Not a type any existing registry method requires — `WidgetRegistry.register()`,
 * `ProductLayoutRegistry.register()`, etc. keep their own concrete parameter
 * types (`WidgetDefinition`, `ProductLayout`, ...) unchanged. This exists so
 * tooling (and future extension points not yet in `EXTENSION_POINT_CONTRACTS`)
 * has one structural type to introspect against instead of a union of every
 * concrete extension payload type.
 */
export interface DashboardExtension {
  /** Matches one `ExtensionPointContract.name` in `EXTENSION_POINT_CONTRACTS`. */
  extensionPoint: string;
  [field: string]: unknown;
}

/**
 * Single aggregated snapshot of every SDK-level runtime contract, for
 * tooling that wants one import instead of six. Each field is exactly the
 * corresponding array/value already exported individually from
 * `capabilityContract.ts` — this is a convenience re-grouping, not a new
 * source of truth.
 */
export interface RuntimeContract {
  version: string;
  events: {
    sdk: EventContract[];
    runtimeConnector: EventContract;
    serviceObservability: EventContract;
  };
  configSchemas: ConfigSchemaContract[];
  hooks: SdkHookContract[];
  errors: ErrorContract[];
  extensionPoints: ExtensionPointContract[];
  versionRules: VersionRule[];
}
