"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found.",
  keyExtractor,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.align === "right" ? "text-right" : "text-left",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-border last:border-0 transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer",
                  idx % 2 === 1 && "bg-muted/20"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={cn(
                      "px-4 py-3 font-heading tabular-nums",
                      col.align === "right" ? "text-right" : "text-left",
                      col.className
                    )}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
