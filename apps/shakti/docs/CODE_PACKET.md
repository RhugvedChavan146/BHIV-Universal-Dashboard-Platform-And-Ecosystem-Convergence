# Code Packet

This document serves as an index for developers onboarding onto the SHAKTI Dashboard Capability.

## Core File Index

### 1. Configuration & Layout
- `packages/dashboard-platform/src/config/` - The beating heart of the capability, extracted as reusable platform infrastructure (`DashboardProvider`, `useDashboardConfig`, the generic `DashboardConfig` contract).
- `src/types/dashboard.types.ts` - SHAKTI's concrete zone map, layered on top of the platform's generic config contract.
- `src/config/dashboard.config.ts` - SHAKTI's default config values (branding, zone labels, feature flags).
- `src/pages/Dashboard.tsx` - The CSS Grid root. Consumes the provider config and lazy-loads the 10 layout components.
- `src/layouts/DashboardLayout.tsx` - The global application shell, containing the Header and the offline state banner.

### 2. Layouts (Smart Components)
Located in `src/components/dashboard/layouts/`
These files are responsible for fetching data via React Query and memoizing it before passing it down.
- `ExecutiveLayout.tsx`
- `OperationsLayout.tsx`
- `DecisionIntelligenceLayout.tsx`
- `ObservabilityLayout.tsx`
- ...

### 3. Primitives (Dumb Components)
Located in `src/components/dashboard/primitives/`
These are purely presentational. They do not fetch data.
- `ExecutiveMetricCard.tsx`
- `TimelineCard.tsx`
- `CapabilityCard.tsx`

### 4. Utilities & Hooks
- `src/hooks/useQueries.ts` - All TanStack Query integrations.
- `src/api/client.ts` - The Axios instance with 8000ms timeouts and error interception.
- `packages/utils/src/logger.ts` - Structured logging utility (re-exported as `logger` from `@bhiv/utils`). JSON records in production, readable console output in dev.
- `src/hooks/useAuth.ts` & `src/hooks/useAuthorization.ts` - Authentication and RBAC stubs.

### 5. Production Hardening
Added in the repository-hardening pass — see `HARDENING.md` at the repo root for the full rundown and run instructions.
- `src/config/env.ts` - Validates required `VITE_*` vars (and checks optional ones are well-formed URLs) before the app renders. Throws `EnvValidationError` with every problem found, not just the first.
- `src/main.tsx` - Calls `validateEnv()` at startup; on failure renders a readable error screen instead of a blank page or a deep runtime crash.
- `public/health.json` - Static health fallback for plain static hosts (Vercel/Netlify/S3).
- `Dockerfile`, `docker-compose.yml`, `docker/nginx.conf` (repo root) - Multi-stage container build; nginx serves the built app with a real `GET /health` route and SPA fallback.
- `.gitignore`, `.dockerignore` (repo root) - Standard excludes for `node_modules`, `dist`, `.env`, logs, coverage, editor/OS files.
- `DEPENDENCY_AUDIT.md` (repo root) - Records what was removed from `devDependencies` and why.

## Developer Quick Start
To modify a specific zone:
1. Locate the Layout in `src/components/dashboard/layouts/`.
2. Do not add raw HTML/Tailwind here. If you need a new visual element, create a Primitive first in `src/components/dashboard/primitives/`.
3. Wrap your new Primitive inside the Layout's `<DashboardCard>`.
