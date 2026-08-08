import { describe, expect, it } from "vitest";
import { createStructuredLogger } from "../logger";

describe("StructuredLogger", () => {
  it("records a structured entry with an ISO timestamp, level, message, and source", () => {
    const log = createStructuredLogger({ source: "TestEngine" });
    const entry = log.info("hello");

    expect(entry.level).toBe("info");
    expect(entry.message).toBe("hello");
    expect(entry.source).toBe("TestEngine");
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });

  it("applies the logger's default product unless overridden per call", () => {
    const log = createStructuredLogger({ source: "TestEngine", product: "shakti" });
    expect(log.info("a").product).toBe("shakti");
    expect(log.info("b", { product: "prana-console" }).product).toBe("prana-console");
  });

  it("carries traceId and context through untouched", () => {
    const log = createStructuredLogger({ source: "TestEngine" });
    const entry = log.warn("careful", { traceId: "trace-1", context: { zoneKey: "revenue-card" } });
    expect(entry.traceId).toBe("trace-1");
    expect(entry.context).toEqual({ zoneKey: "revenue-card" });
  });

  it("keeps every level's entries in the ring buffer, oldest first", () => {
    const log = createStructuredLogger({ source: "TestEngine" });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(log.getEntries().map((entry) => entry.message)).toEqual(["d", "i", "w", "e"]);
  });

  it("evicts the oldest entry once bufferSize is exceeded", () => {
    const log = createStructuredLogger({ source: "TestEngine", bufferSize: 2 });
    log.info("one");
    log.info("two");
    log.info("three");
    expect(log.getEntries().map((entry) => entry.message)).toEqual(["two", "three"]);
  });

  it("filters entries by trace id", () => {
    const log = createStructuredLogger({ source: "TestEngine" });
    log.info("a", { traceId: "trace-1" });
    log.info("b", { traceId: "trace-2" });
    log.info("c", { traceId: "trace-1" });
    expect(log.getEntriesByTraceId("trace-1").map((entry) => entry.message)).toEqual(["a", "c"]);
  });

  it("clears the buffer on demand", () => {
    const log = createStructuredLogger({ source: "TestEngine" });
    log.info("a");
    log.clear();
    expect(log.getEntries()).toEqual([]);
  });

  it("keeps independent buffers across separate logger instances", () => {
    const a = createStructuredLogger({ source: "A" });
    const b = createStructuredLogger({ source: "B" });
    a.info("only in a");
    expect(a.getEntries()).toHaveLength(1);
    expect(b.getEntries()).toHaveLength(0);
  });
});
