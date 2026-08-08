import { memo } from "react";
import { CheckCircle2, AlertOctagon, PowerOff } from "lucide-react";
import type { OperationalStatus } from "@/types/api";
import { StatusBadge, TONE_TEXT } from "@bhiv/ui";
import { statusTone } from "@/utils/format";

export interface CapabilityCardProps {
  /** Name of the capability */
  name: string;
  /** Brief description */
  description: string;
  /** Current enablement status */
  status: OperationalStatus;
  /** True if capability is actively engaged/working */
  isEngaged?: boolean;
}

export const CapabilityCard = memo(function CapabilityCard({
  name,
  description,
  status,
  isEngaged = false,
}: CapabilityCardProps) {
  const isOnline = status === "online";
  const Icon = isOnline ? CheckCircle2 : status === "offline" ? PowerOff : AlertOctagon;
  const tone = statusTone(status);
  
  return (
    <div className={`p-2 rounded-lg border transition-all ${
      isEngaged 
        ? "bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
        : "bg-slate-800/40 border-slate-700/50"
    }`}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`shrink-0 mt-0.5 ${TONE_TEXT[tone]}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[13px] font-semibold text-slate-200">{name}</p>
            {isEngaged && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-400 leading-tight">{description}</p>
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge tone={tone}>{status}</StatusBadge>
            {isEngaged && (
              <span className="text-[11px] text-indigo-400 font-medium">Engaged</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
