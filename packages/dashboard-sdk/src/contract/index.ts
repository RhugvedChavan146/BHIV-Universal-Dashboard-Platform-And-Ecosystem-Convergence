// ─── Capability Contract (documentation-as-code, additive-only) ──────────────
// Machine-readable mirror of /CAPABILITY_CONTRACT.md — see capabilityContract.ts
// for details. Re-exported once, from the SDK's public surface (index.ts's
// `export * from "./contract"`), so consumers can `import { ERROR_CONTRACTS }
// from "@bhiv/dashboard-sdk"` without reaching into this module directly.
// (Not additionally re-exported from extensions/index.ts — index.ts already
// `export *`s both barrels, so re-exporting the same names from extensions
// too would make them ambiguous rather than additive.)

export * from "./types";
export * from "./capabilityContract";
