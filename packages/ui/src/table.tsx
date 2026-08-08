import * as React from "react";
import { cn } from "@bhiv/utils";

// ─── Structural primitives ─────────────────────────────────────────────────
// Low-level building blocks. Compose these directly when a bespoke table
// layout is needed; use <DataTable /> below for the common column-config
// driven case.

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto w-full border border-slate-800 rounded-lg">
      <table className={cn("w-full text-left text-xs border-collapse", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-800/60 font-mono text-[11px]", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-slate-800/40 transition-colors", className)} {...props} />;
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function TableHead({ className, align = "left", ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "p-2 font-medium tracking-wide",
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
        className
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function TableCell({ className, align = "left", ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "p-2 text-slate-300",
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
        className
      )}
      {...props}
    />
  );
}

export function TableEmpty({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("py-6 text-center text-xs text-slate-500 font-mono", className)}>
      {children ?? "No records found"}
    </div>
  );
}

// ─── DataTable ──────────────────────────────────────────────────────────────
// Column-config driven convenience wrapper around the primitives above.

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found",
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <TableEmpty>{emptyMessage}</TableEmpty>;
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => (
            <TableHead key={col.key} style={{ width: col.width }} align={col.align}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={keyExtractor(row, idx)}>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align}>
                {col.render ? col.render(row) : (row as any)[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
