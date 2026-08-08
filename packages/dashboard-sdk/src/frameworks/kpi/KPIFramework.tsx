import { KPIStat, KPIGrid } from "@bhiv/ui";
import type { KPIStatProps } from "@bhiv/ui";
import { GraphFramework } from "../graph/GraphFramework";
import type { GraphDataPoint } from "../graph/GraphFramework";

/** A single KPI's config for `KPIFrameworkGrid`, extending the base stat with an optional inline sparkline series. */
export interface KPIFrameworkItem extends Omit<KPIStatProps, "sparkline"> {
  /** When provided, renders a compact `GraphFramework` sparkline under the stat using this series. */
  sparklineData?: GraphDataPoint[];
  sparklineDataKey?: string;
}

export interface KPIFrameworkGridProps {
  items: KPIFrameworkItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

/**
 * KPIFrameworkGrid — the dashboard-SDK-level KPI widget: a `KPIGrid` of
 * `KPIStat`s where each stat can optionally carry a compact
 * `GraphFramework` sparkline, wired together in one config-driven call
 * instead of composing `KPIGrid` + `GraphFramework` by hand every time.
 *
 * Use the plain `KPIStat`/`KPIGrid` from `@bhiv/ui` directly when no
 * sparkline or dashboard-SDK context is needed.
 *
 * @example
 * ```tsx
 * <KPIFrameworkGrid
 *   columns={3}
 *   items={[
 *     {
 *       label: "Throughput", value: 1240, unit: "req/s", trend: "up", change: "+6.1%",
 *       sparklineData: last24hSeries, sparklineDataKey: "value",
 *     },
 *     { label: "Error Budget", value: "92", unit: "%", trend: "neutral", goal: "Target: > 90%" },
 *   ]}
 * />
 * ```
 */
export function KPIFrameworkGrid({ items, columns = 4, className }: KPIFrameworkGridProps) {
  return (
    <KPIGrid columns={columns} className={className}>
      {items.map((item, i) => {
        const { sparklineData, sparklineDataKey, ...statProps } = item;
        return (
          <KPIStat
            key={`${item.label}-${i}`}
            {...statProps}
            sparkline={
              sparklineData ? (
                <GraphFramework
                  data={sparklineData}
                  dataKey={sparklineDataKey ?? "value"}
                  height={48}
                  className="p-0 border-0 bg-transparent"
                />
              ) : undefined
            }
          />
        );
      })}
    </KPIGrid>
  );
}
