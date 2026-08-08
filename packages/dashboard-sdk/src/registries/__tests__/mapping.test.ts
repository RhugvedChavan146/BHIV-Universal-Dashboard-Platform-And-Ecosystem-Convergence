import { describe, expect, it } from "vitest";
import {
  mapCapabilitiesToParticipationDTOs,
  mapCapabilityToParticipationDTO,
} from "../capabilityRegistry";
import { mapRuntimeIdentitiesToParticipantDTOs, mapRuntimeIdentityToParticipantDTO } from "../runtimeRegistry";
import { mapLineageNodeToExecutionRecord, mapLineageNodesToExecutionRecords } from "../executionRegistry";
import { mapLineageNodeToReplayRecord, mapLineageNodesToReplayRecords } from "../replayRegistry";
import { mapCompositionReportToReviewSubmission } from "../reviewRegistry";
import { REGISTRATION_FLOW_STEPS, REGISTRY_PARTICIPATION_CONTRACT } from "../registrationFlow";
import type { WidgetDefinition } from "../../registry/types";
import type { RuntimeIdentityCard } from "../../registry/runtimeIdentity";
import type { LineageNode } from "../../runtime/types";
import type { CompositionValidationReport, LifecycleSummary } from "../../registry/AgentSelector";

describe("capabilityRegistry mapping", () => {
  const widgets: WidgetDefinition[] = [
    { id: "revenue-card", name: "Revenue Card", category: "metric", capabilities: ["bucket", "prana"] },
    { id: "growth-card", name: "Growth Card", category: "metric", capabilities: ["bucket"] },
    { id: "static-card", name: "Static Card", category: "metric" },
  ];

  it("maps a single capability to its participation DTO, listing only widgets that declare it", () => {
    const dto = mapCapabilityToParticipationDTO(
      "bucket",
      widgets,
      { isActive: (c) => c === "bucket" },
      "shakti",
    );
    expect(dto).toEqual({
      capabilityId: "bucket",
      declaredByWidgets: ["revenue-card", "growth-card"],
      activeInDeployment: true,
      product: "shakti",
    });
  });

  it("reports activeInDeployment=false when the source says so, without mutating anything", () => {
    const dto = mapCapabilityToParticipationDTO("prana", widgets, { isActive: () => false }, "shakti");
    expect(dto.activeInDeployment).toBe(false);
    expect(dto.declaredByWidgets).toEqual(["revenue-card"]);
  });

  it("derives the full distinct capability set from the widget list", () => {
    const dtos = mapCapabilitiesToParticipationDTOs(widgets, { isActive: () => true }, "shakti");
    expect(dtos.map((d) => d.capabilityId).sort()).toEqual(["bucket", "prana"]);
  });
});

describe("runtimeRegistry mapping", () => {
  const card: RuntimeIdentityCard = {
    id: "agent-selector",
    layer: "Registry / SDK core",
    identity: "AgentSelector",
    purpose: "test purpose",
    authority: ["a", "b"],
    notAuthority: [],
    inputs: [],
    outputs: [],
    upstream: [],
    downstream: [],
    evidence: "",
    replay: "",
    observability: "",
    knowledge: "",
    health: "",
    version: "@bhiv/dashboard-sdk@0.1.0",
    compatibility: "",
    status: "ACTIVE",
  };

  it("projects a RuntimeIdentityCard into a RuntimeParticipantDTO without altering its fields", () => {
    const dto = mapRuntimeIdentityToParticipantDTO(card, "shakti");
    expect(dto).toEqual({
      id: "agent-selector",
      layer: "Registry / SDK core",
      purpose: "test purpose",
      authority: ["a", "b"],
      status: "ACTIVE",
      version: "@bhiv/dashboard-sdk@0.1.0",
      product: "shakti",
    });
  });

  it("maps a list of cards in order", () => {
    const dtos = mapRuntimeIdentitiesToParticipantDTOs([card, { ...card, id: "discovery" }], "shakti");
    expect(dtos.map((d) => d.id)).toEqual(["agent-selector", "discovery"]);
  });
});

describe("executionRegistry / replayRegistry mapping", () => {
  const executionNode: LineageNode = {
    sourceType: "execution",
    id: "exec-1",
    label: "Run #1",
    timestamp: "2026-08-01T00:00:00.000Z",
    status: "completed",
    raw: {},
  };
  const replayNode: LineageNode = { ...executionNode, sourceType: "replay", id: "replay-1", label: "Replay #1" };
  const auditNode: LineageNode = { ...executionNode, sourceType: "audit", id: "audit-1" };

  it("maps an execution-sourced node and returns null for non-execution nodes", () => {
    expect(mapLineageNodeToExecutionRecord(executionNode, "trace-1", "shakti")).toEqual({
      id: "exec-1",
      traceId: "trace-1",
      label: "Run #1",
      status: "completed",
      observedAt: "2026-08-01T00:00:00.000Z",
      product: "shakti",
    });
    expect(mapLineageNodeToExecutionRecord(replayNode, "trace-1", "shakti")).toBeNull();
  });

  it("maps a replay-sourced node and returns null for non-replay nodes", () => {
    expect(mapLineageNodeToReplayRecord(replayNode, "trace-1", "shakti")?.id).toBe("replay-1");
    expect(mapLineageNodeToReplayRecord(executionNode, "trace-1", "shakti")).toBeNull();
  });

  it("filters a mixed lineage node list down to just the matching sourceType per registry", () => {
    const nodes = [executionNode, replayNode, auditNode];
    expect(mapLineageNodesToExecutionRecords(nodes, "trace-1", "shakti").map((r) => r.id)).toEqual(["exec-1"]);
    expect(mapLineageNodesToReplayRecords(nodes, "trace-1", "shakti").map((r) => r.id)).toEqual(["replay-1"]);
  });
});

describe("reviewRegistry mapping", () => {
  const composition: CompositionValidationReport = {
    product: "shakti",
    layoutId: "command-center",
    valid: false,
    zoneCount: 2,
    resolvedCount: 1,
    issues: [{ zoneKey: "ghost-widget", code: "unresolved-widget", message: "missing" }],
  };
  const lifecycle: LifecycleSummary = {
    product: "shakti",
    layoutId: "command-center",
    counts: { resolved: 1, "capability-gated": 0, unpermitted: 0, unresolved: 1, deprecated: 0 },
    total: 2,
  };

  it("builds a pending review submission carrying the composition report and lifecycle counts through unchanged", () => {
    const dto = mapCompositionReportToReviewSubmission(composition, lifecycle);
    expect(dto).toEqual({
      product: "shakti",
      layoutId: "command-center",
      status: "pending",
      compositionValid: false,
      zoneCount: 2,
      resolvedCount: 1,
      issues: composition.issues,
      lifecycleCounts: lifecycle.counts,
    });
  });

  it("always starts a freshly-mapped submission as pending, regardless of composition validity", () => {
    const validComposition: CompositionValidationReport = { ...composition, valid: true, issues: [] };
    expect(mapCompositionReportToReviewSubmission(validComposition, lifecycle).status).toBe("pending");
  });
});

describe("registrationFlow", () => {
  it("documents exactly five ordered steps, local ones before the network boundary", () => {
    expect(REGISTRATION_FLOW_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
    expect(REGISTRATION_FLOW_STEPS.filter((s) => s.local).map((s) => s.step)).toEqual([1, 2, 3]);
    expect(REGISTRATION_FLOW_STEPS.filter((s) => !s.local).map((s) => s.step)).toEqual([4, 5]);
  });

  it("aggregates all five registries in the single contract export", () => {
    expect(REGISTRY_PARTICIPATION_CONTRACT.registries).toEqual([
      "capability",
      "runtime",
      "execution",
      "replay",
      "review",
    ]);
    expect(REGISTRY_PARTICIPATION_CONTRACT.registrationFlow).toBe(REGISTRATION_FLOW_STEPS);
  });

  it("is fully JSON-serializable (documentation-as-code, no functions/classes leaking in)", () => {
    expect(() => JSON.stringify(REGISTRY_PARTICIPATION_CONTRACT)).not.toThrow();
  });
});
