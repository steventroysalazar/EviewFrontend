import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Power, Send } from "lucide-react";
import { useAlarms } from "@/lib/alarmStore";

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const { toast } = useToast();
  const { alarmsByDevice } = useAlarms();

  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alarmLogs, setAlarmLogs] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [simStatus, setSimStatus] = useState<any>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [configCommand, setConfigCommand] = useState("");
  const [inboundMessages, setInboundMessages] = useState<any[]>([]);

  const live =
    (device?.id ? alarmsByDevice[`id:${device.id}`] : null) ||
    (device?.externalDeviceId ? alarmsByDevice[`ext:${device.externalDeviceId}`] : null);

  const load = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const d = await fetchApi<any>(`/api/devices/${deviceId}`);
      setDevice(d);
    } catch (e: any) {
      toast({ title: "Failed to load device", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadAlarmLogs = async () => {
    try {
      const d = await fetchApi<any>(`/api/devices/${deviceId}/alarm-logs`);
      setAlarmLogs(Array.isArray(d) ? d : d?.items ?? []);
    } catch {
      setAlarmLogs([]);
    }
  };
  const loadBreadcrumbs = async () => {
    try {
      const d = await fetchApi<any>(`/api/devices/${deviceId}/location-breadcrumbs`);
      setBreadcrumbs(Array.isArray(d) ? d : d?.items ?? []);
    } catch {
      setBreadcrumbs([]);
    }
  };
  const loadSimStatus = async () => {
    try {
      const d = await fetchApi<any>(`/api/devices/${deviceId}/sim/status`);
      setSimStatus(d);
    } catch {
      setSimStatus(null);
    }
  };
  const loadConfigStatus = async () => {
    try {
      const d = await fetchApi<any>(`/api/devices/${deviceId}/config-status`);
      setConfigStatus(d);
    } catch {
      setConfigStatus(null);
    }
  };
  const loadInbound = async () => {
    try {
      const d = await fetchApi<any>(`/api/inbound-messages`, {
        query: { phone: device?.phone, limit: 50 },
      });
      setInboundMessages(Array.isArray(d) ? d : d?.items ?? []);
    } catch {
      setInboundMessages([]);
    }
  };

  useEffect(() => {
    load();
  }, [deviceId]);

  useEffect(() => {
    if (!device) return;
    loadAlarmLogs();
    loadBreadcrumbs();
    loadSimStatus();
    loadConfigStatus();
    loadInbound();
  }, [device?.id]);

  const sendConfig = async () => {
    if (!configCommand.trim()) return;
    try {
      await fetchApi(`/api/send-config`, {
        method: "POST",
        body: { deviceId: device.id, command: configCommand },
      });
      toast({ title: "Config sent" });
      setConfigCommand("");
      loadConfigStatus();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
  };

  const resendConfig = async () => {
    try {
      await fetchApi(`/api/devices/${deviceId}/config-resend`, { method: "POST" });
      toast({ title: "Resend queued" });
      loadConfigStatus();
    } catch (e: any) {
      toast({ title: "Resend failed", description: e.message, variant: "destructive" });
    }
  };

  const simAction = async (action: "activate" | "deactivate") => {
    try {
      await fetchApi(`/api/devices/${deviceId}/sim/${action}`, { method: "POST" });
      toast({ title: `SIM ${action}d` });
      loadSimStatus();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const imeiResend = async () => {
    try {
      await fetchApi(`/api/devices/${deviceId}/imei-resend`, { method: "POST" });
      toast({ title: "IMEI resend queued" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const updateField = async (patch: Record<string, unknown>) => {
    try {
      await fetchApi(`/api/devices/${deviceId}`, { method: "PATCH", body: patch });
      toast({ title: "Updated" });
      load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-10 text-center text-muted-foreground text-[13px]">
        Device not found.{" "}
        <Link to="/devices" className="text-primary underline">
          Back to devices
        </Link>
      </div>
    );
  }

  const alarmActive = !!(live?.alarmCode || device.alarmCode) && !live?.alarmCancelledAt;

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <PageHeader
        title={device.name || device.externalDeviceId || `Device #${device.id}`}
        description={`IMEI ${device.externalDeviceId ?? "—"} · ${device.phone ?? "no phone"}`}
        actions={
          alarmActive ? (
            <Badge variant="destructive">
              {live?.alarmCode || device.alarmCode}
            </Badge>
          ) : (
            <Badge variant="secondary">No active alarm</Badge>
          )
        }
      />

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="alarms">Alarms</TabsTrigger>
          <TabsTrigger value="sim">SIM</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4 space-y-3">
          <Card className="p-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input
                defaultValue={device.name ?? ""}
                onBlur={(e) =>
                  e.target.value !== (device.name ?? "") &&
                  updateField({ name: e.target.value })
                }
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Phone</Label>
              <Input
                defaultValue={device.phone ?? ""}
                onBlur={(e) =>
                  e.target.value !== (device.phone ?? "") &&
                  updateField({ phone: e.target.value })
                }
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">IMEI</Label>
              <Input value={device.externalDeviceId ?? ""} readOnly className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Last seen</Label>
              <Input
                value={device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "—"}
                readOnly
                className="h-9 text-[13px]"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4 space-y-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Send config command</h3>
              <Button variant="outline" size="sm" onClick={resendConfig}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Resend last
              </Button>
            </div>
            <Textarea
              placeholder="e.g. Loc, SOS1,20, fl1,6,1"
              value={configCommand}
              onChange={(e) => setConfigCommand(e.target.value)}
              rows={4}
              className="text-[13px] font-mono"
            />
            <div className="flex justify-end">
              <Button onClick={sendConfig}>
                <Send className="h-3.5 w-3.5 mr-1" /> Send
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Status</h3>
            <pre className="text-[12px] bg-muted/30 p-3 rounded overflow-auto max-h-64">
              {configStatus ? JSON.stringify(configStatus, null, 2) : "No status yet."}
            </pre>
          </Card>
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Inbound messages</h3>
            <DataTable
              rows={inboundMessages}
              columns={[
                {
                  key: "date",
                  header: "When",
                  render: (r: any) =>
                    r?.date ? new Date(Number(r.date)).toLocaleString() : "—",
                },
                { key: "from", header: "From" },
                { key: "message", header: "Message" },
              ]}
              emptyText="No messages."
            />
          </Card>
        </TabsContent>

        <TabsContent value="telemetry" className="mt-4">
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Location breadcrumbs</h3>
            <DataTable
              rows={breadcrumbs}
              columns={[
                {
                  key: "ts",
                  header: "When",
                  render: (r: any) =>
                    r?.timestamp || r?.createdAt
                      ? new Date(r.timestamp || r.createdAt).toLocaleString()
                      : "—",
                },
                { key: "latitude", header: "Lat" },
                { key: "longitude", header: "Lng" },
                { key: "speed", header: "Speed" },
              ]}
              emptyText="No breadcrumbs."
            />
          </Card>
        </TabsContent>

        <TabsContent value="alarms" className="mt-4">
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Alarm history</h3>
            <DataTable
              rows={alarmLogs}
              columns={[
                {
                  key: "ts",
                  header: "When",
                  render: (r: any) =>
                    r?.triggeredAt || r?.createdAt
                      ? new Date(r.triggeredAt || r.createdAt).toLocaleString()
                      : "—",
                },
                { key: "alarmCode", header: "Code" },
                { key: "cancelledAt", header: "Cancelled" },
                { key: "source", header: "Source" },
              ]}
              emptyText="No alarms recorded."
            />
          </Card>
        </TabsContent>

        <TabsContent value="sim" className="mt-4 space-y-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">SIM status</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => simAction("activate")}>
                  <Power className="h-3.5 w-3.5 mr-1" /> Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => simAction("deactivate")}
                >
                  Deactivate
                </Button>
                <Button size="sm" variant="outline" onClick={imeiResend}>
                  Resend IMEI
                </Button>
              </div>
            </div>
            <pre className="text-[12px] bg-muted/30 p-3 rounded overflow-auto max-h-64">
              {simStatus ? JSON.stringify(simStatus, null, 2) : "No SIM info."}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
