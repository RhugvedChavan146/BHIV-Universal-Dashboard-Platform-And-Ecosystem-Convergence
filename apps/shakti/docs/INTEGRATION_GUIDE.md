# Integration Guide

How to integrate SHAKTI Executive Dashboard into existing Backend Control Planes.

## Base URL Configuration
The API URL is controlled strictly via environment variables.

1. Create a `.env.local` file.
2. Define the endpoint:
```env
VITE_CONTROL_PLANE_URL=https://api.internal.shakti.gov/v1/control-plane
```

## Mocking API Data
If you are developing without a backend, the dashboard expects JSON payloads adhering exactly to the TypeScript interfaces defined in `src/types/runtime.ts` (and, for the Bucket/PRANA/InsightFlow/Niyantran services, `src/types/bucket.ts`, `src/types/prana.ts`, `src/types/insightflow.ts`, `src/types/niyantran.ts` respectively).

Example Endpoint Expectation for `/dashboard/executive`:
```json
{
  "summary": [
    { "metric": "total_load", "value": "84%", "trend": "up", "status": "warning" }
  ],
  "capabilities": {
    "auto_scaling": true,
    "failover": false
  }
}
```

## Authentication & Authorization
Currently, auth is mocked on the frontend for development speed.
- Refer to `src/hooks/useAuth.ts` and `src/hooks/useAuthorization.ts`.
- To integrate with a real backend, replace the mock returns in these hooks with your standard JWT decoding logic or OAuth provider hooks (like `useSession()` from NextAuth).
- The rest of the dashboard uses `hasRole()` and `hasPermission()` from these hooks, so the UI will adapt automatically once the integration is swapped.
