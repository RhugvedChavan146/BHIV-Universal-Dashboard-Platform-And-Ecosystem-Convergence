# syntax=docker/dockerfile:1
#
# Builds the SHAKTI dashboard (apps/shakti) out of the npm-workspaces
# monorepo and serves the static output through nginx. Build from the repo
# root so workspace package resolution (@bhiv/*) works:
#
#   docker build -t shakti-dashboard .
#
# See docker-compose.yml for the equivalent one-command version, and
# HARDENING.md for the full run instructions.

# ---- deps: install once, cached across builds unless package*.json change ----
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/shakti/package.json apps/shakti/package.json
COPY packages/dashboard-layout/package.json packages/dashboard-layout/package.json
COPY packages/dashboard-sdk/package.json packages/dashboard-sdk/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN npm ci

# ---- build: compile the workspace packages, then the shakti app ----
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Vite inlines VITE_* vars at build time, so they must be supplied as build
# args (docker-compose.yml wires these from the host environment / .env).
ARG VITE_CONTROL_PLANE_URL
ARG VITE_BUCKET_SERVICE_URL
ARG VITE_PRANA_SERVICE_URL
ARG VITE_NIYANTRAN_URL
ARG VITE_NIYANTRAN_EXECUTION_KEY
ARG VITE_NIYANTRAN_AUTH_TOKEN
ARG VITE_INSIGHTFLOW_URL
ENV VITE_CONTROL_PLANE_URL=$VITE_CONTROL_PLANE_URL \
    VITE_BUCKET_SERVICE_URL=$VITE_BUCKET_SERVICE_URL \
    VITE_PRANA_SERVICE_URL=$VITE_PRANA_SERVICE_URL \
    VITE_NIYANTRAN_URL=$VITE_NIYANTRAN_URL \
    VITE_NIYANTRAN_EXECUTION_KEY=$VITE_NIYANTRAN_EXECUTION_KEY \
    VITE_NIYANTRAN_AUTH_TOKEN=$VITE_NIYANTRAN_AUTH_TOKEN \
    VITE_INSIGHTFLOW_URL=$VITE_INSIGHTFLOW_URL

RUN npm run build:packages && npm run build:shakti

# ---- serve: static assets behind nginx, with a real /health endpoint ----
FROM nginx:1.27-alpine AS serve
RUN apk add --no-cache curl
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/shakti/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
