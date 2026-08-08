# Repository Hardening

Production-engineering pass over the SHAKTI dashboard monorepo. No files or
folders were removed — everything below is additive, plus two small edits
(`main.tsx`, `packages/utils/src/logger.ts`) and one dependency trim (see
`DEPENDENCY_AUDIT.md`).

## What changed

| Area | What was added / changed |
|---|---|
| `.gitignore` | Root-level, covers `node_modules`, `dist`, `.env*`, logs, coverage, editor/OS junk, Vite cache — across every workspace. |
| Repository cleanup | `apps/shakti/.env` (real URLs + a live JWT + exec key) was **not tracked by `.gitignore` before this pass** — see ⚠️ below. |
| Docker support | `Dockerfile` (multi-stage: install → build → nginx serve), `docker-compose.yml`, `docker/nginx.conf`, `.dockerignore`. |
| Environment configuration | `apps/shakti/src/vite-env.d.ts` extended to type every `VITE_*` var actually used. |
| Health endpoint | `GET /health` in `docker/nginx.conf` (real, for container/orchestrator probes) + static `apps/shakti/public/health.json` fallback for plain static hosts. |
| Structured logging | `packages/utils/src/logger.ts` now emits single-line JSON records (`timestamp`, `level`, `message`, `context`, `error`) in production, readable output in dev. Same call signatures as before — nothing else needed to change. |
| Configuration validation | `apps/shakti/src/config/env.ts` — validates required vars are set and optional URL vars are well-formed, collects *every* problem before reporting. |
| Startup validation | `apps/shakti/src/main.tsx` calls `validateEnv()` before rendering; on failure it renders a readable error screen (what's missing + how to fix it) instead of a blank page or a deep runtime crash. |
| Dependency cleanup | See `DEPENDENCY_AUDIT.md` — 4 unused devDependencies removed, 1 flagged for a judgment call. |

## ⚠️ Before you push this anywhere

`apps/shakti/.env` (kept, per "don't remove any file") contains a live
`VITE_NIYANTRAN_AUTH_TOKEN` (JWT) and `VITE_NIYANTRAN_EXECUTION_KEY`. It was
never in `.gitignore`, so if this repo has ever been pushed to a remote,
**that token is already in git history** even after `.gitignore` is added
now. Rotate it.

## Run it

### Option A — local dev (unchanged workflow)

1. Keep using your existing `apps/shakti/.env` — nothing to copy or rename.
2. `npm install` (root — installs all workspaces; also regenerates the
   lockfile after the dependency trim in `DEPENDENCY_AUDIT.md`).
3. `npm run dev` — starts the SHAKTI app. If a required var is missing or
   malformed you'll see a red error screen listing exactly what's wrong,
   instead of a blank page.

### Option B — Docker (new)

1. Create a root-level `.env` (Docker Compose reads this automatically for
   build args) with the same `VITE_*` keys as `apps/shakti/.env`, e.g.:
   ```bash
   cp apps/shakti/.env .env
   ```
2. Build and run:
   ```bash
   docker compose up --build
   ```
3. Open `http://localhost:8080`. Check the health endpoint directly:
   ```bash
   curl http://localhost:8080/health
   # {"status":"ok"}
   ```
4. Container health is also visible via `docker ps` (the `HEALTHCHECK` in
   the `Dockerfile` polls the same endpoint every 30s).

### Option C — Docker, no Compose

```bash
docker build -t shakti-dashboard \
  --build-arg VITE_CONTROL_PLANE_URL=https://api.production.internal/v1 \
  --build-arg VITE_BUCKET_SERVICE_URL=https://bucket.production.internal \
  .
docker run -p 8080:80 shakti-dashboard
```

Remember: Vite bakes `VITE_*` vars into the JS bundle **at build time**, not
at container start — pass the real values as `--build-arg` / Compose
`args`, not as `docker run -e`.
