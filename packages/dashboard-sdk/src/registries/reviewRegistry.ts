// ─── Review Registry — Participation Contract ─────────────────────────────────
// Contract + DTO + pure mapping for submitting a resolved composition (a
// layout's Agent Selector output — see `registry/AgentSelector.ts`) for
// human review: does this composition look right, is a "deprecated" widget
// selection intentional, should a capability-gated zone block a release.
// Reuses `CompositionValidationReport` and `LifecycleSummary` rather than
// redefining composition-outcome shapes.
//
// No implementation: `ReviewRegistryAdapter` is an interface only. The
// mapping function is a pure field projection off `AgentSelector`'s already-
// computed reports — it re-derives nothing and performs no I/O. Note this
// is strictly about submitting a composition *for* review, never about
// executing or auto-approving anything: `status` on a freshly-mapped DTO is
// always `"pending"`.

import type {
  CompositionValidationIssue,
  CompositionValidationReport,
  LifecycleSummary,
  LifecycleStatus,
} from "../registry/AgentSelector";
import type { RegistryAdapter } from "./types";

/** Human-facing review status. A DTO produced by the mapper below always starts `"pending"` — later stages of an actual review are owned by the external Review Registry, not this SDK. */
export type ReviewStatus = "pending" | "approved" | "rejected" | "changes-requested";

/** One layout composition, ready to submit to a Review Registry for human review. */
export interface ReviewSubmissionDTO {
  product: string;
  layoutId: string;
  status: ReviewStatus;
  compositionValid: boolean;
  zoneCount: number;
  resolvedCount: number;
  issues: CompositionValidationIssue[];
  lifecycleCounts: Record<LifecycleStatus, number>;
}

/** Contract-only adapter for the Review Registry. No concrete implementation ships in this package. */
export type ReviewRegistryAdapter = RegistryAdapter<ReviewSubmissionDTO>;

/**
 * Builds a `ReviewSubmissionDTO` from an `AgentSelector.validateComposition()`
 * report and a matching `getLifecycleSummary()` call for the same
 * product+layout. Pure — no re-resolution, no I/O; callers are expected to
 * have already produced both reports via `AgentSelector`.
 */
export function mapCompositionReportToReviewSubmission(
  composition: CompositionValidationReport,
  lifecycle: LifecycleSummary,
): ReviewSubmissionDTO {
  return {
    product: composition.product,
    layoutId: composition.layoutId,
    status: "pending",
    compositionValid: composition.valid,
    zoneCount: composition.zoneCount,
    resolvedCount: composition.resolvedCount,
    issues: composition.issues,
    lifecycleCounts: lifecycle.counts,
  };
}
