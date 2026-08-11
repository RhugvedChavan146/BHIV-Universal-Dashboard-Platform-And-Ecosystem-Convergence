# Code Packet File Index

This code packet contains the minimum set of real source files proving the architectural boundaries and runtime implementation of SHAKTI. No mocks, fake evidence, or unrelated files are included.

| File | Source Location | One-Line Reason |
| :--- | :--- | :--- |
| [`main.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/main.tsx) | `apps/shakti/src/main.tsx` | Proves application bootstrap, fail-fast environment validation (`validateEnv`), and TanStack QueryClient initialization. |
| [`widgets.registry.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/widgets.registry.ts) | `apps/shakti/src/config/widgets.registry.ts` | Proves registration of 19 SHAKTI widgets in `globalDashboardRegistry` and initial capability activation on `globalCapabilityRuntime`. |
| [`client.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/client.ts) | `apps/shakti/src/api/client.ts` | Proves HTTP REST client setup with interceptors automatically extracting `x-trace-id` / `traceparent` headers. |
| [`traceLineage.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/traceLineage.ts) | `packages/dashboard-sdk/src/runtime/traceLineage.ts` | Proves SDK cross-service trace correlation algorithm (`buildTraceLineage`) unifying execution, replay, bucket, and telemetry nodes by `traceId`. |
| [`CapabilityRuntime.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/CapabilityRuntime.ts) | `packages/dashboard-sdk/src/registry/CapabilityRuntime.ts` | Proves in-memory capability activation engine used by `AgentSelector` to gate widget rendering. |
| [`EvidenceLayout.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/EvidenceLayout.tsx) | `apps/shakti/src/components/dashboard/layouts/EvidenceLayout.tsx` | Proves UI rendering of cross-service provenance lineage connecting Bucket artifacts, audit logs, and execution traces. |
