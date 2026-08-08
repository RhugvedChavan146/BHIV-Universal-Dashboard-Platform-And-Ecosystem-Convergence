import type { ReactNode } from "react";

export type WidgetRuntimeStatus = "LIVE" | "STALE" | "OFFLINE";

export interface WidgetMetadata {
  timestamp?: string;
  isFetching?: boolean;
  isStale?: boolean;
  traceId?: string;
  dataSource?: string;
}

export interface WidgetContainerProps {
  title: string;
  ariaLabel?: string;
  headerRight?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  hasData?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  errorTitle?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
  skeletonHeight?: string;
  className?: string;
  children?: ReactNode;
  metadata?: WidgetMetadata;
}
