import { Badge, Button } from "@bhiv/ui";
import { cn } from "@bhiv/utils";
import type { FilterOption } from "./types";

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  statusOptions?: FilterOption[];
  selectedStatuses?: string[];
  onToggleStatus?: (status: string) => void;
  onReset?: () => void;
  placeholder?: string;
  className?: string;
}

export function FilterBar({
  searchQuery = "",
  onSearchChange,
  statusOptions = [],
  selectedStatuses = [],
  onToggleStatus,
  onReset,
  placeholder = "Filter items...",
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded px-2.5 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
        />
      </div>

      {statusOptions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatuses.includes(opt.value);
            return (
              <Badge
                key={opt.value}
                variant={isSelected ? "secondary" : "outline"}
                className="cursor-pointer hover:border-indigo-500 transition-all select-none"
                onClick={() => onToggleStatus?.(opt.value)}
              >
                {opt.label}
              </Badge>
            );
          })}
        </div>
      )}

      {onReset && (searchQuery || selectedStatuses.length > 0) && (
        <Button variant="ghost" size="xs" onClick={onReset} className="font-mono text-slate-400">
          Clear Filters
        </Button>
      )}
    </div>
  );
}
