import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEvAuth } from "@/contexts/EvAuthContext";
import { useCompaniesLookup, useLocationsLookup } from "@/hooks/useLookups";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { StackedLogo } from "@/components/StackedLogo";

const roles = [
  { value: 1, label: "Super Admin" },
  { value: 2, label: "Manager" },
  { value: 3, label: "User" },
];

export default function Register() {
  const { register } = useEvAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { items: locations } = useLocationsLookup();
  const { items: companies } = useCompaniesLookup();

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    userRole: 3,
    locationId: "",
    companyId: "",
    managerId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast({ title: "Account created" });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Register failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-[560px] border border-border rounded-md p-8 space-y-5">
        <div className="flex items-center gap-2">
          <StackedLogo size={16} />
          <span className="text-[14px] font-bold tracking-[0.08em] uppercase">EV12</span>
        </div>
        <div>
          <h1 className="text-[18px] font-semibold">Create admin account</h1>
          <p className="text-[12px] text-muted-foreground">
            Provision a new portal user with role + company/location mapping.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[12px]">First Name</Label>
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className="h-9 text-[13px]"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Last Name</Label>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className="h-9 text-[13px]"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-9 text-[13px]"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="h-9 text-[13px]"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Contact Number</Label>
            <Input
              value={form.contactNumber}
              onChange={(e) => set("contactNumber", e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Address</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Role</Label>
            <Select
              value={String(form.userRole)}
              onValueChange={(v) => set("userRole", Number(v))}
            >
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[12px]">Company</Label>
            <Select value={String(form.companyId)} onValueChange={(v) => set("companyId", v)}>
              <SelectTrigger className="h-9 text-[13px]">
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
          <div className="space-y-1 col-span-2">
            <Label className="text-[12px]">Location</Label>
            <Select value={String(form.locationId)} onValueChange={(v) => set("locationId", v)}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={String(l.id)} value={String(l.id)}>
                    {l.name ?? l.label ?? `Location #${l.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="col-span-2 mt-2 h-9 text-[13px]" disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="text-[12px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
