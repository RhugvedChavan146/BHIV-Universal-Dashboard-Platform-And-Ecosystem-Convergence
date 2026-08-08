import type { ReactNode } from "react";
import { WidgetContainer } from "@bhiv/dashboard-sdk";

// ─── DashboardCard ────────────────────────────────────────────────────────────
// Backward-compatible wrapper delegating to the reusable Platform Widget Framework.

export interface DashboardCardProps {
  /** Section heading displayed in the card header */
  title: string;
  /** Override aria-label for the section; defaults to title */
  ariaLabel?: string;
  /** Optional content rendered to the right of the title (badges, status, refresh) */
  headerRight?: ReactNode;
  /** Show loading skeleton placeholders */
  isLoading?: boolean;
  /** Show error state with retry button */
  isError?: boolean;
  /** True if we have valid data (even if stale). Triggers graceful degradation UI if isError is also true. */
  hasData?: boolean;
  /** Callback for the retry button in error state */
  onRetry?: () => void;
  /** Error message shown in error state */
  errorMessage?: string;
  /** Custom title for error state instead of default */
  errorTitle?: string;
  /** When true, show the empty state message instead of children */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Number of skeleton rows during loading */
  skeletonCount?: number;
  /** Tailwind height class for each skeleton row */
  skeletonHeight?: string;
  /** Additional className merged with card base styles */
  className?: string;
  /** Content rendered in success state */
  children?: ReactNode;

  // Metadata props
  timestamp?: string;
  isFetching?: boolean;
  isStale?: boolean;
  traceId?: string;
  dataSource?: string;
}

export function DashboardCard({
  title,
  ariaLabel,
  headerRight,
  isLoading = false,
  isError = false,
  hasData = false,
  onRetry,
  errorMessage = "Failed to load data",
  errorTitle,
  isEmpty = false,
  emptyMessage = "No Runtime Data Available",
  skeletonCount = 4,
  skeletonHeight = "h-14",
  className,
  children,
  timestamp,
  isFetching = false,
  isStale = false,
  traceId,
  dataSource,
}: DashboardCardProps) {
  return (
    <WidgetContainer
      title={title}
      ariaLabel={ariaLabel}
      headerRight={headerRight}
      isLoading={isLoading}
      isError={isError}
      hasData={hasData}
      onRetry={onRetry}
      errorMessage={errorMessage}
      errorTitle={errorTitle}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      skeletonCount={skeletonCount}
      skeletonHeight={skeletonHeight}
      className={className}
      metadata={{
        timestamp,
        isFetching,
        isStale,
        traceId,
        dataSource,
      }}
    >
      {children}
    </WidgetContainer>
  );
}
