# SHAKTI Command Center — Handover

## For whoever picks this up next

Quick orientation, plus what changed in the most recent (repository-hardening) pass, so you're not re-discovering things from scratch.

---

## 1. What this is

The SHAKTI Runtime Integration & Operational Command Center — a Vite/React dashboard app inside an npm-workspaces monorepo (`apps/shakti` + four `@bhiv/*` packages). See `CODE_PACKET.md` for the file index and `REVIEW_PACKET.md` for the architecture/component inventory. It's a pure frontend: no backend lives in this repo, it talks to external services over the URLs in `apps/shakti/.env`.

## 2. Current state

| Check | Status |
|---|---|
| TypeScript (`tsc -b`) | ✅ clean on every file touched in the hardening pass |
| Production build (`vite build`) | ✅ passes |
| Containerized deploy | ✅ `Dockerfile` + `docker-compose.yml`, real `/health` endpoint |
| Known pre-existing test failures | 5 tests (see §4) — not introduced by this pass, not yet fixed |

## 3. What changed in the hardening pass

Full detail in `HARDENING.md` (repo root). Short version:

- **Docker** — multi-stage `Dockerfile`, `docker-compose.yml`, `docker/nginx.conf` (all at repo root, build from the root so `@bhiv/*` workspace resolution works).
- **Health endpoint** — real `GET /health` via nginx; static `apps/shakti/public/health.json` fallback for hosts that can't run custom nginx config.
- **Config + startup validation** — `apps/shakti/src/config/env.ts` checks required/optional `VITE_*` vars before the app renders; `main.tsx` shows a readable error screen (not a blank page) if something's missing or malformed.
- **Structured logging** — `packages/utils/src/logger.ts` (`@bhiv/utils`) now emits JSON log records in production; same call signatures as before, no other file needed to change.
- **Repo hygiene** — root `.gitignore` / `.dockerignore`.
- **Dependency cleanup** — see `DEPENDENCY_AUDIT.md`: 4 unused devDependencies removed (dead React Compiler wiring), 1 left flagged for a judgment call.

**Nothing was deleted** from the original app — this was an additive pass plus two small edits (`main.tsx`, `logger.ts`) and one `package.json` trim.

## 4. Known pre-existing issues (not from this pass)

Carried over from before the hardening work, still open:

- `src/test/DecisionIntelligenceLayout.test.tsx` and part of `src/test/layouts.test.tsx` (5 tests total) fail with `No QueryClient set, use QueryClientProvider to set one` — those test files render layouts without wrapping them in a `QueryClientProvider`.
- `apps/shakti/.env` carries a live `VITE_NIYANTRAN_AUTH_TOKEN` (JWT) and `VITE_NIYANTRAN_EXECUTION_KEY`. It predates `.gitignore` being added, so **if this repo has ever been pushed to a remote, that token is already in git history**. Rotate it.
- `REVIEW_PACKET.md`'s architecture tables (zone count, endpoint list) are stale relative to the current code — `apps/shakti/README.md` and `widgets.registry.ts` reflect the real, current 19-zone setup. Not reconciled yet.

## 5. How to run it

**Local dev:**
```bash
npm install
npm run dev          # → http://localhost:5173
```
Uses `apps/shakti/.env` directly — no template file to copy.

**Docker:**
```bash
cp apps/shakti/.env .env    # root .env, read by docker-compose for build args
docker compose up --build
curl http://localhost:8080/health   # {"status":"ok"}
```

Step-by-step detail (including a no-Compose Docker path) is in `HARDENING.md`.

## 6. Where to look next

| Question | Doc |
|---|---|
| "What files make up X feature?" | `CODE_PACKET.md` |
| "What's the architecture / component inventory?" | `REVIEW_PACKET.md` |
| "How do I deploy this?" | `DEPLOYMENT_GUIDE.md` |
| "What changed in the hardening pass, and why?" | `HARDENING.md` (repo root) |
| "What dependencies were removed and why?" | `DEPENDENCY_AUDIT.md` (repo root) |
| "What are the intentional trade-offs / design rationale?" | `REVIEWER_NOTES.md` |
