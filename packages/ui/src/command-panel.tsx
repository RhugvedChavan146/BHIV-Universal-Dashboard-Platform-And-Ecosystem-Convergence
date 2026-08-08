import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@bhiv/utils";
import { SearchInput } from "./search";

/** A single action/entry rendered in the `CommandPanel` list. */
export interface CommandItem {
  id: string;
  label: string;
  /** Optional grouping label, e.g. "Navigation", "Actions", "Recent". */
  group?: string;
  /** Icon component (e.g. from `lucide-react`), rendered at 14px. */
  icon?: React.ElementType;
  /** Optional trailing hint, e.g. a keybinding like "⌘K" or a route. */
  hint?: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: () => void;
}

export interface CommandPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  /** Called whenever the query text changes; lets a caller drive async filtering instead of the built-in one. */
  onQueryChange?: (query: string) => void;
  /**
   * Provide a custom filter function to override the built-in
   * case-insensitive label/keyword match (e.g. for fuzzy or server-side
   * search).
   */
  filterItems?: (items: CommandItem[], query: string) => CommandItem[];
  className?: string;
}

function defaultFilter(items: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [item.label, item.group, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * CommandPanel — a global, keyboard-navigable command palette.
 *
 * A configurable, reusable "⌘K"-style overlay: type to filter a flat list
 * of `CommandItem`s (optionally grouped), navigate with Arrow Up/Down,
 * select with Enter, dismiss with Escape or a backdrop click. Rendered in
 * a portal via the same pattern as `Dialog`, and themed identically
 * (slate surfaces, indigo accent) so it matches the rest of the design
 * system without any extra configuration.
 *
 * The component is fully controlled — mount it once near the app root,
 * hold `open` in the parent (or in `useCommandPanel`, below), and supply
 * the current command list. Wire a global `keydown` listener for the
 * trigger shortcut (e.g. `⌘K` / `Ctrl+K`) in the parent, since the desired
 * shortcut and scope are app-specific.
 *
 * @example
 * ```tsx
 * const panel = useCommandPanel();
 *
 * useEffect(() => {
 *   const onKeyDown = (e: KeyboardEvent) => {
 *     if ((e.metaKey || e.ctrlKey) && e.key === "k") {
 *       e.preventDefault();
 *       panel.toggle();
 *     }
 *   };
 *   window.addEventListener("keydown", onKeyDown);
 *   return () => window.removeEventListener("keydown", onKeyDown);
 * }, [panel]);
 *
 * <CommandPanel
 *   open={panel.open}
 *   onOpenChange={panel.setOpen}
 *   items={[
 *     { id: "new", label: "Create dashboard", group: "Actions", icon: Plus, onSelect: createDashboard },
 *     { id: "home", label: "Go to Overview", group: "Navigation", hint: "/", onSelect: () => navigate("/") },
 *   ]}
 * />
 * ```
 */
export function CommandPanel({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search...",
  emptyMessage = "No matching commands",
  onQueryChange,
  filterItems = defaultFilter,
  className,
}: CommandPanelProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setMounted(true), []);

  const filtered = React.useMemo(
    () => filterItems(items, query).filter((i) => !i.disabled),
    [items, query, filterItems]
  );

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleQueryChange = (next: string) => {
    setQuery(next);
    onQueryChange?.(next);
  };

  const select = (item: CommandItem | undefined) => {
    if (!item) return;
    item.onSelect?.();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  if (!mounted || !open) return null;

  // Group while preserving overall (filtered) order for keyboard indexing.
  const groups: Array<[string, CommandItem[]]> = [];
  const groupIndex = new Map<string, number>();
  filtered.forEach((item) => {
    const key = item.group ?? "";
    if (!groupIndex.has(key)) {
      groupIndex.set(key, groups.length);
      groups.push([key, []]);
    }
    groups[groupIndex.get(key)!][1].push(item);
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command panel"
        className={cn(
          "relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl",
          "text-slate-200 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden flex flex-col",
          className
        )}
      >
        <div className="p-2.5 border-b border-slate-800">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            shortcutHint="ESC"
            size="lg"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">{emptyMessage}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map(([group, groupItems]) => (
                <div key={group || "__ungrouped"}>
                  {group && (
                    <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      {group}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {groupItems.map((item) => {
                      const idx = filtered.indexOf(item);
                      const isActive = idx === activeIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => select(item)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1.5 rounded text-left transition-colors",
                            isActive ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:bg-slate-800/60"
                          )}
                        >
                          {Icon && <Icon size={14} className="shrink-0 text-slate-500" />}
                          <span className="flex-1 text-xs font-mono truncate">{item.label}</span>
                          {item.hint && (
                            <span className="text-[10px] font-mono text-slate-600 border border-slate-700 rounded px-1 shrink-0">
                              {item.hint}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Convenience hook for holding `CommandPanel`'s open state and toggling it (e.g. from a keyboard shortcut). */
export function useCommandPanel(defaultOpen = false) {
  const [open, setOpen] = React.useState(defaultOpen);
  const toggle = React.useCallback(() => setOpen((o) => !o), []);
  return { open, setOpen, toggle };
}
