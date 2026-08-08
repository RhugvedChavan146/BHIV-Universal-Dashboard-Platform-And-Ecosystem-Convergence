import { memo } from "react";
// No lucide-react import needed if we use React.ElementType

export interface EvidenceCardProps {
  /** The source of the evidence */
  source: string;
  /** Detailed description of the evidence */
  description: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Optional icon to represent the evidence type */
  icon?: React.ElementType;
  /** Tailwind color class for the icon (e.g. "text-emerald-400") */
  iconColor?: string;
  /** Optional secondary info (like timestamp) */
  secondaryText?: string;
  /** Hide the border-bottom */
  noBorder?: boolean;
}

export function ConfidenceBar({ value }: { value: number }) {
  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const clamped = Math.min(100, Math.max(0, numValue));
  const color = clamped >= 90 ? "bg-emerald-500" : clamped >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-slate-400 font-medium">{clamped.toFixed(1)}%</span>
    </div>
  );
}

export const EvidenceCard = memo(function EvidenceCard({
  source,
  description,
  confidence,
  icon: Icon,
  iconColor = "text-slate-400",
  secondaryText,
  noBorder = false,
}: EvidenceCardProps) {
  return (
    <div className={`flex gap-2.5 items-start py-2 ${noBorder ? "" : "border-b border-slate-700/30 last:border-0"}`}>
      {Icon && <Icon size={14} className={`shrink-0 mt-0.5 ${iconColor}`} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-medium text-slate-300 truncate" title={source}>{source}</span>
          <ConfidenceBar value={confidence} />
        </div>
        <p className="text-xs text-slate-400 leading-snug line-clamp-2" title={description}>
          {description}
        </p>
        {secondaryText && (
          <p className="text-[10px] text-slate-500 mt-1">{secondaryText}</p>
        )}
      </div>
    </div>
  );
});
