// ─── Capability Registry — Participation Contract ─────────────────────────────
// Contract + DTO + pure mapping for registering which BHIV/TANTRA capabilities
// this deployment's widgets declare, and whether each is currently active —
// so an external Capability Registry can track capability *usage* across
// products, not just this SDK's own local `CapabilityRuntime` state.
//
// No implementation: `CapabilityRegistryAdapter` is an interface only. The
// mapping function below is pure and read-only (mirrors the same read-only
// boundary `AgentSelector` already honors — see `registry/AgentSelector.ts`):
// it never calls `CapabilityRuntime.activate/deactivate/setActiveCapabilities`.

import type { WidgetDefinition } from "../registry/types";
import type { RegistryAdapter } from "./types";

/** One capability's participation snapshot, ready to submit to a Capability Registry. */
export interface CapabilityParticipationDTO {
  capabilityId: string;
  /** Widget ids (within this product) that declare this capability. */
  declaredByWidgets: string[];
  /** Whether the capability is currently active in this deployment, per `CapabilityRuntime.isActive`. Read-only — this DTO never activates/deactivates anything. */
  activeInDeployment: boolean;
  product: string;
}

/** Contract-only adapter for the Capability Registry. No concrete implementation ships in this package. */
export type CapabilityRegistryAdapter = RegistryAdapter<CapabilityParticipationDTO>;

/**
 * Minimal read-only view of `CapabilityRuntime` this mapper needs. Accepting
 * the narrow shape (rather than the concrete class) keeps this function
 * reusable against a mock, a snapshot, or the real `globalCapabilityRuntime`
 * without importing runtime state into a pure module.
 */
export interface CapabilityActivationSource {
  isActive(capability: string): boolean;
}

/**
 * Builds a `CapabilityParticipationDTO` for one capability id from already-
 * registered widgets and a read-only capability-activation source. Pure —
 * performs no lookup beyond the arrays/object passed in, no I/O.
 */
export function mapCapabilityToParticipationDTO(
  capabilityId: string,
  widgets: WidgetDefinition[],
  capabilities: CapabilityActivationSource,
  product: string,
): CapabilityParticipationDTO {
  return {
    capabilityId,
    declaredByWidgets: widgets
      .filter((widget) => widget.capabilities?.includes(capabilityId))
      .map((widget) => widget.id),
    activeInDeployment: capabilities.isActive(capabilityId),
    product,
  };
}

/**
 * Convenience: builds one `CapabilityParticipationDTO` per distinct capability
 * declared across `widgets`. Pure — derives the capability id set from the
 * widgets themselves rather than requiring the caller to enumerate it.
 */
export function mapCapabilitiesToParticipationDTOs(
  widgets: WidgetDefinition[],
  capabilities: CapabilityActivationSource,
  product: string,
): CapabilityParticipationDTO[] {
  const capabilityIds = new Set<string>();
  for (const widget of widgets) {
    for (const capability of widget.capabilities ?? []) {
      capabilityIds.add(capability);
    }
  }
  return Array.from(capabilityIds).map((capabilityId) =>
    mapCapabilityToParticipationDTO(capabilityId, widgets, capabilities, product),
  );
}
