import React from "react";
import { DataTable } from "@bhiv/ui";
import type { DataTableColumn } from "@bhiv/ui";

// ─── BaseTableFramework ─────────────────────────────────────────────────────
// Backward-compatible name for the SDK's column-config table pattern.
// The actual table markup now lives once, in @bhiv/ui's <DataTable />.

export type ColumnDef<T> = DataTableColumn<T>;

export interface BaseTableFrameworkProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function BaseTableFramework<T>(props: BaseTableFrameworkProps<T>) {
  return <DataTable<T> {...props} />;
}
