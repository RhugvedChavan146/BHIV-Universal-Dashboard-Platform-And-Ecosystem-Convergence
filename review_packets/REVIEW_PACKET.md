# SHAKTI Command Center — Executive Review & Architecture Packet

## 1. Executive Summary & System Identity

| Field | Value |
| :--- | :--- |
| **Project** | SHAKTI Universal Dashboard Platform & Ecosystem Convergence |
| **Workspace Architecture** | Monorepo (`apps/shakti` + 4 packages: `@bhiv/dashboard-sdk`, `@bhiv/dashboard-layout`, `@bhiv/ui`, `@bhiv/utils`) |
| **Core Technology Stack** | React 19 · TypeScript 6 · Vite 8 · TanStack Query 5 · Recharts 3 · Tailwind CSS 4 |
| **Build Status** | ✅ Monorepo compilation passes (`npm run build:packages && npm run build:shakti`) |
| **Test Verification** | ✅ 102/104 SDK & App tests passing; 5 UI layout tests require `QueryClientProvider` test wrapper |
| **Deployment Status** | ✅ Multi-stage Dockerized build with static Nginx fallback & native `GET /health` probe |

---

## 2. End-to-End Runtime Chain & Boundary Classifications

The runtime architecture follows a strict 8-step pipeline:  
`UI → API → Registry → Live Node → Capability → Bucket → InsightFlow → Replay`

| Step | Boundary | Classification | Technical Evidence & Implementation Seam |
| :---: | :--- | :---: | :--- |
| **1** | `UI → API` | **PROVEN** | [`apps/shakti/src/pages/Dashboard.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/pages/Dashboard.tsx) renders layout zones powered by TanStack Query hooks in [`useQueries.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/hooks/useQueries.ts). Axios clients in [`client.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/api/client.ts) automatically parse and extract `x-trace-id` / `traceparent` headers into response data. |
| **2** | `API → Registry` | **UNPROVEN** | Inbound snapshot queries from Control Plane REST `/registry/*` endpoints are fully operational, but outbound `RegistryAdapter` submission envelopes ([`packages/dashboard-sdk/src/registries/types.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/packages/dashboard-sdk/src/registries/types.ts#L52-L57)) remain contract-only without active HTTP implementations. |
| **3** | `Registry → Live Node` | **PROVEN** (Polling)<br>**UNPROVEN** (Streaming) | [`fetchSystemStatus`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/api/endpoints.ts#L34-L53) maps Control Plane `/system/status` responses into live node components (PID, port, restarts). Push streaming via [`RuntimeConnector.attachTransport`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/packages/dashboard-sdk/src/runtime/RuntimeConnector.ts#L51) is currently unattached. |
| **4** | `Live Node → Capability` | **UNPROVEN** | 19 widget capabilities are statically declared in [`widgets.registry.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/config/widgets.registry.ts#L30-L183) and evaluated via [`CapabilityRuntime.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/packages/dashboard-sdk/src/registry/CapabilityRuntime.ts). Dynamic activation from live node event streams is hardcoded to unconditional boot activation. |
| **5** | `Capability → Bucket` | **PROVEN** | Capability zones like [`EvidenceLayout.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/components/dashboard/layouts/EvidenceLayout.tsx) query `/bucket/*` and `/audit/*` endpoints, correlated with trace IDs via `buildTraceLineage()`. |
| **6** | `Bucket → InsightFlow` | **PROVEN** | [`insightflowEndpoints.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/api/insightflowEndpoints.ts#L74-L94) queries `GET /bucket/status` directly on InsightFlow backend to monitor sync percentages and write states. |
| **7** | `InsightFlow → Replay` | **UNPROVEN** | [`ReplayLayout.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/apps/shakti/src/components/dashboard/layouts/ReplayLayout.tsx) and SDK `buildTraceLineage()` correlate InsightFlow telemetry items with Replay records matching `traceId`. Active time-travel re-execution back onto live engines is in-memory/visualization only ([`replay.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/packages/dashboard-sdk/src/observability/replay.ts#L11-L14)). |

---

## 3. Evidence Packet Structure

All supporting evidence artifacts are structured inside [`evidence_packet/`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/):

```
evidence_packet/
├── code_packet/
│   ├── INDEX.md                  # Proof file directory with one-line reasons
│   ├── main.tsx                  # App entrypoint & env validation proof
│   ├── widgets.registry.ts       # 19 widget registrations & capability activation proof
│   ├── client.ts                 # Axios client & trace ID interceptor proof
│   ├── traceLineage.ts           # SDK cross-service trace correlation proof
│   ├── CapabilityRuntime.ts      # In-memory capability evaluation engine proof
│   └── EvidenceLayout.tsx        # Cross-service provenance UI rendering proof
├── runtime_logs/
│   └── vitest_test_run.log       # Real Vitest output showing 102 passing tests & exact tracebacks
├── api_samples/
│   ├── control_plane_contract.json  # Machine-readable REST API contract manifest
│   └── bucket_artifacts_sample.json # Response payload structure with trace_id
└── deployment_proof/
    ├── Dockerfile.proof          # Multi-stage Docker build configuration
    └── docker-compose.proof.yml  # Microservice orchestration composition
```

---

## 4. Minimum Proof Files Index (`code_packet`)

| Proof File | Source File Path | One-Line Reason |
| :--- | :--- | :--- |
| [`main.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/main.tsx) | `apps/shakti/src/main.tsx` | Proves application bootstrap, fail-fast environment validation (`validateEnv`), and TanStack QueryClient initialization. |
| [`widgets.registry.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/widgets.registry.ts) | `apps/shakti/src/config/widgets.registry.ts` | Proves registration of 19 SHAKTI widgets in `globalDashboardRegistry` and initial capability activation on `globalCapabilityRuntime`. |
| [`client.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/client.ts) | `apps/shakti/src/api/client.ts` | Proves HTTP REST client setup with interceptors automatically extracting `x-trace-id` / `traceparent` headers. |
| [`traceLineage.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/traceLineage.ts) | `packages/dashboard-sdk/src/runtime/traceLineage.ts` | Proves SDK cross-service trace correlation algorithm (`buildTraceLineage`) unifying execution, replay, bucket, and telemetry nodes by `traceId`. |
| [`CapabilityRuntime.ts`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/CapabilityRuntime.ts) | `packages/dashboard-sdk/src/registry/CapabilityRuntime.ts` | Proves in-memory capability activation engine used by `AgentSelector` to gate widget rendering. |
| [`EvidenceLayout.tsx`](file:///c:/reusable%20dashboard/BHIV_Universal_Dashboard_Platform/evidence_packet/code_packet/EvidenceLayout.tsx) | `apps/shakti/src/components/dashboard/layouts/EvidenceLayout.tsx` | Proves UI rendering of cross-service provenance lineage connecting Bucket artifacts, audit logs, and execution traces. |

---

## 5. Identified Architectural Gaps & Recommendations

1. **Registry Participation Adapters**: Implement concrete HTTP submission adapters for `@bhiv/dashboard-sdk`'s `RegistryAdapter` interface so local client state envelopes can be posted upstream to external registry services.
2. **Live Capability Event Feed**: Fulfill the `widgets.registry.ts` TODO by replacing boot-time unconditional activation with a dynamic listener that subscribes to node health updates from Control Plane / PRANA.
3. **Push Streaming Transports**: Attach WebSocket/SSE transport adapters to `RuntimeConnector.ts` to replace HTTP polling with real-time push telemetry.
4. **Time-Travel Workflow Execution Engine**: Bridge the `ReplayLog` metadata layer to an active workflow execution worker capable of re-evaluating historical trace inputs against InsightFlow / Sarathi execution nodes.
