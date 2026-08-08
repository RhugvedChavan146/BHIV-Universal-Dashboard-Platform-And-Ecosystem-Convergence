import { useMemo } from "react";
import type { ResolveProductLayoutOptions } from "./DashboardRegistry";
import { globalDashboardRegistry, DashboardRegistry } from "./DashboardRegistry";
import type { ResolvedLayoutZone } from "./types";

/**
 * Resolves a registered product layout (widgets + permissions + capability
 * gating + dynamic loading, all handled by `DashboardRegistry`) into a memoized
 * `ResolvedLayoutZone[]`, ready to pass to `@bhiv/dashboard-layout`'s
 * `useLayoutEngine`/`DashboardGrid`.
 */
export function useProductLayout(
  product: string,
  layoutId: string,
  options: ResolveProductLayoutOptions = {},
  registry: DashboardRegistry = globalDashboardRegistry,
): ResolvedLayoutZone[] {
  const { context, visibilityOverrides, labelOverrides, colSpanOverrides } = options;

  const contextKey = JSON.stringify(context ?? {});
  const visibilityKey = JSON.stringify(visibilityOverrides ?? {});
  const labelKey = JSON.stringify(labelOverrides ?? {});
  const colSpanKey = JSON.stringify(colSpanOverrides ?? {});

  return useMemo(
    () => registry.resolveProductLayout(product, layoutId, { context, visibilityOverrides, labelOverrides, colSpanOverrides }),
    [registry, product, layoutId, contextKey, visibilityKey, labelKey, colSpanKey],
  );
}
