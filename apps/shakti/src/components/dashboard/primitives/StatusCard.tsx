import { memo } from "react";
import { ProgressStatusRow } from "@bhiv/ui";
import { severityTone } from "@/utils/format";
import type { Severity } from "@/types/api";

export interface StatusCardProps {
  /** Identifier or name of the status */
  label: string;
  /** Severity/priority of the item */
  severity: Severity;
  /** Current progress or completion state (0-100) */
  progress?: number;
  /** Visual theme mapping for the progress bar */
  statusTheme?: "running" | "completed" | "failed" | "pending" | "paused";
  /** Optional supplementary string right-aligned */
  secondaryText?: string;
}

const STATUS_THEME_TONE: Record<NonNullable<StatusCardProps["statusTheme"]>, "info" | "success" | "danger" | "warning" | "neutral"> = {
  running: "info",
  completed: "success",
  failed: "danger",
  pending: "warning",
  paused: "neutral",
};

export const StatusCard = memo(function StatusCard({
  label,
  severity,
  progress = 0,
  statusTheme = "running",
  secondaryText,
}: StatusCardProps) {
  return (
    <ProgressStatusRow
      label={label}
      progress={progress}
      tone={severityTone(severity)}
      barTone={STATUS_THEME_TONE[statusTheme] ?? "neutral"}
      trailingText={secondaryText ?? severity}
    />
  );
});
