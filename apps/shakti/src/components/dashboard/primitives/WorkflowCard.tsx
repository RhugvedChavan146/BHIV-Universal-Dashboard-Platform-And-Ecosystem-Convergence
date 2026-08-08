import { memo } from "react";
import { Play, Check, X, CircleDashed } from "lucide-react";
import { severityColor } from "@/utils/format";
import type { Severity } from "@/types/api";

export interface WorkflowStep {
  name: string;
  status: "completed" | "active" | "pending" | "failed";
}

export interface WorkflowCardProps {
  /** Name of the workflow operation */
  title: string;
  /** Current active step description */
  currentStep?: string;
  /** Severity mapping for priority workflows */
  severity?: Severity;
  /** List of predefined steps to render as a progress track */
  steps: WorkflowStep[];
  /** Execution ID */
  executionId: string;
}

export const WorkflowCard = memo(function WorkflowCard({
  title,
  currentStep,
  severity = "info",
  steps,
  executionId,
}: WorkflowCardProps) {
  return (
    <div className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg flex flex-col gap-1.5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">{title}</p>
          {currentStep && (
            <span className="text-[10px] text-slate-400 font-normal truncate">
              ({currentStep})
            </span>
          )}
        </div>
        <span className={`text-[9px] font-mono border border-slate-700/50 px-1 py-0.5 rounded bg-slate-800 shrink-0 ${severityColor(severity)}`}>
          #{executionId.slice(0, 6)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 w-full relative">
        {/* Background track line */}
        <div className="absolute left-0 right-0 top-2 h-px bg-slate-700 -z-10" />

        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const isActive = step.status === "active";
          const isFailed = step.status === "failed";

          return (
            <div key={idx} className="flex flex-col items-center gap-0.5 flex-1 group" title={step.name}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border bg-slate-900 transition-colors ${isDone ? "border-emerald-500 text-emerald-500" :
                  isFailed ? "border-red-500 text-red-500" :
                    isActive ? "border-blue-500 text-blue-400" :
                      "border-slate-700 text-slate-600"
                }`}>
                {isDone ? <Check size={8} strokeWidth={3} /> :
                  isFailed ? <X size={8} strokeWidth={3} /> :
                    isActive ? <Play size={6} className="ml-0.5" fill="currentColor" /> :
                      <CircleDashed size={8} />}
              </div>
              <span className={`text-[8px] font-medium uppercase tracking-wider text-center line-clamp-1 w-full px-0.5 ${isDone ? "text-emerald-500/80" :
                  isFailed ? "text-red-400" :
                    isActive ? "text-blue-300" :
                      "text-slate-600"
                }`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
