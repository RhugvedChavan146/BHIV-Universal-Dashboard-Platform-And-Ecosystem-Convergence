import { Skeleton, Button, StatusDot } from "@bhiv/ui";
import type { StatusTone } from "@bhiv/ui";
import { cn } from "@bhiv/utils";
import { formatTimestamp } from "../utilities/formatTimestamp";
import type { WidgetContainerProps, WidgetRuntimeStatus } from "./types";

const RUNTIME_STATUS_TONE: Record<WidgetRuntimeStatus, StatusTone> = {
  LIVE: "success",
  STALE: "caution",
  OFFLINE: "danger",
};

export function WidgetContainer({
  title,
  ariaLabel,
  headerRight,
  isLoading = false,
  isError = false,
  hasData = false,
  onRetry,
  errorMessage = "Failed to load data",
  errorTitle = "No Runtime Data Available",
  isEmpty = false,
  emptyMessage = "No Data Available",
  skeletonCount = 4,
  skeletonHeight = "h-14",
  className,
  children,
  metadata,
}: WidgetContainerProps) {
  const isStale = metadata?.isStale ?? false;
  const isFetching = metadata?.isFetching ?? false;
  const timestamp = metadata?.timestamp;
  const traceId = metadata?.traceId;
  const dataSource = metadata?.dataSource;

  let runtimeStatus: WidgetRuntimeStatus = "LIVE";
  if (isError && !hasData) {
    runtimeStatus = "OFFLINE";
  } else if (isStale || (isError && hasData)) {
    runtimeStatus = "STALE";
  } else if (!hasData) {
    runtimeStatus = "OFFLINE";
  }

  return (
    <section
      aria-label={ariaLabel ?? title}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex flex-col gap-1.5 h-full",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-semibold text-slate-200">{title}</h2>
        {headerRight}
      </div>

      {/* Body state machine */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} className={cn(skeletonHeight, "bg-slate-700/50 rounded")} />
          ))}
        </div>
      ) : isError && !hasData ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30 my-auto text-center gap-1">
          <p className="text-xs font-mono font-medium text-slate-400">{errorTitle}</p>
          <span className="text-[10px] text-slate-600 font-mono">{errorMessage}</span>
          {onRetry && (
            <Button
              variant="link"
              onClick={onRetry}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-mono mt-1.5"
            >
              Retry
            </Button>
          )}
        </div>
      ) : isEmpty ? (
        <p className="text-xs text-slate-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <>
          {isError && hasData && (
            <div className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-1.5 rounded mb-2 flex items-center justify-between border border-yellow-500/20">
              <span className="flex items-center gap-1.5">
                <StatusDot tone="warning" pulse />
                Using cached data (Connection lost)
              </span>
              {onRetry && (
                <Button
                  variant="link"
                  onClick={onRetry}
                  className="text-[10px] text-yellow-500 hover:text-yellow-400 underline p-0 h-auto"
                >
                  Retry
                </Button>
              )}
            </div>
          )}
          {children}
        </>
      )}

      {/* Footer Metadata */}
      {hasData && (
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] text-slate-500 border-t border-slate-700/30 pt-1 mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 shrink-0">
              <StatusDot
                tone={RUNTIME_STATUS_TONE[runtimeStatus]}
                size="xs"
                className={runtimeStatus === "LIVE" ? "shadow-[0_0_3px_#34d399]" : undefined}
              />
              <span className="text-slate-400 uppercase font-semibold">{runtimeStatus}</span>
            </span>
            {timestamp && (
              <span className="border-l border-slate-700/60 pl-2 shrink-0">
                Updated: <span className="font-mono text-slate-400">{formatTimestamp(timestamp)}</span>
              </span>
            )}
            {traceId && (
              <span className="border-l border-slate-700/60 pl-2 shrink-0">
                Trace: <span className="font-mono text-slate-400">{traceId}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dataSource && (
              <span>
                Source: <span className="text-slate-400 font-medium">{dataSource}</span>
              </span>
            )}
            {isFetching && (
              <span className="flex items-center gap-0.5 text-indigo-400 shrink-0">
                <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                Refreshing
              </span>
            )}
            {isStale && <span className="text-amber-500 font-semibold shrink-0">[STALE]</span>}
          </div>
        </div>
      )}
    </section>
  );
}
