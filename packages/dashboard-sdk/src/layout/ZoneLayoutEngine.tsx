import React, { Suspense } from "react";
import { ErrorBoundary, Skeleton } from "@bhiv/ui";
import { cn } from "@bhiv/utils";
import type { ZoneConfig } from "./types";

export interface ZoneLayoutEngineProps {
  zone: ZoneConfig;
  fallbackTitle?: string;
  skeletonHeight?: string;
  children?: React.ReactNode;
}

export function ZoneLayoutEngine({
  zone,
  fallbackTitle,
  skeletonHeight = "h-64",
  children,
}: ZoneLayoutEngineProps) {
  if (!zone || zone.visible === false) {
    return null;
  }

  const Component = zone.component;
  const colSpanClass = zone.colSpan || "col-span-12";
  const title = fallbackTitle || zone.fallbackTitle || (zone.title ? `${zone.title} Crashed` : "Zone Crashed");
  const height = skeletonHeight || zone.skeletonHeight || "h-64";

  return (
    <div className={cn(colSpanClass, "h-full")}>
      <ErrorBoundary fallbackTitle={title}>
        <Suspense fallback={<Skeleton className={cn(height, "w-full rounded-lg bg-slate-800/40 animate-pulse")} />}>
          {children ? children : Component ? <Component /> : null}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
