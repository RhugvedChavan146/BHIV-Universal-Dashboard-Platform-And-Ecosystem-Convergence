// ─── Registry Participation — Registration Flow ───────────────────────────────
// The registration flow every Capability / Runtime / Execution / Replay /
// Review Registry participation follows, documented as typed data — the same
// "documentation-as-code" pattern `contract/capabilityContract.ts` uses for
// error/event/extension-point contracts. This is a description of the flow,
// not an orchestrator: no function in this file calls any adapter, builds
// any envelope, or performs any I/O. Steps 1–3 are local/pure and already
// have concrete helpers elsewhere in `registries/`; step 4 is the explicit
// boundary where a real implementation (owned by the consuming deployment)
// takes over; step 5 is also deployment-owned.

import type { RegistrationFlowStep, RegistryParticipationContract } from "./types";

/** Bump when the registration flow's shape changes in a way that isn't purely additive. Independent of `@bhiv/dashboard-sdk`'s package.json version. */
export const REGISTRY_PARTICIPATION_CONTRACT_VERSION = "1.0.0";

export const REGISTRATION_FLOW_STEPS: RegistrationFlowStep[] = [
  {
    step: 1,
    name: "collect",
    description:
      "Gather the already-registered/already-computed internal record(s) to participate with: WidgetDefinition[] + capability ids (Capability Registry), a RuntimeIdentityCard (Runtime Registry), LineageNode[] from a TraceLineage (Execution/Replay Registry), or a CompositionValidationReport + LifecycleSummary from AgentSelector (Review Registry). No network calls.",
    local: true,
  },
  {
    step: 2,
    name: "map",
    description:
      "Run the registry-specific pure mapping function — mapCapabilityToParticipationDTO / mapRuntimeIdentityToParticipantDTO / mapLineageNodeToExecutionRecord / mapLineageNodeToReplayRecord / mapCompositionReportToReviewSubmission — to produce that registry's DTO. Pure field projection/filtering only.",
    local: true,
  },
  {
    step: 3,
    name: "envelope",
    description:
      "Wrap the DTO in a RegistrationEnvelope: { registry, product, submittedAt, contractVersion, payload }. Still local — submittedAt is a client-side timestamp, not a server-assigned one.",
    local: true,
  },
  {
    step: 4,
    name: "submit",
    description:
      "Pass the envelope to a concrete RegistryAdapter implementation's register(envelope) method. This package ships no such implementation — each deployment supplies its own adapter that knows how to reach its actual Capability/Runtime/Execution/Replay/Review Registry service (auth, endpoint, retries, etc.). This is the one step that leaves this package's read-only, no-network boundary.",
    local: false,
  },
  {
    step: 5,
    name: "reconcile",
    description:
      "Store/observe the returned RegistrationResult (externalId + status) for later getRegistrationStatus/deregister calls. Reconciliation storage (where the externalId is kept) is also deployment-specific — this package defines the RegistrationResult shape but does not persist it anywhere.",
    local: false,
  },
];

export const REGISTRY_PARTICIPATION_CONTRACT: RegistryParticipationContract = {
  version: REGISTRY_PARTICIPATION_CONTRACT_VERSION,
  registries: ["capability", "runtime", "execution", "replay", "review"],
  registrationFlow: REGISTRATION_FLOW_STEPS,
};
