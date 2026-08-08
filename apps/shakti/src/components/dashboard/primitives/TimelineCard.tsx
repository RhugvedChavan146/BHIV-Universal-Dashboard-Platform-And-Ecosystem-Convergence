import { memo } from "react";
import { AlertTriangle, AlertCircle, Info, Bell, Settings, ShieldAlert, Zap } from "lucide-react";
import { StatusBadge } from "@bhiv/ui";
import { severityTone } from "@/utils/format";
import type { Severity } from "@/types/api";

export interface TimelineCardProps {
  /** The event description */
  message: string;
  /** System, agent, or operator that generated the event */
  source: string;
  /** Event classification, determines the icon and color theme */
  category: "system" | "operator" | "alert" | "incident" | "security" | "action" | string;
  /** Display timestamp (e.g. relative time "2m ago") */
  timestamp: string;
  /** Optional severity tag (if applicable) */
  severity?: Severity;
  /** True to hide the trailing connecting line for the last item */
  isLast?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  system:    Settings,
  operator:  Info,
  alert:     AlertTriangle,
  incident:  Bell,
  security:  ShieldAlert,
  action:    Zap,
};

const CATEGORY_COLOR: Record<string, string> = {
  system:   "text-blue-400 bg-blue-500/15 border border-blue-500/20",
  operator: "text-slate-300 bg-slate-500/20 border border-slate-500/20",
  alert:    "text-orange-400 bg-orange-500/15 border border-orange-500/20",
  incident: "text-red-400 bg-red-500/15 border border-red-500/20",
  security: "text-purple-400 bg-purple-500/15 border border-purple-500/20",
  action:   "text-emerald-400 bg-emerald-500/15 border border-emerald-500/20",
};

export const TimelineCard = memo(function TimelineCard({
  message,
  source,
  category,
  timestamp,
  severity,
  isLast = false,
}: TimelineCardProps) {
  const Icon = CATEGORY_ICONS[category] ?? AlertCircle;
  const colorClass = CATEGORY_COLOR[category] ?? CATEGORY_COLOR.operator;

  return (
    <div className="flex gap-3 items-start group">
      <div className="flex flex-col items-center mt-1">
        <div className={`p-1.5 rounded-md shrink-0 transition-colors ${colorClass}`}>
          <Icon size={12} />
        </div>
        {!isLast && (
          <div className="w-px h-full min-h-6 bg-slate-700/60 my-1 group-hover:bg-slate-600 transition-colors" />
        )}
      </div>
      <div className={`flex-1 min-w-0 pb-2 ${isLast ? "" : ""}`}>
        <p className="text-[13px] text-slate-200 leading-snug">{message}</p>
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-800/60 rounded border border-slate-700/50">
            {source}
          </span>
          {severity && severity !== "info" && (
            <StatusBadge tone={severityTone(severity)}>{severity}</StatusBadge>
          )}
          <span className="text-[10px] text-slate-500 ml-auto font-mono">
            {timestamp}
          </span>
        </div>
      </div>
    </div>
  );
});
