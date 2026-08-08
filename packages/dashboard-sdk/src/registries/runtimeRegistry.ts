// ─── Runtime Registry — Participation Contract ────────────────────────────────
// Contract + DTO + pure mapping for registering this SDK's runtime engines
// (Discovery, Agent Selector, Dependency/Compatibility Engine, Composition
// Engine, Runtime Config Generator — see `/RUNTIME_IDENTITY.md`) with an
// external Runtime Registry, so that registry can track which architectural
// layers exist per product/deployment without re-deriving them by hand.
//
// No implementation: `RuntimeRegistryAdapter` is an interface only. The
// mapping function is a pure field projection off the existing
// `RuntimeIdentityCard` constants in `registry/runtimeIdentity.ts` — it adds
// no new introspection and calls nothing.

import type { RuntimeIdentityCard, RuntimeLayerId } from "../registry/runtimeIdentity";
import type { RegistryAdapter } from "./types";

/** One runtime engine's participation snapshot, ready to submit to a Runtime Registry. */
export interface RuntimeParticipantDTO {
  id: RuntimeLayerId;
  layer: string;
  purpose: string;
  authority: string[];
  status: "ACTIVE" | "DEPRECATED" | "PLANNED";
  version: string;
  product: string;
}

/** Contract-only adapter for the Runtime Registry. No concrete implementation ships in this package. */
export type RuntimeRegistryAdapter = RegistryAdapter<RuntimeParticipantDTO>;

/** Projects an existing `RuntimeIdentityCard` (see `registry/runtimeIdentity.ts`) into a `RuntimeParticipantDTO`. Pure field selection — no new data is derived. */
export function mapRuntimeIdentityToParticipantDTO(
  card: RuntimeIdentityCard,
  product: string,
): RuntimeParticipantDTO {
  return {
    id: card.id,
    layer: card.layer,
    purpose: card.purpose,
    authority: card.authority,
    status: card.status,
    version: card.version,
    product,
  };
}

/** Convenience: maps every card in `RUNTIME_IDENTITY_CARDS` (or a caller-supplied subset) to its participant DTO. */
export function mapRuntimeIdentitiesToParticipantDTOs(
  cards: readonly RuntimeIdentityCard[],
  product: string,
): RuntimeParticipantDTO[] {
  return cards.map((card) => mapRuntimeIdentityToParticipantDTO(card, product));
}
