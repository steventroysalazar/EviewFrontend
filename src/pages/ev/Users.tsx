import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: number | string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userRole?: number | string;
  contactNumber?: string;
  locationName?: string;
  [key: string]: unknown;
}

export default function Users() {
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchApi<any>("/api/users");
        setRows(Array.isArray(data) ? data : data?.items ?? []);
      } catch (e: any) {
        toast({ title: "Failed to load", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.email, r.firstName, r.lastName, r.contactNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [rows, q]);

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <PageHeader title="Users" description="Portal and mobile users across the fleet." />

      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-7 h-8 text-[13px]"
        />
      </div>

      <DataTable<UserRow>
        loading={loading}
        rows={filtered}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (r) => (
              <Link to={`/users/${r.id}`} className="text-foreground hover:text-primary">
                {[r.firstName, r.lastName].filter(Boolean).join(" ") || `User #${r.id}`}
              </Link>
            ),
          },
          { key: "email", header: "Email" },
          { key: "contactNumber", header: "Contact" },
          {
            key: "userRole",
            header: "Role",
            render: (r) =>
              r.userRole === 1 || r.userRole === "1"
                ? "Super Admin"
                : r.userRole === 2 || r.userRole === "2"
                ? "Manager"
                : "User",
          },
          { key: "locationName", header: "Location" },
        ]}
      />
    </div>
  );
}
