import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { RefreshCw } from "lucide-react";

export default function ErrorLogs() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(100);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchApi<any>(`/api/error-logs`, { query: { limit } });
      setRows(Array.isArray(d) ? d : d?.items ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Error logs"
        description="Backend errors, capped to the latest entries."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 100))}
              className="h-8 w-24 text-[13px]"
            />
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        }
      />
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          {
            key: "ts",
            header: "When",
            render: (r: any) =>
              r?.createdAt || r?.timestamp
                ? new Date(r.createdAt || r.timestamp).toLocaleString()
                : "—",
          },
          { key: "level", header: "Level" },
          { key: "source", header: "Source" },
          { key: "message", header: "Message" },
        ]}
        emptyText="No errors recorded."
      />
    </div>
  );
}
