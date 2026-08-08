import { memo } from "react";
import { StatusIndicatorRow } from "@bhiv/ui";
import { statusTone } from "@/utils/format";
import type { OperationalStatus } from "@/types/api";

export interface HealthIndicatorProps {
  /** Name of the component, service, or API */
  name: string;
  /** Current operational state */
  status: OperationalStatus;
  /** Optional response time in ms */
  responseTime?: number;
  /** Optional detail or error string */
  detail?: string;
  /** True to hide the border-bottom (default false) */
  noBorder?: boolean;
}

export const HealthIndicator = memo(function HealthIndicator({
  name,
  status,
  responseTime,
  detail,
  noBorder = false,
}: HealthIndicatorProps) {
  return (
    <StatusIndicatorRow
      label={name}
      tone={statusTone(status)}
      statusText={status}
      noBorder={noBorder}
      metrics={[
        { value: responseTime != null ? `${responseTime}ms` : "—", width: "w-14" },
        { value: detail ? detail : "—", width: "w-16", title: detail },
      ]}
    />
  );
});
