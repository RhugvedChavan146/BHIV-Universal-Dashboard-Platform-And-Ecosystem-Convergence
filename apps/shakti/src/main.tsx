import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { logger } from "@bhiv/utils";
import "./index.css";
import App from "./App";
import { validateEnv, EnvValidationError } from "./config/env";

const rootElement = document.getElementById("root")!;

function renderConfigError(error: EnvValidationError): void {
  logger.error("Startup validation failed", error, { issues: error.issues });

  createRoot(rootElement).render(
    <div
      style={{
        fontFamily: "ui-monospace, monospace",
        padding: "2rem",
        color: "#fca5a5",
        background: "#0f172a",
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#f8fafc" }}>
        SHAKTI failed to start: configuration error
      </h1>
      <ul style={{ paddingLeft: "1.25rem" }}>
        {error.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      <p style={{ marginTop: "1.5rem", color: "#94a3b8" }}>
        Set the variables above in <code>apps/shakti/.env</code>, then restart the dev server (or rebuild the
        container).
      </p>
    </div>
  );
}

// ─── Startup validation ─────────────────────────────────────────────────────
// Fail fast on bad config, with a readable message, instead of letting the
// app render and fail confusingly inside individual widgets later.
try {
  validateEnv();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
      },
    },
  });

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
} catch (error) {
  if (error instanceof EnvValidationError) {
    renderConfigError(error);
  } else {
    logger.error("Unexpected startup error", error);
    throw error;
  }
}
