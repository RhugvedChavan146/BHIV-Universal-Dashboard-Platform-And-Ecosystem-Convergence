import * as React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { cn } from "@bhiv/utils";

/**
 * SearchInput — a standalone, controlled/uncontrolled text-search field.
 *
 * Generalizes the search box embedded in `FilterBar` into a reusable
 * primitive for anywhere a search input is needed on its own (page
 * headers, tables, command surfaces). Visually and behaviorally consistent
 * with the input used inside `FilterBar` and `CommandPanel`.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Search deployments..."
 *   shortcutHint="/"
 * />
 * ```
 */
export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value?: string;
  onChange?: (value: string) => void;
  /** Called when the clear (X) button is pressed, or Escape is pressed while focused. */
  onClear?: () => void;
  /** Show a trailing clear button once there is a value. Default `true`. */
  clearable?: boolean;
  /** Optional trailing keyboard-shortcut hint (e.g. "⌘K" or "/"), shown when the field is empty and unfocused. */
  shortcutHint?: string;
  size?: "sm" | "md" | "lg";
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      clearable = true,
      shortcutHint,
      size = "md",
      placeholder = "Search...",
      className,
      containerClassName,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = React.useState(false);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState("");
    const currentValue = isControlled ? value : internalValue;

    const sizeStyles = {
      sm: "h-7 text-[11px]",
      md: "h-8 text-xs",
      lg: "h-9 text-sm",
    };

    const handleChange = (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    };

    const handleClear = () => {
      handleChange("");
      onClear?.();
    };

    return (
      <div
        className={cn(
          "relative flex items-center w-full rounded border bg-slate-800/80 transition-colors",
          focused ? "border-indigo-500/60 ring-1 ring-indigo-500/40" : "border-slate-700/60",
          sizeStyles[size],
          containerClassName
        )}
      >
        <SearchIcon size={13} className="absolute left-2 text-slate-500 shrink-0 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && currentValue) {
              handleClear();
            }
            onKeyDown?.(e);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full h-full bg-transparent pl-7 pr-7 text-slate-200 placeholder-slate-500 font-mono",
            "focus:outline-none",
            className
          )}
          {...props}
        />
        {clearable && currentValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 text-slate-500 hover:text-slate-200 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        ) : (
          shortcutHint &&
          !focused &&
          !currentValue && (
            <span className="absolute right-2 text-[10px] font-mono text-slate-600 border border-slate-700 rounded px-1 shrink-0 pointer-events-none">
              {shortcutHint}
            </span>
          )
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

/** A single result row rendered by `SearchResults`. */
export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  group?: string;
}

export interface SearchResultsProps {
  results: SearchResultItem[];
  onSelect?: (item: SearchResultItem) => void;
  /** Index of the currently keyboard-highlighted result, if any. */
  activeIndex?: number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Grouped, optionally keyboard-highlighted result list — pairs with
 * `SearchInput` to build search-as-you-type dropdowns, or is reused
 * directly by `CommandPanel` for its results list.
 */
export function SearchResults({
  results,
  onSelect,
  activeIndex = -1,
  emptyMessage = "No results found",
  className,
}: SearchResultsProps) {
  const groups = React.useMemo(() => {
    const map = new Map<string, SearchResultItem[]>();
    results.forEach((r) => {
      const key = r.group ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [results]);

  if (results.length === 0) {
    return <div className="py-6 text-center text-xs text-slate-500 font-mono">{emptyMessage}</div>;
  }

  let runningIndex = -1;

  return (
    <div role="listbox" className={cn("flex flex-col gap-2", className)}>
      {groups.map(([group, items]) => (
        <div key={group || "__ungrouped"}>
          {group && (
            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              {group}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              runningIndex += 1;
              const isActive = runningIndex === activeIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelect?.(item)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded text-left transition-colors",
                    isActive ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:bg-slate-800/60"
                  )}
                >
                  {Icon && <Icon size={14} className="shrink-0 text-slate-500" />}
                  <span className="flex flex-col min-w-0">
                    <span className="text-xs font-mono truncate">{item.title}</span>
                    {item.description && (
                      <span className="text-[10px] text-slate-500 font-mono truncate">{item.description}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
