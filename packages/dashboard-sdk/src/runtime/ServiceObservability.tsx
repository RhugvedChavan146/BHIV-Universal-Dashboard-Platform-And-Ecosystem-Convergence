import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ConnectionState, CrossServiceObservability, ServiceHealthSnapshot } from "./types";

interface ServiceObservabilityContextValue {
  report: (snapshot: ServiceHealthSnapshot) => void;
  observability: CrossServiceObservability;
}

const ServiceObservabilityContext = createContext<ServiceObservabilityContextValue | null>(null);

function aggregate(states: Record<string, ServiceHealthSnapshot>): CrossServiceObservability {
  const services = Object.values(states).sort((a, b) => a.id.localeCompare(b.id));
  const degradedCount = services.filter((s) => s.state === "degraded" || s.state === "offline").length;
  let overall: ConnectionState = "unknown";
  if (services.length > 0) {
    if (services.some((s) => s.state === "offline")) overall = "offline";
    else if (services.some((s) => s.state === "degraded")) overall = "degraded";
    else if (services.every((s) => s.state === "online")) overall = "online";
  }
  return { services, overall, degradedCount };
}

/**
 * Root provider for cross-service observability. Mount once per app; each
 * service's *real* query hook reports its own snapshot via `useReportServiceHealth`
 * — this provider only aggregates what it's told, it never infers or fabricates
 * a service's status.
 */
export function ServiceObservabilityProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, ServiceHealthSnapshot>>({});
  const statesRef = useRef(states);
  statesRef.current = states;

  const report = useCallback((snapshot: ServiceHealthSnapshot) => {
    setStates((prev) => {
      const existing = prev[snapshot.id];
      if (existing && existing.state === snapshot.state && existing.latencyMs === snapshot.latencyMs) {
        // Avoid a render storm when polling keeps confirming the same state.
        return { ...prev, [snapshot.id]: snapshot };
      }
      return { ...prev, [snapshot.id]: snapshot };
    });
  }, []);

  const observability = useMemo(() => aggregate(states), [states]);

  const value = useMemo(() => ({ report, observability }), [report, observability]);

  return (
    <ServiceObservabilityContext.Provider value={value}>
      {children}
    </ServiceObservabilityContext.Provider>
  );
}

export function useServiceObservability(): CrossServiceObservability {
  const ctx = useContext(ServiceObservabilityContext);
  if (!ctx) {
    return { services: [], overall: "unknown", degradedCount: 0 };
  }
  return ctx.observability;
}

/**
 * Call from any hook/component that already knows a service's real
 * connectivity (e.g. derived from a TanStack Query `isError`/`isFetching`
 * pair) to publish it into the shared cross-service view.
 */
export function useReportServiceHealth(): (snapshot: ServiceHealthSnapshot) => void {
  const ctx = useContext(ServiceObservabilityContext);
  return ctx?.report ?? (() => {});
}
