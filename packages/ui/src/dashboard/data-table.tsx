import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Sort comparator (reserved for future SortableDataTable client wrapper). */
  sort?: (a: T, b: T) => number;
  /** Accessor for the sort value (reserved for future SortableDataTable client wrapper). */
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string;
  /** Click handler for rows (only usable from client components). */
  onRowClick?: (row: T) => void;
  /** Render a row action cell (e.g. edit/delete buttons) on the right. */
  rowActions?: (row: T) => ReactNode;
  /** Sticky header on vertical scroll. */
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No rows to display.",
  className,
  getRowKey,
  onRowClick,
  rowActions,
  stickyHeader = false,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <p className="ms-dash-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className={cn("ms-dash-table-wrap", className)}>
      <table className="ms-dash-table">
        <thead className={stickyHeader ? "ms-dash-table-thead-sticky" : undefined}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
            {rowActions && <th aria-label="Actions" className="ms-dash-table-th-action" />}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowKey?.(row, index) ?? String(index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "ms-dash-table-row-clickable" : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
              {rowActions && (
                <td className="ms-dash-table-td-action" onClick={(e) => e.stopPropagation()}>
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ms-dash-table-foot" aria-hidden>
        {data.length} row{data.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
