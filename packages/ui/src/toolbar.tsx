import * as React from "react";
import { cn } from "@bhiv/utils";

/**
 * Toolbar — a generic, responsive action-bar primitive.
 *
 * Composes with `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton`, and
 * `ToolbarSpacer` to build command bars, table toolbars, widget headers, or
 * page-level action rows without hardcoding any domain logic. Follows the
 * same slate/indigo dark-surface language as `Card`, `NavBar`, and
 * `Sidebar` so it drops into any existing layout unchanged.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <ToolbarGroup>
 *     <ToolbarButton icon={Plus} onClick={onCreate}>New</ToolbarButton>
 *     <ToolbarButton icon={RefreshCw} onClick={onRefresh} aria-label="Refresh" />
 *   </ToolbarGroup>
 *   <ToolbarSpacer />
 *   <ToolbarGroup>
 *     <ToolbarButton icon={Filter} active={filtersOpen} onClick={toggleFilters}>
 *       Filters
 *     </ToolbarButton>
 *   </ToolbarGroup>
 * </Toolbar>
 * ```
 */
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Reduce to a single compact row that wraps on small viewports (default: wraps + scrolls). */
  dense?: boolean;
}

export function Toolbar({ className, dense = false, ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        "flex flex-wrap items-center gap-1.5 w-full",
        "bg-slate-900/50 border border-slate-800 rounded-lg text-slate-200",
        dense ? "px-2 py-1" : "px-2.5 py-1.5",
        className
      )}
      {...props}
    />
  );
}

/** Groups related toolbar controls with a visual separation from neighboring groups. */
export function ToolbarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-1 flex-wrap", className)} {...props} />;
}

/** Pushes subsequent `ToolbarGroup`s to the trailing edge of the bar. */
export function ToolbarSpacer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 min-w-[8px]", className)} {...props} />;
}

export interface ToolbarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function ToolbarSeparator({ className, orientation = "vertical", ...props }: ToolbarSeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-slate-700/50",
        orientation === "vertical" ? "w-px h-5 mx-0.5 self-center" : "h-px w-full my-1",
        className
      )}
      {...props}
    />
  );
}

export interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon component (e.g. from `lucide-react`), rendered at 14px. */
  icon?: React.ElementType;
  /** Visually mark the control as toggled/selected (e.g. an open filter panel). */
  active?: boolean;
  /** Compact icon-only button — requires `aria-label`. */
  iconOnly?: boolean;
}

/** A single toolbar action. Icon-only buttons must supply `aria-label` for accessibility. */
export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, icon: Icon, active = false, iconOnly = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={active}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded font-mono transition-colors",
          "text-xs h-7 px-2 border",
          active
            ? "bg-slate-800 text-indigo-400 border-slate-700/60 font-semibold"
            : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50",
          "focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none",
          iconOnly && "w-7 px-0",
          className
        )}
        {...props}
      >
        {Icon && <Icon size={14} className="shrink-0" />}
        {!iconOnly && children}
      </button>
    );
  }
);

ToolbarButton.displayName = "ToolbarButton";
