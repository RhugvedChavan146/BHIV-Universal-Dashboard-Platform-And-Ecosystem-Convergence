import { Badge, Button, SearchInput } from "@bhiv/ui";
import { cn } from "@bhiv/utils";
import type { FilterOption, FilterState } from "./types";

export interface SortOption {
  label: string;
  value: string;
}

export interface FilterPanelProps {
  /** Current filter state, typically `useFilters().state` or a `FilterEngine`-backed state. */
  state: FilterState;
  onSearchChange?: (query: string) => void;
  statusOptions?: FilterOption[];
  onToggleStatus?: (status: string) => void;
  severityOptions?: FilterOption[];
  onToggleSeverity?: (severity: string) => void;
  sortOptions?: SortOption[];
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onDateRangeChange?: (range: { start?: string; end?: string }) => void;
  onReset?: () => void;
  searchPlaceholder?: string;
  className?: string;
}

/**
 * FilterPanel — an expanded, panel-style filter surface driving the full
 * `FilterState` contract (search, status, severity, date range, sort),
 * for pages that need more than `FilterBar`'s single-row search + status
 * chips. Renders as a vertically-stacked card rather than a toolbar, so
 * it's suited to a sidebar or drawer rather than an inline header.
 *
 * Purely presentational and controlled — pass the current `FilterState`
 * (e.g. from `useFilters()`) and the individual change handlers; it does
 * not own state itself, matching the rest of the filters module's
 * separation between `FilterEngine`/`FilterProvider` (state) and
 * `FilterBar` (view).
 *
 * @example
 * ```tsx
 * const { state, actions } = useFilters();
 *
 * <FilterPanel
 *   state={state}
 *   onSearchChange={actions.setSearchQuery}
 *   statusOptions={[{ label: "Active", value: "active" }, { label: "Paused", value: "paused" }]}
 *   onToggleStatus={actions.toggleStatusFilter}
 *   sortOptions={[{ label: "Newest", value: "timestamp" }, { label: "Name", value: "name" }]}
 *   onSortChange={actions.setSort}
 *   onReset={actions.reset}
 * />
 * ```
 */
export function FilterPanel({
  state,
  onSearchChange,
  statusOptions = [],
  onToggleStatus,
  severityOptions = [],
  onToggleSeverity,
  sortOptions = [],
  onSortChange,
  onDateRangeChange,
  onReset,
  searchPlaceholder = "Search...",
  className,
}: FilterPanelProps) {
  const hasActiveFilters =
    !!state.searchQuery ||
    state.statusFilter.length > 0 ||
    state.severityFilter.length > 0 ||
    !!state.dateRange.start ||
    !!state.dateRange.end;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Filters</span>
        {onReset && hasActiveFilters && (
          <Button variant="ghost" size="xs" onClick={onReset} className="font-mono text-slate-400">
            Clear all
          </Button>
        )}
      </div>

      {onSearchChange && (
        <SearchInput value={state.searchQuery} onChange={onSearchChange} placeholder={searchPlaceholder} />
      )}

      {statusOptions.length > 0 && (
        <FilterOptionGroup
          label="Status"
          options={statusOptions}
          selected={state.statusFilter}
          onToggle={onToggleStatus}
        />
      )}

      {severityOptions.length > 0 && (
        <FilterOptionGroup
          label="Severity"
          options={severityOptions}
          selected={state.severityFilter}
          onToggle={onToggleSeverity}
        />
      )}

      {onDateRangeChange && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Date range</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={state.dateRange.start ?? ""}
              onChange={(e) => onDateRangeChange({ ...state.dateRange, start: e.target.value || undefined })}
              className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-600">–</span>
            <input
              type="date"
              value={state.dateRange.end ?? ""}
              onChange={(e) => onDateRangeChange({ ...state.dateRange, end: e.target.value || undefined })}
              className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {sortOptions.length > 0 && onSortChange && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Sort by</span>
          <div className="flex items-center gap-2">
            <select
              value={state.sortBy}
              onChange={(e) => onSortChange(e.target.value, state.sortOrder)}
              className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onSortChange(state.sortBy, state.sortOrder === "asc" ? "desc" : "asc")}
              className="font-mono"
              aria-label={`Sort ${state.sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {state.sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterOptionGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-center gap-1 flex-wrap">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={isSelected ? "secondary" : "outline"}
              className="cursor-pointer hover:border-indigo-500 transition-all select-none"
              onClick={() => onToggle?.(opt.value)}
            >
              {opt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
