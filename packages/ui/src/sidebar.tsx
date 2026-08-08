import * as React from "react";
import { cn } from "@bhiv/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Collapse to icon-only rail width */
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full shrink-0 bg-slate-900 border-r border-slate-800 text-slate-200 transition-all",
        collapsed ? "w-14" : "w-56",
        className
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 px-3 py-3 border-b border-slate-800/80 shrink-0", className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto py-2", className)} {...props} />;
}

export function SidebarSection({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5 px-2 py-1.5", className)}>
      {label && (
        <span className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
      )}
      {children}
    </div>
  );
}

export interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ElementType;
  active?: boolean;
  badge?: React.ReactNode;
}

export function SidebarItem({ icon: Icon, active = false, badge, className, children, ...props }: SidebarItemProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs font-mono rounded transition-colors text-left",
        active
          ? "bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent",
        className
      )}
      {...props}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      <span className="flex-1 truncate">{children}</span>
      {badge}
    </button>
  );
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-2.5 border-t border-slate-800/80 shrink-0", className)} {...props} />;
}
