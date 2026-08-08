import { memo } from "react";
import { ShieldCheck, Crosshair, AlertCircle, Bot } from "lucide-react";
import { severityColor } from "@/utils/format";
import type { Severity } from "@/types/api";

export interface DecisionCardProps {
  /** The action or decision taken */
  action: string;
  /** The entity that made the decision (e.g. 'System', 'Operator AI') */
  actor: string;
  /** Detailed reason for the decision */
  reason: string;
  /** Status of the decision execution */
  status: "executed" | "pending_approval" | "rejected";
  /** Confidence or impact level */
  severity?: Severity;
  /** True if the decision was made autonomously */
  isAutomated?: boolean;
}

export const DecisionCard = memo(function DecisionCard({
  action,
  actor,
  reason,
  status,
  severity = "info",
  isAutomated = true,
}: DecisionCardProps) {
  const Icon = status === "executed" ? ShieldCheck : status === "rejected" ? AlertCircle : Crosshair;
  
  return (
    <div className="p-2 bg-slate-800/40 border border-slate-700/50 rounded-lg">
      <div className="flex gap-2 items-start">
        <Icon size={16} className={`shrink-0 mt-0.5 ${severityColor(severity)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[13px] font-semibold text-slate-200 truncate">{action}</p>
            <span className={`text-[11px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
              status === "executed" ? "text-emerald-400 bg-emerald-500/10" : 
              status === "rejected" ? "text-red-400 bg-red-500/10" : 
              "text-yellow-400 bg-yellow-500/10"
            }`}>
              {status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[12px] text-slate-400 leading-snug mb-1">{reason}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {isAutomated ? <Bot size={10} className="text-indigo-400" /> : null}
            <span>By: <strong className="text-slate-300">{actor}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
});
