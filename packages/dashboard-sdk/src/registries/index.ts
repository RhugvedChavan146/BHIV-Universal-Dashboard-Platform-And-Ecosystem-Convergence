// ─── Registry Participation ────────────────────────────────────────────────
// Public barrel for this SDK's registry-participation contracts: shared
// envelope/adapter/result types, plus one file per external registry
// (Capability, Runtime, Execution, Replay, Review) holding that registry's
// DTO, contract-only adapter interface, and pure metadata-mapping
// function(s), and the documented registration flow all five follow.
//
// No implementation ships here — see each file's header for the exact
// boundary. Re-exported once from the SDK's public surface (index.ts's
// `export * from "./registries"`).

export * from "./types";
export * from "./capabilityRegistry";
export * from "./runtimeRegistry";
export * from "./executionRegistry";
export * from "./replayRegistry";
export * from "./reviewRegistry";
export * from "./registrationFlow";
