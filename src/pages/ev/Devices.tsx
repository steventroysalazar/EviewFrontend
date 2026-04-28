import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Search, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAlarms } from "@/lib/alarmStore";
import { useToast } from "@/hooks/use-toast";

interface DeviceRow {
  id: number | string;
  name?: string;
  externalDeviceId?: string;
  phone?: string;
  alarmCode?: string | null;
  status?: string;
  lastSeenAt?: string;
  ownerName?: string;
  [key: string]: unknown;
}

export default function Devices() {
  const { toast } = useToast();
  const { alarmsByDevice } = useAlarms();
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchApi<any>("/api/devices");
        setRows(Array.isArray(data) ? data : data?.items ?? []);
      } catch (e: any) {
        toast({ title: "Failed to load", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const merged = useMemo(
    () =>
      rows.map((d) => {
        const live =
          (d.id ? alarmsByDevice[`id:${d.id}`] : null) ||
          (d.externalDeviceId ? alarmsByDevice[`ext:${d.externalDeviceId}`] : null);
        if (!live) return d;
        return {
          ...d,
          alarmCode: live.alarmCode ?? d.alarmCode,
          alarmCancelledAt: live.alarmCancelledAt ?? (d as any).alarmCancelledAt,
        };
      }),
    [rows, alarmsByDevice]
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return merged;
    return merged.filter((r) =>
      [r.name, r.externalDeviceId, r.phone, r.ownerName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [merged, q]);

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <PageHeader title="Devices" description="All devices across the fleet." />

      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, IMEI, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-7 h-8 text-[13px]"
        />
      </div>

      <DataTable<DeviceRow>
        loading={loading}
        rows={filtered}
        columns={[
          {
            key: "name",
            header: "Device",
            render: (r) => (
              <Link
                to={`/devices/${r.id}`}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                {r.name || r.externalDeviceId || `#${r.id}`}
              </Link>
            ),
          },
          { key: "externalDeviceId", header: "IMEI" },
          { key: "phone", header: "Phone" },
          { key: "ownerName", header: "Owner" },
          {
            key: "alarmCode",
            header: "Alarm",
            render: (r) =>
              r.alarmCode && !(r as any).alarmCancelledAt ? (
                <Badge variant="destructive" className="text-[10px]">
                  {r.alarmCode}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: "lastSeenAt",
            header: "Last seen",
            render: (r) => (r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : "—"),
          },
        ]}
      />
    </div>
  );
}
