import * as React from "react";
import { cn } from "@bhiv/utils";
import { Badge } from "./badge";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

export interface NavBarProps {
  brandName?: string;
  items?: NavItem[];
  activeRoute?: string;
  onNavigate?: (path: string) => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function NavBar({
  brandName = "Platform Console",
  items = [],
  activeRoute = "/",
  onNavigate,
  rightContent,
  className,
}: NavBarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-200",
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-bold text-sm tracking-wide font-mono text-slate-100">{brandName}</span>
        </div>

        {items.length > 0 && (
          <nav className="flex items-center gap-1">
            {items.map((item) => {
              const isActive = activeRoute === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.path)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1.5",
                    isActive
                      ? "bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </header>
  );
}
