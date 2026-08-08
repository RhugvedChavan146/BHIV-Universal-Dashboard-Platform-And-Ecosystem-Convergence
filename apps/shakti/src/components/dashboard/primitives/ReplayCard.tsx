import { memo } from "react";
import { Play, CheckCircle, Pause, XCircle, Clock } from "lucide-react";
import type { ReplayState } from "@/types/api";

export interface ReplayCardProps {
  /** Title of the replay session or currently replaying operation */
  title: string;
  /** Current state of the replay engine */
  state: ReplayState;
  /** Progress 0-100 */
  progress: number;
  /** Subtext describing processed counts or metrics */
  metricText: string;
  /** Optional session ID or tracking reference */
  sessionId?: string;
  /** Time when the replay started */
  timeSubtext?: string;
}

const STATE_CONFIG: Record<ReplayState, { icon: React.ElementType; color: string; bar: string }> = {
  running:   { icon: Play,        color: "text-blue-400",    bar: "bg-blue-500" },
  completed: { icon: CheckCircle, color: "text-emerald-400", bar: "bg-emerald-500" },
  paused:    { icon: Pause,       color: "text-yellow-400",  bar: "bg-yellow-500" },
  failed:    { icon: XCircle,     color: "text-red-400",     bar: "bg-red-500" },
  idle:      { icon: Clock,       color: "text-slate-400",   bar: "bg-slate-500" },
};

export const ReplayCard = memo(function ReplayCard({
  title,
  state,
  progress,
  metricText,
  sessionId,
  timeSubtext,
}: ReplayCardProps) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-slate-700/30 rounded p-2.5 space-y-2 border border-slate-600/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={12} className={cfg.color} />
          <span className="text-xs text-slate-200 font-medium line-clamp-1" title={title}>
            {title}
          </span>
        </div>
        <span className={`text-xs font-semibold capitalize shrink-0 ${cfg.color}`}>{state}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{metricText}</span>
          <span>{clampedProgress}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${clampedProgress}%` }} />
        </div>
      </div>

      {(sessionId || timeSubtext) && (
        <div className="flex justify-between text-xs text-slate-600">
          <span>{sessionId ? `ID: ${sessionId}` : ""}</span>
          <span>{timeSubtext}</span>
        </div>
      )}
    </div>
  );
});
