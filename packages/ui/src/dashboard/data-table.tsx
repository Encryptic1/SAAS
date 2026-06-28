import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No rows to display.",
  className,
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <p className="ms-dash-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className={cn("ms-dash-table-wrap", className)}>
      <table className="ms-dash-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={getRowKey?.(row, index) ?? String(index)}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
