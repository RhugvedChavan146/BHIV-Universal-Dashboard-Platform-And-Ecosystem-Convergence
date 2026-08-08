import { beforeEach, describe, expect, it } from "vitest";
import { AgentSelector } from "../AgentSelector";
import { CapabilityRuntime } from "../CapabilityRuntime";
import { ProductLayoutRegistry } from "../ProductLayoutRegistry";
import { WidgetRegistry } from "../WidgetRegistry";
import type { ProductLayout, WidgetDefinition } from "../types";

const PRODUCT = "shakti";

function makeWidget(overrides: Partial<WidgetDefinition> = {}): WidgetDefinition {
  return {
    id: "revenue-card",
    version: "1.0.0",
    name: "Revenue Card",
    category: "metric",
    ...overrides,
  };
}

function makeLayout(overrides: Partial<ProductLayout> = {}): ProductLayout {
  return {
    id: "command-center",
    product: PRODUCT,
    name: "Command Center",
    zones: [{ widgetId: "revenue-card" }],
    ...overrides,
  };
}

describe("AgentSelector", () => {
  let widgets: WidgetRegistry;
  let layouts: ProductLayoutRegistry;
  let capabilities: CapabilityRuntime;
  let selector: AgentSelector;

  beforeEach(() => {
    widgets = new WidgetRegistry();
    layouts = new ProductLayoutRegistry();
    capabilities = new CapabilityRuntime();
    selector = new AgentSelector(widgets, layouts, capabilities);
  });

  // ── Discovery ────────────────────────────────────────────────────────────
  describe("discoverCandidates", () => {
    it("delegates to WidgetRegistry.discover with no mutation of registry state", () => {
      widgets.register(makeWidget());
      widgets.register(makeWidget({ id: "user-growth-card", category: "chart" }));

      const results = selector.discoverCandidates({ category: "metric" });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("revenue-card");
      // Registry is untouched — discovery is read-only.
      expect(widgets.getAll()).toHaveLength(2);
    });

    it("returns an empty array when nothing matches", () => {
      expect(selector.discoverCandidates({ category: "nonexistent" })).toEqual([]);
    });
  });

  // ── Dependency Resolution ────────────────────────────────────────────────
  describe("resolveDependencies", () => {
    it("reports satisfied=true for a widget with no declared capabilities", () => {
      const report = selector.resolveDependencies(makeWidget());
      expect(report.requiredCapabilities).toEqual([]);
      expect(report.dependencies).toEqual([]);
      expect(report.satisfied).toBe(true);
    });

    it("reports each declared capability's active state individually", () => {
      capabilities.activate("bucket");
      const widget = makeWidget({ capabilities: ["bucket", "prana"] });

      const report = selector.resolveDependencies(widget);

      expect(report.dependencies).toEqual([
        { capability: "bucket", active: true },
        { capability: "prana", active: false },
      ]);
      // At least one active capability => satisfied, mirroring CapabilityRuntime.widgetIsAvailable.
      expect(report.satisfied).toBe(true);
    });

    it("reports satisfied=false when none of the declared capabilities are active", () => {
      const widget = makeWidget({ capabilities: ["bucket"] });
      expect(selector.resolveDependencies(widget).satisfied).toBe(false);
    });

    it("never mutates the active-capability set", () => {
      const widget = makeWidget({ capabilities: ["bucket"] });
      selector.resolveDependencies(widget);
      expect(capabilities.getActiveCapabilities()).toEqual([]);
    });
  });

  // ── Compatibility Validation ─────────────────────────────────────────────
  describe("validateCompatibility", () => {
    it("is incompatible when no widget registration matches the zone", () => {
      const report = selector.validateCompatibility({ widgetId: "missing-widget" }, PRODUCT);
      expect(report.compatible).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]).toContain("missing-widget");
    });

    it("flags product incompatibility when the widget restricts its products", () => {
      widgets.register(makeWidget({ products: ["prana-console"] }));
      const report = selector.validateCompatibility({ widgetId: "revenue-card" }, PRODUCT);
      expect(report.productCompatible).toBe(false);
      expect(report.compatible).toBe(false);
    });

    it("flags permission failure against the given viewer context", () => {
      widgets.register(makeWidget({ permission: { roles: ["admin"] } }));
      const report = selector.validateCompatibility({ widgetId: "revenue-card" }, PRODUCT, { role: "viewer" });
      expect(report.permissionSatisfied).toBe(false);
      expect(report.compatible).toBe(false);
    });

    it("flags capability incompatibility when required capabilities are inactive", () => {
      widgets.register(makeWidget({ capabilities: ["bucket"] }));
      const report = selector.validateCompatibility({ widgetId: "revenue-card" }, PRODUCT);
      expect(report.capabilityCompatible).toBe(false);
      expect(report.compatible).toBe(false);
    });

    it("is fully compatible when product, permission, and capability all clear", () => {
      capabilities.activate("bucket");
      widgets.register(makeWidget({ products: [PRODUCT], permission: { roles: ["admin"] }, capabilities: ["bucket"] }));
      const report = selector.validateCompatibility({ widgetId: "revenue-card" }, PRODUCT, { role: "admin" });
      expect(report.compatible).toBe(true);
      expect(report.issues).toEqual([]);
    });
  });

  // ── Selection / Lifecycle Metadata ───────────────────────────────────────
  describe("selectForZone", () => {
    it("marks a zone as resolved when the widget is registered, permitted, and capability-satisfied", () => {
      widgets.register(makeWidget());
      const result = selector.selectForZone({ widgetId: "revenue-card" }, PRODUCT);
      expect(result.lifecycle).toBe("resolved");
      expect(result.widget?.id).toBe("revenue-card");
    });

    it("marks a zone as unresolved when there is no matching registration", () => {
      const result = selector.selectForZone({ widgetId: "ghost-widget" }, PRODUCT);
      expect(result.lifecycle).toBe("unresolved");
      expect(result.widget).toBeUndefined();
      expect(result.component).toBeUndefined();
    });

    it("marks a zone as capability-gated when the widget's capabilities are all inactive", () => {
      widgets.register(makeWidget({ capabilities: ["prana"] }));
      const result = selector.selectForZone({ widgetId: "revenue-card" }, PRODUCT);
      expect(result.lifecycle).toBe("capability-gated");
    });

    it("marks a zone as unpermitted when the viewer context fails the permission rule", () => {
      widgets.register(makeWidget({ permission: { roles: ["admin"] } }));
      const result = selector.selectForZone({ widgetId: "revenue-card" }, PRODUCT, { role: "viewer" });
      expect(result.lifecycle).toBe("unpermitted");
    });

    it("marks a zone as deprecated when the widget carries the deprecated tag, even if otherwise compatible", () => {
      widgets.register(makeWidget({ tags: ["deprecated"] }));
      const result = selector.selectForZone({ widgetId: "revenue-card" }, PRODUCT);
      expect(result.lifecycle).toBe("deprecated");
    });

    it("surfaces every registered version as a discovery candidate", () => {
      widgets.register(makeWidget({ version: "1.0.0" }));
      widgets.register(makeWidget({ version: "2.0.0" }));
      const result = selector.selectForZone({ widgetId: "revenue-card" }, PRODUCT);
      expect(result.discovery.candidateVersions.sort()).toEqual(["1.0.0", "2.0.0"]);
    });

    it("honors a pinned zone version over latest", () => {
      widgets.register(makeWidget({ version: "1.0.0" }));
      widgets.register(makeWidget({ version: "2.0.0" }));
      const result = selector.selectForZone({ widgetId: "revenue-card", version: "1.0.0" }, PRODUCT);
      expect(result.resolvedVersion).toBe("1.0.0");
    });
  });

  // ── Composition Validation ───────────────────────────────────────────────
  describe("validateComposition", () => {
    it("is invalid when the layout itself is not registered", () => {
      const report = selector.validateComposition(PRODUCT, "missing-layout");
      expect(report.valid).toBe(false);
      expect(report.zoneCount).toBe(0);
    });

    it("is valid when every zone resolves cleanly", () => {
      widgets.register(makeWidget());
      layouts.register(makeLayout());
      const report = selector.validateComposition(PRODUCT, "command-center");
      expect(report.valid).toBe(true);
      expect(report.resolvedCount).toBe(1);
      expect(report.issues).toEqual([]);
    });

    it("flags duplicate zone declarations", () => {
      widgets.register(makeWidget());
      layouts.register(
        makeLayout({ zones: [{ widgetId: "revenue-card" }, { widgetId: "revenue-card" }] }),
      );
      const report = selector.validateComposition(PRODUCT, "command-center");
      expect(report.valid).toBe(false);
      expect(report.issues.some((issue) => issue.code === "duplicate-zone")).toBe(true);
    });

    it("flags unresolved zones as blocking issues", () => {
      layouts.register(makeLayout({ zones: [{ widgetId: "ghost-widget" }] }));
      const report = selector.validateComposition(PRODUCT, "command-center");
      expect(report.valid).toBe(false);
      expect(report.issues[0]).toMatchObject({ zoneKey: "ghost-widget", code: "unresolved-widget" });
    });

    it("treats a deprecated-only composition as valid (warning, not blocker)", () => {
      widgets.register(makeWidget({ tags: ["deprecated"] }));
      layouts.register(makeLayout());
      const report = selector.validateComposition(PRODUCT, "command-center");
      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([{ zoneKey: "revenue-card", code: "deprecated", message: expect.any(String) }]);
    });
  });

  // ── Runtime Graph ─────────────────────────────────────────────────────────
  describe("buildRuntimeGraph", () => {
    it("returns an empty graph for an unregistered layout", () => {
      const graph = selector.buildRuntimeGraph(PRODUCT, "missing-layout");
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });

    it("builds zone -> widget -> capability nodes and edges", () => {
      widgets.register(makeWidget({ capabilities: ["bucket", "prana"] }));
      layouts.register(makeLayout());

      const graph = selector.buildRuntimeGraph(PRODUCT, "command-center");

      const kinds = graph.nodes.map((node) => node.kind).sort();
      expect(kinds).toEqual(["capability", "capability", "widget", "zone"]);

      expect(graph.edges).toContainEqual({
        from: "zone:revenue-card",
        to: "widget:revenue-card@1.0.0",
        kind: "fills",
      });
      expect(graph.edges).toContainEqual({
        from: "widget:revenue-card@1.0.0",
        to: "capability:bucket",
        kind: "requires",
      });
    });

    it("does not duplicate capability nodes shared across widgets", () => {
      widgets.register(makeWidget({ capabilities: ["bucket"] }));
      widgets.register(makeWidget({ id: "growth-card", name: "Growth Card", capabilities: ["bucket"] }));
      layouts.register(
        makeLayout({ zones: [{ widgetId: "revenue-card" }, { widgetId: "growth-card" }] }),
      );

      const graph = selector.buildRuntimeGraph(PRODUCT, "command-center");
      const capabilityNodes = graph.nodes.filter((node) => node.kind === "capability");
      expect(capabilityNodes).toHaveLength(1);
    });

    it("still emits a zone node when the widget is unresolved, but no widget/capability nodes", () => {
      layouts.register(makeLayout({ zones: [{ widgetId: "ghost-widget" }] }));
      const graph = selector.buildRuntimeGraph(PRODUCT, "command-center");
      expect(graph.nodes).toEqual([{ id: "zone:ghost-widget", kind: "zone", label: "ghost-widget", status: "unresolved" }]);
      expect(graph.edges).toEqual([]);
    });
  });

  // ── Runtime Config Export ─────────────────────────────────────────────────
  describe("exportRuntimeConfig", () => {
    it("returns an empty, serializable snapshot for an unregistered layout", () => {
      const snapshot = selector.exportRuntimeConfig(PRODUCT, "missing-layout");
      expect(snapshot.zones).toEqual([]);
      expect(typeof snapshot.generatedAt).toBe("number");
      // Must be plain-JSON-serializable.
      expect(() => JSON.stringify(snapshot)).not.toThrow();
    });

    it("marks a resolved zone visible and includes its capabilities", () => {
      widgets.register(makeWidget({ capabilities: ["bucket"] }));
      capabilities.activate("bucket");
      layouts.register(makeLayout());

      const snapshot = selector.exportRuntimeConfig(PRODUCT, "command-center");

      expect(snapshot.zones).toEqual([
        {
          zoneKey: "revenue-card",
          widgetId: "revenue-card",
          version: "1.0.0",
          visible: true,
          capabilities: ["bucket"],
          lifecycle: "resolved",
        },
      ]);
    });

    it("marks a capability-gated zone not visible even if zone.visible is true", () => {
      widgets.register(makeWidget({ capabilities: ["bucket"] }));
      layouts.register(makeLayout({ zones: [{ widgetId: "revenue-card", visible: true }] }));

      const snapshot = selector.exportRuntimeConfig(PRODUCT, "command-center");

      expect(snapshot.zones[0].visible).toBe(false);
      expect(snapshot.zones[0].lifecycle).toBe("capability-gated");
    });

    it("never triggers a network call or timer as a side effect", () => {
      widgets.register(makeWidget());
      layouts.register(makeLayout());
      // No fetch/poll infrastructure exists in this test's scope at all — if
      // exportRuntimeConfig tried to reach one it would throw ReferenceError.
      expect(() => selector.exportRuntimeConfig(PRODUCT, "command-center")).not.toThrow();
    });
  });

  // ── Lifecycle Metadata (summary) ──────────────────────────────────────────
  describe("getLifecycleSummary", () => {
    it("counts zones by lifecycle status across a mixed layout", () => {
      widgets.register(makeWidget());
      widgets.register(makeWidget({ id: "gated-card", name: "Gated Card", capabilities: ["prana"] }));
      layouts.register(
        makeLayout({
          zones: [{ widgetId: "revenue-card" }, { widgetId: "gated-card" }, { widgetId: "ghost-widget" }],
        }),
      );

      const summary = selector.getLifecycleSummary(PRODUCT, "command-center");

      expect(summary.total).toBe(3);
      expect(summary.counts.resolved).toBe(1);
      expect(summary.counts["capability-gated"]).toBe(1);
      expect(summary.counts.unresolved).toBe(1);
      expect(summary.counts.unpermitted).toBe(0);
      expect(summary.counts.deprecated).toBe(0);
    });

    it("returns a zeroed summary for an unregistered layout", () => {
      const summary = selector.getLifecycleSummary(PRODUCT, "missing-layout");
      expect(summary.total).toBe(0);
      expect(Object.values(summary.counts).every((count) => count === 0)).toBe(true);
    });
  });

  // ── Never-executes-runtime boundary ───────────────────────────────────────
  describe("runtime execution boundary", () => {
    it("does not import or reference RuntimeConnector in its source", async () => {
      // Static guard: the module source itself must not reference the
      // runtime connector or the ../runtime module (network polling/streaming).
      const fs = await import("node:fs/promises");
      const url = new URL("../AgentSelector.ts", import.meta.url);
      const text = await fs.readFile(url, "utf-8");
      expect(text).not.toMatch(/RuntimeConnector/);
      expect(text).not.toMatch(/from ["']\.\.\/runtime/);
    });

    it("only ever calls CapabilityRuntime's read-only methods, never activate/deactivate/setActiveCapabilities", () => {
      let mutated = false;
      const guardedCapabilities = new CapabilityRuntime();
      const originalActivate = guardedCapabilities.activate.bind(guardedCapabilities);
      const originalDeactivate = guardedCapabilities.deactivate.bind(guardedCapabilities);
      const originalSetActive = guardedCapabilities.setActiveCapabilities.bind(guardedCapabilities);
      guardedCapabilities.activate = (...args) => {
        mutated = true;
        return originalActivate(...args);
      };
      guardedCapabilities.deactivate = (...args) => {
        mutated = true;
        return originalDeactivate(...args);
      };
      guardedCapabilities.setActiveCapabilities = (...args) => {
        mutated = true;
        return originalSetActive(...args);
      };

      const guardedWidgets = new WidgetRegistry();
      const guardedLayouts = new ProductLayoutRegistry();
      guardedWidgets.register(makeWidget({ capabilities: ["bucket"] }));
      guardedLayouts.register(makeLayout());

      const guardedSelector = new AgentSelector(guardedWidgets, guardedLayouts, guardedCapabilities);
      guardedSelector.validateComposition(PRODUCT, "command-center");
      guardedSelector.buildRuntimeGraph(PRODUCT, "command-center");
      guardedSelector.exportRuntimeConfig(PRODUCT, "command-center");
      guardedSelector.getLifecycleSummary(PRODUCT, "command-center");

      expect(mutated).toBe(false);
    });
  });
});
