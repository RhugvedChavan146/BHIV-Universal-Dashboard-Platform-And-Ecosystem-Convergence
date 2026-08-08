# Deployment Guide

The SHAKTI Executive Dashboard is a standard Vite React Application. It compiles to static HTML/CSS/JS files and can be hosted on any static file server or CDN (S3, NGINX, Vercel, Netlify).

## 1. Prerequisites
- Node.js 18+ or 20+
- NPM or PNPM

## 2. Environment Setup
Ensure your CI/CD environment injects the correct backend URLs during build time — Vite bakes `VITE_*` vars into the JS bundle at **build time**, not at server start.

```bash
export VITE_CONTROL_PLANE_URL=https://api.production.internal/v1   # required
export VITE_BUCKET_SERVICE_URL=https://bucket.production.internal  # optional
export VITE_PRANA_SERVICE_URL=https://prana.production.internal    # optional
export VITE_NIYANTRAN_URL=https://niyantran.production.internal    # optional
export VITE_NIYANTRAN_EXECUTION_KEY=...                            # optional
export VITE_NIYANTRAN_AUTH_TOKEN=...                                # optional
export VITE_INSIGHTFLOW_URL=https://insightflow.production.internal # optional
```

**Configuration validation:** `src/config/env.ts` checks these at app startup. `VITE_CONTROL_PLANE_URL` is required and must be a valid URL; the optional ones, if set, must also be valid URLs. If anything's missing or malformed, the app renders a readable error screen listing every problem instead of a blank page or a confusing runtime failure — check this first if a deploy looks broken.

## 3. Production Build
Run the Vite build command:
```bash
npm run build
```
This command performs type-checking via `tsc -b` and then invokes Vite to bundle the application into the `/dist` directory.

### Build Outputs
Because the dashboard heavily utilizes `React.lazy` and `Suspense`, the `/dist/assets` directory will contain dozens of small JavaScript chunks rather than one massive `index.js`. 
- `ExecutiveLayout-[hash].js`
- `ObservabilityLayout-[hash].js`
This is intentional and required for performance. `/dist` also includes `health.json` — a static health fallback for hosts that can't run a custom nginx config (see §5).

## 4. Hosting — static file server / CDN
Upload the contents of the `/dist` folder to your web server.
**Important for Single Page Apps (SPA):** Ensure your web server is configured to rewrite all 404 requests to `index.html`. 

### NGINX Example
```nginx
server {
    listen 80;
    server_name dashboard.internal;
    root /var/www/shakti-dashboard;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 5. Hosting — Docker (recommended for containerized environments)
The repo root ships a multi-stage `Dockerfile` (install deps → `npm run build:packages && npm run build:shakti` → serve via nginx) plus a matching `docker-compose.yml` and `docker/nginx.conf`. Build from the **repo root**, not `apps/shakti`, so npm workspace resolution (`@bhiv/*`) works.

```bash
# One command — build args pull from a root-level .env
docker compose up --build
```
or without Compose:
```bash
docker build -t shakti-dashboard \
  --build-arg VITE_CONTROL_PLANE_URL=https://api.production.internal/v1 \
  .
docker run -p 8080:80 shakti-dashboard
```

This gives you, on top of the static-hosting setup above:
- A real `GET /health` endpoint (`docker/nginx.conf`), polled every 30s by the image's `HEALTHCHECK` — visible via `docker ps` and usable as an orchestrator liveness probe.
- SPA fallback, gzip, and basic security headers already configured.
- Content-hashed `/assets/*` cached for a year; everything else `no-cache`.

Full run instructions (including the local-dev-without-Docker path) are in `HARDENING.md` at the repo root.

