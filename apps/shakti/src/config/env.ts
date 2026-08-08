// ─── Configuration & startup validation ────────────────────────────────────
// Fails fast, with a clear message, instead of letting a missing/malformed
// VITE_ var surface later as a confusing runtime network error deep inside
// some widget. Called once from `main.tsx` before the app renders.

import { logger } from "@bhiv/utils";

export interface ShaktiEnv {
  controlPlaneUrl: string;
  bucketServiceUrl?: string;
  pranaServiceUrl?: string;
  niyantranUrl?: string;
  niyantranExecutionKey?: string;
  niyantranAuthToken?: string;
  insightFlowUrl?: string;
}

interface EnvVarSpec {
  key: keyof ImportMetaEnv;
  required: boolean;
  isUrl?: boolean;
}

// The single source of truth for which VITE_ vars SHAKTI reads. Add a new
// backend integration by adding one entry here — `validateEnv` and the
// error screen in `main.tsx` pick it up automatically.
const ENV_SPEC: EnvVarSpec[] = [
  { key: "VITE_CONTROL_PLANE_URL", required: true, isUrl: true },
  { key: "VITE_BUCKET_SERVICE_URL", required: false, isUrl: true },
  { key: "VITE_PRANA_SERVICE_URL", required: false, isUrl: true },
  { key: "VITE_NIYANTRAN_URL", required: false, isUrl: true },
  { key: "VITE_NIYANTRAN_EXECUTION_KEY", required: false },
  { key: "VITE_NIYANTRAN_AUTH_TOKEN", required: false },
  { key: "VITE_INSIGHTFLOW_URL", required: false, isUrl: true },
];

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates `import.meta.env` against `ENV_SPEC` and returns a typed,
 * de-quoted config object. Throws `EnvValidationError` (collecting *every*
 * problem, not just the first) if anything required is missing or a URL is
 * malformed.
 */
export function validateEnv(): ShaktiEnv {
  const issues: string[] = [];
  const env = import.meta.env as unknown as Record<string, string | undefined>;

  for (const spec of ENV_SPEC) {
    const raw = env[spec.key]?.trim();

    if (!raw) {
      if (spec.required) {
        issues.push(`${spec.key} is required but not set. Add it to apps/shakti/.env.`);
      }
      continue;
    }

    if (spec.isUrl && !isValidUrl(raw)) {
      issues.push(`${spec.key}="${raw}" is not a valid URL.`);
    }
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  logger.info("Configuration validated", { checked: ENV_SPEC.map((s) => s.key) });

  return {
    controlPlaneUrl: env.VITE_CONTROL_PLANE_URL!.trim(),
    bucketServiceUrl: env.VITE_BUCKET_SERVICE_URL?.trim() || undefined,
    pranaServiceUrl: env.VITE_PRANA_SERVICE_URL?.trim() || undefined,
    niyantranUrl: env.VITE_NIYANTRAN_URL?.trim() || undefined,
    niyantranExecutionKey: env.VITE_NIYANTRAN_EXECUTION_KEY?.trim() || undefined,
    niyantranAuthToken: env.VITE_NIYANTRAN_AUTH_TOKEN?.trim() || undefined,
    insightFlowUrl: env.VITE_INSIGHTFLOW_URL?.trim() || undefined,
  };
}
