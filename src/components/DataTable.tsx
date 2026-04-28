import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, idx: number) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  emptyText = "No data.",
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left font-medium px-3 py-2 border-b border-border ${
                    c.className ?? ""
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline-block" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row, idx) : (row.id as string | number) ?? idx}
                  className={`border-b border-border last:border-b-0 hover:bg-muted/30 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-3 py-2 align-middle ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : (row as any)[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
