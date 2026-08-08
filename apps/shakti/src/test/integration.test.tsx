import { describe, test, expect, vi } from "vitest";
import { fetchSystemStatus, fetchMetrics } from "@/api/endpoints";
import { fetchBucketArtifacts, fetchBucketStorageStats, bucketClient } from "@/api/bucketEndpoints";
import { fetchPranaHealth, fetchPranaPropagationLog, pranaClient } from "@/api/pranaEndpoints";
import { apiClient } from "@/api/client";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("Control Plane, Bucket & PRANA Integration Normalization", () => {
  test("fetchSystemStatus transforms services map into components array", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        timestamp: "2026-07-24T05:20:44.685855+00:00",
        overall_status: "degraded",
        uptime_seconds: 3963.619,
        services: {
          prompt_runner: { status: "healthy", pid: 26472, port: 8003, restarts: 2, healthy: true },
          bhiv_core: { status: "CRASH_LOOPING", pid: 25548, port: 8001, restarts: 2, healthy: false },
        },
        active_alerts: 0,
      },
    });

    const res = await fetchSystemStatus();

    expect(res.overall_status).toBe("degraded");
    expect(res.components).toHaveLength(2);
    expect(res.components[0].name).toBe("prompt_runner");
    expect(res.components[0].status).toBe("operational");
    expect(res.components[1].name).toBe("bhiv_core");
    expect(res.components[1].status).toBe("crash_looping");
  });

  test("fetchMetrics maps nested requests and latency_ms correctly", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        timestamp: "2026-07-24T05:20:52.807577+00:00",
        uptime_seconds: 3963.619,
        services: { total: 10, healthy: 9, degraded: 1 },
        requests: { total: 150, errors: 0, per_minute: 10, error_rate_pct: 0, success_rate_pct: 100 },
        latency_ms: { p50: 12, p95: 45 },
        alerts: { active_count: 0 },
        replay: { queue_depth: 0 },
      },
    });

    const res = await fetchMetrics();

    expect(res.total_requests).toBe(150);
    expect(res.success_rate).toBe(100);
    expect(res.failed_requests).toBe(0);
    expect(res.average_response_time_ms).toBe(45);
    expect(res.services?.healthy).toBe(9);
  });

  test("fetchBucketArtifacts handles response correctly", async () => {
    vi.spyOn(bucketClient, "get").mockResolvedValueOnce({
      data: {
        artifacts: [
          {
            artifact_id: "art_01",
            trace_id: "tr_01",
            timestamp_utc: "2026-07-24T06:00:00Z",
            schema_version: "1.0.0",
            source_module_id: "creator_core",
            artifact_type: "blueprint",
          },
        ],
        count: 1,
        total: 1,
        offset: 0,
        limit: 50,
        storage_type: "append_only",
      },
    } as any);

    const res = await fetchBucketArtifacts();
    expect(res.artifacts).toHaveLength(1);
    expect(res.artifacts[0].artifact_id).toBe("art_01");
    expect(res.artifacts[0].artifact_type).toBe("blueprint");
  });

  test("fetchBucketStorageStats fetches storage metrics", async () => {
    vi.spyOn(bucketClient, "get").mockResolvedValueOnce({
      data: {
        statistics: {
          artifact_count: 42,
          last_hash: "hash_xyz",
          log_file_size_bytes: 1048576,
          log_file_size_mb: 1.0,
          storage_path: "data/artifacts",
          schema_version: "1.0.0",
          max_payload_size_mb: 16,
        },
        status: "healthy",
        certification: "append_only_enforced",
      },
    } as any);

    const res = await fetchBucketStorageStats();
    expect(res.statistics.artifact_count).toBe(42);
    expect(res.certification).toBe("append_only_enforced");
  });

  test("fetchPranaHealth fetches PRANA health status", async () => {
    vi.spyOn(pranaClient, "get").mockResolvedValueOnce({
      data: {
        status: "healthy",
        service: "PRANA",
        forwarding_enabled: true,
      },
    } as any);

    const res = await fetchPranaHealth();
    expect(res.status).toBe("healthy");
    expect(res.service).toBe("PRANA");
    expect(res.forwarding_enabled).toBe(true);
  });

  test("fetchPranaPropagationLog normalizes propagation log entries", async () => {
    vi.spyOn(pranaClient, "get").mockResolvedValueOnce({
      data: [
        {
          logged_at: "2026-07-24T09:00:00Z",
          trace_id: "trace_p1",
          destination: "bucket_storage",
          status: "success",
          http_status: 200,
          attempt: 1,
        },
      ],
    } as any);

    const res = await fetchPranaPropagationLog();
    expect(res.logs).toHaveLength(1);
    expect(res.logs[0].trace_id).toBe("trace_p1");
    expect(res.logs[0].destination).toBe("bucket_storage");
  });
});
