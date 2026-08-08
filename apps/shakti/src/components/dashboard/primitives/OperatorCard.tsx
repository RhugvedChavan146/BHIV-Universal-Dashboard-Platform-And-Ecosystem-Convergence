import { memo } from "react";
import { User, Shield, Briefcase } from "lucide-react";
import { StatusDot } from "@bhiv/ui";
import type { StatusTone } from "@bhiv/ui";

const OPERATOR_STATUS_TONE: Record<OperatorCardProps["status"], StatusTone> = {
  active: "success",
  busy: "danger",
  away: "warning",
  offline: "neutral",
};

export interface OperatorCardProps {
  /** Name or ID of the operator */
  name: string;
  /** Role of the operator */
  role: string;
  /** Current status */
  status: "active" | "away" | "offline" | "busy";
  /** Current active assignment or focus */
  currentAssignment?: string;
  /** Number of active tasks */
  taskCount?: number;
}

export const OperatorCard = memo(function OperatorCard({
  name,
  role,
  status,
  currentAssignment,
  taskCount = 0,
}: OperatorCardProps) {
  const tone = OPERATOR_STATUS_TONE[status] ?? "neutral";

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border border-slate-700/50 bg-slate-800/40">
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">
          <User size={16} />
        </div>
        <StatusDot tone={tone} size="lg" className="absolute -bottom-1 -right-1 border-2 border-slate-800" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-200 truncate">{name}</p>
          {taskCount > 0 && (
            <span className="text-[11px] bg-slate-700 text-slate-350 px-1.5 py-0.5 rounded-full font-mono font-medium">
              {taskCount} tasks
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
          <Shield size={10} className="text-indigo-400" />
          <span>{role}</span>
        </div>
        
        {currentAssignment && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900/50 p-1 rounded line-clamp-1">
            <Briefcase size={10} className="shrink-0" />
            <span className="truncate">{currentAssignment}</span>
          </div>
        )}
      </div>
    </div>
  );
});
