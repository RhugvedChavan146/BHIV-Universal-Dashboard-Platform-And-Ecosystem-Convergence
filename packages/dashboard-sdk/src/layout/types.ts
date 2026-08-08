import type { ReactNode } from "react";

export type DensityMode = "compact" | "standard" | "relaxed";

export interface ZoneConfig {
  /** Stable identifier for this zone. Not read by `ZoneLayoutEngine` itself — optional for callers that key zones by object property instead. */
  id?: string;
  /** Display title, used to build the default crash fallback (`"${title} Crashed"`) when `fallbackTitle` isn't supplied. */
  title?: string;
  colSpan?: string; // e.g. "col-span-12 lg:col-span-6"
  visible: boolean;
  order?: number;
  skeletonHeight?: string;
  fallbackTitle?: string;
  component?: React.ComponentType<any>;
}

export interface LayoutEngineProps {
  zones?: Record<string, ZoneConfig>;
  density?: DensityMode;
  gap?: string;
  className?: string;
  children?: ReactNode;
}
