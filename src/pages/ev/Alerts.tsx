import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAlarms } from "@/lib/alarmStore";
import { Link } from "react-router-dom";

export default function Alerts() {
  const { events, connected } = useAlarms();
  const [presets, setPresets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchApi<any>(`/api/lookups/alerts`);
        setPresets(Array.isArray(d) ? d : d?.items ?? []);
      } catch {
        setPresets([]);
      }
      try {
        const l = await fetchApi<any>(`/api/lookups/alert-logs`);
        setLogs(Array.isArray(l) ? l : l?.items ?? []);
      } catch {
        setLogs([]);
      }
    })();
  }, []);

  const filteredLive = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return events;
    return events.filter((e) =>
      [e.alarmCode, e.externalDeviceId, e.deviceId].filter(Boolean).some((v) =>
        String(v).toLowerCase().includes(t)
      )
    );
  }, [events, q]);

  return (
    <div className="p-5 max-w-[1300px] mx-auto">
      <PageHeader
        title="Alerts"
        description="Real-time alarm feed and preset filters."
        actions={
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Stream live" : "Stream offline"}
          </Badge>
        }
      />

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live feed</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="logs">Log filters</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-7 h-8 text-[13px]"
            />
          </div>
          <Card className="p-0 overflow-hidden">
            {filteredLive.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-muted-foreground">
                No live alarm events yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredLive.map((ev, i) => {
                  const cleared = !!ev.alarmCancelledAt || !ev.alarmCode;
                  return (
                    <li key={i} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-medium">
                          {ev.externalDeviceId || `Device #${ev.deviceId}`}
                          <Badge
                            variant={cleared ? "secondary" : "destructive"}
                            className="ml-2 text-[10px]"
                          >
                            {cleared ? "Cleared" : ev.alarmCode}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {ev.updatedAt ? new Date(ev.updatedAt).toLocaleString() : ""}
                        </div>
                      </div>
                      {ev.deviceId ? (
                        <Link
                          to={`/devices/${ev.deviceId}`}
                          className="text-[12px] text-primary hover:underline"
                        >
                          View device
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="mt-4">
          <DataTable
            rows={presets}
            columns={[
              { key: "code", header: "Code" },
              { key: "label", header: "Label" },
              { key: "severity", header: "Severity" },
            ]}
            emptyText="No alert presets."
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <DataTable
            rows={logs}
            columns={[
              { key: "name", header: "Filter" },
              { key: "description", header: "Description" },
            ]}
            emptyText="No saved filters."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
