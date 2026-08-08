// ─── Registry Participation — Shared Contract Types ───────────────────────────
// Structural types shared by every external registry this SDK can *participate*
// in: Capability Registry, Runtime Registry, Execution Registry, Replay
// Registry, and Review Registry. "Participate" means this package can produce
// the DTO an adapter would submit and describe the flow for submitting it —
// it does NOT ship a concrete adapter that talks to a real service. Every
// `*RegistryAdapter` interface below is a contract only: no class in this
// package implements it, no network/HTTP/RuntimeConnector call happens
// anywhere in `registries/`. A consuming deployment supplies its own concrete
// adapter (wrapping its own HTTP client, auth, and endpoint) that satisfies
// the interface.
//
// This follows the same "documentation-as-code, additive-only" pattern as
// `registry/runtimeIdentity.ts` and `contract/capabilityContract.ts` — see
// those files' headers for the precedent this one continues.

/** The five external registries this SDK is prepared to participate in. */
export type RegistryKind = "capability" | "runtime" | "execution" | "replay" | "review";

/**
 * Envelope every registry submission is wrapped in before being handed to a
 * `RegistryAdapter.register()`. Building an envelope is a pure, local step —
 * no I/O happens until a concrete adapter's `register()` is actually called.
 */
export interface RegistrationEnvelope<TPayload> {
  registry: RegistryKind;
  /** Which product/app this registration originates from (e.g. "shakti"). */
  product: string;
  /** ms since epoch this envelope was built — a local timestamp, not a server-assigned one. */
  submittedAt: number;
  /** Version of this registries contract shape (see `REGISTRY_PARTICIPATION_CONTRACT_VERSION`). */
  contractVersion: string;
  payload: TPayload;
}

/** Outcome of a registration attempt, as a concrete adapter would report it back. */
export interface RegistrationResult {
  registry: RegistryKind;
  /** Id assigned by the external registry, once accepted. Undefined until then. */
  externalId?: string;
  status: "accepted" | "rejected" | "pending";
  message?: string;
}

/**
 * Contract-only adapter surface every external registry integration is
 * expected to satisfy. This package defines the shape; it deliberately
 * ships no implementation — see the module header. A concrete adapter is
 * free to add its own construction/config parameters; only these methods
 * are part of the shared contract.
 */
export interface RegistryAdapter<TDto> {
  readonly registry: RegistryKind;
  register(envelope: RegistrationEnvelope<TDto>): Promise<RegistrationResult>;
  deregister(externalId: string): Promise<void>;
  getRegistrationStatus(externalId: string): Promise<RegistrationResult | undefined>;
}

/** One documented step in the registration flow every registry participation follows (see `REGISTRATION_FLOW_STEPS`). */
export interface RegistrationFlowStep {
  step: number;
  name: string;
  description: string;
  /** True if this step is pure/local (no network). False marks the one step that requires a concrete adapter and leaves this package's boundary. */
  local: boolean;
}

/** Single aggregated snapshot of the registry-participation contract, for tooling that wants one import instead of several. */
export interface RegistryParticipationContract {
  version: string;
  registries: RegistryKind[];
  registrationFlow: RegistrationFlowStep[];
}
