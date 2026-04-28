import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function UserDetail() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: "", externalDeviceId: "", phone: "" });

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [u, d] = await Promise.all([
        fetchApi<any>(`/api/users/${userId}`),
        fetchApi<any>(`/api/users/${userId}/devices`).catch(() => []),
      ]);
      setUser(u);
      setForm({
        firstName: u?.firstName ?? "",
        lastName: u?.lastName ?? "",
        email: u?.email ?? "",
        contactNumber: u?.contactNumber ?? "",
        address: u?.address ?? "",
        userRole: u?.userRole ?? 3,
        locationId: u?.locationId ?? "",
      });
      setDevices(Array.isArray(d) ? d : d?.items ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      await fetchApi(`/api/users/${userId}`, { method: "PUT", body: form });
      toast({ title: "Saved" });
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createDevice = async () => {
    try {
      await fetchApi(`/api/users/${userId}/devices`, { method: "POST", body: deviceForm });
      toast({ title: "Device created" });
      setCreateOpen(false);
      setDeviceForm({ name: "", externalDeviceId: "", phone: "" });
      load();
    } catch (e: any) {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-5 max-w-[1100px] mx-auto">
      <PageHeader
        title={
          loading
            ? "Loading…"
            : `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || `User #${userId}`
        }
        description={user?.email}
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="p-4 grid grid-cols-2 gap-3">
            {[
              ["firstName", "First name"],
              ["lastName", "Last name"],
              ["email", "Email"],
              ["contactNumber", "Contact number"],
              ["address", "Address"],
              ["locationId", "Location id"],
            ].map(([k, lbl]) => (
              <div key={k} className="space-y-1">
                <Label className="text-[12px]">{lbl}</Label>
                <Input
                  value={form[k] ?? ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="h-9 text-[13px]"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-[12px]">Role</Label>
              <Input
                type="number"
                value={form.userRole ?? 3}
                onChange={(e) => setForm({ ...form, userRole: Number(e.target.value) })}
                className="h-9 text-[13px]"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button onClick={save} disabled={saving}>
                Save changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add device
            </Button>
          </div>
          <DataTable
            rows={devices}
            columns={[
              {
                key: "name",
                header: "Name",
                render: (r: any) => (
                  <Link to={`/devices/${r.id}`} className="text-foreground hover:text-primary">
                    {r.name || r.externalDeviceId || `#${r.id}`}
                  </Link>
                ),
              },
              { key: "externalDeviceId", header: "IMEI" },
              { key: "phone", header: "Phone" },
              { key: "status", header: "Status" },
            ]}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add device</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">IMEI / External device id</Label>
              <Input
                value={deviceForm.externalDeviceId}
                onChange={(e) => setDeviceForm({ ...deviceForm, externalDeviceId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Phone</Label>
              <Input
                value={deviceForm.phone}
                onChange={(e) => setDeviceForm({ ...deviceForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createDevice}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
