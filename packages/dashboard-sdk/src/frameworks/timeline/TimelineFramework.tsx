import { Badge } from "@bhiv/ui";
import { cn } from "@bhiv/utils";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  severity?: "info" | "warning" | "error" | "success";
  source?: string;
}

export interface TimelineFrameworkProps {
  events: TimelineEvent[];
  emptyMessage?: string;
  className?: string;
}

export function TimelineFramework({
  events,
  emptyMessage = "No timeline events recorded",
  className,
}: TimelineFrameworkProps) {
  if (events.length === 0) {
    return <div className="py-6 text-center text-xs text-slate-500 font-mono">{emptyMessage}</div>;
  }

  const badgeVariantMap = {
    info: "secondary",
    warning: "warning",
    error: "destructive",
    success: "success",
  } as const;

  return (
    <div className={cn("space-y-3 relative pl-4 border-l border-slate-800", className)}>
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          <div
            className={cn(
              "absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
              evt.severity === "error"
                ? "bg-red-500"
                : evt.severity === "warning"
                ? "bg-amber-500"
                : evt.severity === "success"
                ? "bg-emerald-500"
                : "bg-indigo-500"
            )}
          />
          <div className="bg-slate-900/40 border border-slate-800 rounded p-2 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-200 font-mono">{evt.title}</span>
              <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
            </div>
            {evt.description && <p className="text-[11px] text-slate-400 font-mono">{evt.description}</p>}
            {evt.source && (
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant={evt.severity ? badgeVariantMap[evt.severity] : "ghost"}>
                  {evt.source}
                </Badge>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
