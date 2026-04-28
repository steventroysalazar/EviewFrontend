import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Bell } from "lucide-react";
import { useCompaniesLookup } from "@/hooks/useLookups";
import { useToast } from "@/hooks/use-toast";

interface Loc {
  id: number | string;
  name?: string;
  address?: string;
  companyId?: number | string;
  companyName?: string;
  [key: string]: unknown;
}

const blank = { name: "", address: "", companyId: "" };

export default function Locations() {
  const { toast } = useToast();
  const { items: companies } = useCompaniesLookup();
  const [rows, setRows] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loc | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [receiverOpen, setReceiverOpen] = useState<Loc | null>(null);
  const [receiverForm, setReceiverForm] = useState({ phone: "", email: "", webhookUrl: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any>("/api/locations");
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

  const save = async () => {
    try {
      if (editing) {
        await fetchApi(`/api/locations/${editing.id}`, { method: "PUT", body: form });
      } else {
        await fetchApi(`/api/locations`, { method: "POST", body: form });
      }
      toast({ title: "Saved" });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const saveReceiver = async () => {
    if (!receiverOpen) return;
    try {
      await fetchApi(`/api/locations/${receiverOpen.id}/alarm-receiver`, {
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
        title="Locations"
        description="Sites grouped under a company."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({ ...blank });
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New Location
          </Button>
        }
      />

      <DataTable<Loc>
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "address", header: "Address" },
          { key: "companyName", header: "Company" },
          {
            key: "actions",
            header: "",
            className: "w-[160px] text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(r);
                    setForm({
                      name: (r.name as string) ?? "",
                      address: (r.address as string) ?? "",
                      companyId: r.companyId ? String(r.companyId) : "",
                    });
                    setOpen(true);
                  }}
                >
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
            <DialogTitle>{editing ? "Edit location" : "New location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Company</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.name ?? c.label ?? `Company #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
