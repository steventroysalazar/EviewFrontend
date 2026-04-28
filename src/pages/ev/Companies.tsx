import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number | string;
  name?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  locationsCount?: number;
  usersCount?: number;
  devicesCount?: number;
  [key: string]: unknown;
}

const blank = { name: "", email: "", contactNumber: "", address: "" };

export default function Companies() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [receiverOpen, setReceiverOpen] = useState<Company | null>(null);
  const [receiverForm, setReceiverForm] = useState({ phone: "", email: "", webhookUrl: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any>("/api/companies");
      setRows(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  };

  const startEdit = (c: Company) => {
    setEditing(c);
    setForm({
      name: (c.name as string) ?? "",
      email: (c.email as string) ?? "",
      contactNumber: (c.contactNumber as string) ?? "",
      address: (c.address as string) ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await fetchApi(`/api/companies/${editing.id}`, { method: "PUT", body: form });
        toast({ title: "Company updated" });
      } else {
        await fetchApi(`/api/companies`, { method: "POST", body: form });
        toast({ title: "Company created" });
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const saveReceiver = async () => {
    if (!receiverOpen) return;
    try {
      await fetchApi(`/api/companies/${receiverOpen.id}/alarm-receiver`, {
        method: "PUT",
        body: receiverForm,
      });
      toast({ title: "Alarm receiver updated" });
      setReceiverOpen(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Companies"
        description="Manage tenants, contacts, and alarm receivers."
        actions={
          <Button size="sm" onClick={startCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Company
          </Button>
        }
      />

      <DataTable<Company>
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "contactNumber", header: "Contact" },
          {
            key: "counts",
            header: "Loc / Users / Devices",
            render: (r) =>
              `${r.locationsCount ?? 0} · ${r.usersCount ?? 0} · ${r.devicesCount ?? 0}`,
          },
          {
            key: "actions",
            header: "",
            className: "w-[160px] text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReceiverOpen(r);
                    setReceiverForm({
                      phone: (r as any).alarmReceiverPhone ?? "",
                      email: (r as any).alarmReceiverEmail ?? "",
                      webhookUrl: (r as any).alarmReceiverWebhook ?? "",
                    });
                  }}
                  title="Alarm receiver"
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit company" : "New company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Contact number</Label>
              <Input
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receiverOpen} onOpenChange={(o) => !o && setReceiverOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alarm receiver — {receiverOpen?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Phone</Label>
              <Input
                value={receiverForm.phone}
                onChange={(e) => setReceiverForm({ ...receiverForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Email</Label>
              <Input
                value={receiverForm.email}
                onChange={(e) => setReceiverForm({ ...receiverForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Webhook URL</Label>
              <Input
                value={receiverForm.webhookUrl}
                onChange={(e) => setReceiverForm({ ...receiverForm, webhookUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiverOpen(null)}>
              Cancel
            </Button>
            <Button onClick={saveReceiver}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
