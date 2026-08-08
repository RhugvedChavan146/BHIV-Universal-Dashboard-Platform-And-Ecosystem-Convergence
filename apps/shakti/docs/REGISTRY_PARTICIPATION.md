# Registry Participation — BHIV Dashboard Platform

**Status: CONTRACT ONLY — NO IMPLEMENTATION.** This document, and the code
it mirrors, prepares this platform to *participate* in five external
registries — **Capability, Runtime, Execution, Replay, and Review** — by
defining the DTO each one expects, a pure function that maps this
platform's own already-computed data into that DTO, and the registration
flow that connects the two. **No concrete adapter ships in this repo.**
Nothing here opens a network connection, calls a real registry service, or
changes any existing class, hook, or component's behavior — see
[What this is not](#what-this-is-not) below.

Machine-readable source: `packages/dashboard-sdk/src/registries/` (barrel:
`export * from "./registries"`, re-exported from `@bhiv/dashboard-sdk`'s
public surface). Keep this document and that code in sync.

This follows the same additive, documentation-as-code precedent as
[`RUNTIME_IDENTITY.md`](./RUNTIME_IDENTITY.md) and
[`CAPABILITY_CONTRACT.md`](./CAPABILITY_CONTRACT.md) — see those files for
the engines and contracts this one builds on. See
[`OBSERVABILITY.md`](./OBSERVABILITY.md) for the implemented `EvidenceRecord`
and `ReplayMetadata` primitives — `mapCompositionReportToEvidence` and
`mapTraceLineageToReplayMetadata` there are natural sources for the payload
a future Review/Execution/Replay Registry adapter would submit here.

---

## Why five registries

Each registry tracks a different concern this platform already computes or
displays somewhere, but doesn't yet report outward:

| Registry | Tracks | Sourced from (already exists in this repo) |
|---|---|---|
| **Capability** | Which capabilities a product's widgets declare, and whether each is active in this deployment | `WidgetRegistry` (widget `capabilities[]`) + `CapabilityRuntime.isActive` (read-only) |
| **Runtime** | Which architectural engines exist in this SDK and what each is responsible for | `registry/runtimeIdentity.ts` (`RuntimeIdentityCard`s — see `RUNTIME_IDENTITY.md`) |
| **Execution** | Original-execution trace events the dashboard has already correlated | `runtime/traceLineage.ts` (`LineageNode`s where `sourceType === "execution"`) |
| **Replay** | Replayed/re-run trace events, same correlation, different source type | `runtime/traceLineage.ts` (`LineageNode`s where `sourceType === "replay"`) |
| **Review** | A resolved layout composition, submitted for human review | `registry/AgentSelector.ts` (`CompositionValidationReport` + `LifecycleSummary`) |

Each mapping function pulls from data this platform is already holding —
none of them re-derive, re-fetch, or re-compute anything.

---

## The registration flow (5 steps)

Every registry participation follows the same shape, documented as typed
data in `registries/registrationFlow.ts` (`REGISTRATION_FLOW_STEPS`,
`REGISTRY_PARTICIPATION_CONTRACT`):

1. **collect** *(local)* — gather the already-registered/already-computed
   internal record(s): `WidgetDefinition[]` + capability ids, a
   `RuntimeIdentityCard`, `LineageNode[]` from a `TraceLineage`, or a
   `CompositionValidationReport` + `LifecycleSummary` from `AgentSelector`.
2. **map** *(local)* — run the registry-specific pure mapping function
   (table below) to produce that registry's DTO.
3. **envelope** *(local)* — wrap the DTO in a `RegistrationEnvelope`:
   `{ registry, product, submittedAt, contractVersion, payload }`.
4. **submit** *(leaves this package)* — pass the envelope to a concrete
   `RegistryAdapter.register(envelope)`. **This package ships no such
   adapter.** A consuming deployment supplies its own, wrapping its actual
   HTTP client, auth, and endpoint for that registry.
5. **reconcile** *(leaves this package)* — store/observe the returned
   `RegistrationResult` (`externalId` + `status`) for later
   `getRegistrationStatus`/`deregister` calls. Where that's stored is also
   deployment-specific.

Steps 1–3 have concrete, pure, tested helpers in this repo today. Steps 4–5
are the explicit, documented boundary where implementation is deliberately
left out.

---

## Per-registry contract

| Registry | DTO | Adapter interface | Mapping function(s) | Module |
|---|---|---|---|---|
| Capability | `CapabilityParticipationDTO` | `CapabilityRegistryAdapter` | `mapCapabilityToParticipationDTO`, `mapCapabilitiesToParticipationDTOs` | `registries/capabilityRegistry.ts` |
| Runtime | `RuntimeParticipantDTO` | `RuntimeRegistryAdapter` | `mapRuntimeIdentityToParticipantDTO`, `mapRuntimeIdentitiesToParticipantDTOs` | `registries/runtimeRegistry.ts` |
| Execution | `ExecutionRecordDTO` | `ExecutionRegistryAdapter` | `mapLineageNodeToExecutionRecord`, `mapLineageNodesToExecutionRecords` | `registries/executionRegistry.ts` |
| Replay | `ReplayRecordDTO` | `ReplayRegistryAdapter` | `mapLineageNodeToReplayRecord`, `mapLineageNodesToReplayRecords` | `registries/replayRegistry.ts` |
| Review | `ReviewSubmissionDTO` | `ReviewRegistryAdapter` | `mapCompositionReportToReviewSubmission` | `registries/reviewRegistry.ts` |

All five adapter interfaces share one shape (`registries/types.ts`):

```ts
interface RegistryAdapter<TDto> {
  readonly registry: RegistryKind; // "capability" | "runtime" | "execution" | "replay" | "review"
  register(envelope: RegistrationEnvelope<TDto>): Promise<RegistrationResult>;
  deregister(externalId: string): Promise<void>;
  getRegistrationStatus(externalId: string): Promise<RegistrationResult | undefined>;
}
```

No class in this repository implements it — it exists purely so a
consuming deployment's own adapter has a shared shape to satisfy, and so
tooling can type-check against `RegistryAdapter<CapabilityParticipationDTO>`
etc. before a real implementation exists.

---

## What this is not

- **Not a client.** No file under `registries/` performs `fetch`, opens a
  socket, or imports `RuntimeConnector` — the same no-execution boundary
  `AgentSelector.ts` already holds itself to.
- **Not a change to any existing engine.** `WidgetRegistry`,
  `CapabilityRuntime`, `ProductLayoutRegistry`, `AgentSelector`,
  `traceLineage.ts`, and `runtimeIdentity.ts` are all read from, never
  modified. Every mapping function takes already-computed data as a plain
  argument.
- **Not a review workflow.** `mapCompositionReportToReviewSubmission`
  always produces `status: "pending"` — approving, rejecting, or
  requesting changes on a submission is entirely the external Review
  Registry's concern.
- **Not persistence.** `RegistrationResult.externalId` is a shape this
  package defines so a caller knows what to expect back; nothing in this
  repo stores it.

---

## What changed

Purely additive. New folder `packages/dashboard-sdk/src/registries/`
(`types.ts`, `capabilityRegistry.ts`, `runtimeRegistry.ts`,
`executionRegistry.ts`, `replayRegistry.ts`, `reviewRegistry.ts`,
`registrationFlow.ts`, `index.ts`, `__tests__/mapping.test.ts`), re-exported
once from `packages/dashboard-sdk/src/index.ts`. This document. No existing
file's behavior was altered; no file or folder was removed.
