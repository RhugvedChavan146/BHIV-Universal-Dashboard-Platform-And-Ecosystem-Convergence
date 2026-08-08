import { useServiceObservability } from "@bhiv/dashboard-sdk";
import type { ConnectionState } from "@bhiv/dashboard-sdk";

const STATE_COLOR: Record<ConnectionState, string> = {
  online: "bg-emerald-500",
  degraded: "bg-amber-500",
  offline: "bg-red-500",
  pending: "bg-slate-500",
  unknown: "bg-slate-600",
};

const STATE_ORDER: ConnectionState[] = ["online", "degraded", "offline", "pending", "unknown"];

/**
 * Compact cross-service observability summary for the header: a dot-count
 * per connection state (not one label per service — with 15+ BHIV ecosystem
 * connectors reporting in, a full name list would overflow the header).
 * Hover for the per-service breakdown.
 */
export default function ServiceObservabilityStrip() {
  const { services, overall } = useServiceObservability();

  if (services.length === 0) return null;

  const counts = STATE_ORDER.map((state) => ({
    state,
    count: services.filter((s) => s.state === state).length,
  })).filter((entry) => entry.count > 0);

  const tooltip = services
    .map((s) => `${s.label}: ${s.state}${s.detail ? ` (${s.detail})` : ""}`)
    .join("\n");

  return (
    <div
      className="hidden lg:flex items-center gap-2 px-2 border-l border-slate-700/60"
      aria-label="Cross-service observability"
      title={tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATE_COLOR[overall]}`} />
      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
        {services.length} connectors
      </span>
      <div className="flex items-center gap-1.5">
        {counts.map(({ state, count }) => (
          <span key={state} className="flex items-center gap-0.5 text-[10px] text-slate-500 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATE_COLOR[state]}`} />
            {count}
          </span>
        ))}
      </div>
    </div>
  );
}
