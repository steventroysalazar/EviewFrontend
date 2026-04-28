import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

export default function BulkSim() {
  const { toast } = useToast();
  const [imeis, setImeis] = useState("");
  const [action, setAction] = useState<"activate" | "deactivate">("activate");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const submit = async () => {
    const list = imeis
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) {
      toast({ title: "Add at least one IMEI", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchApi<unknown>(`/api/devices/sim/bulk`, {
        method: "POST",
        body: { action, imeis: list },
      });
      setResult(data);
      toast({ title: `Bulk ${action} submitted` });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 max-w-[900px] mx-auto">
      <PageHeader
        title="Bulk SIM"
        description="Activate or deactivate many SIMs at once."
      />

      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-[12px]">Action</Label>
          <Select value={action} onValueChange={(v) => setAction(v as any)}>
            <SelectTrigger className="h-9 w-48 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">Activate</SelectItem>
              <SelectItem value="deactivate">Deactivate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[12px]">IMEIs (comma, space, or newline separated)</Label>
          <Textarea
            rows={8}
            value={imeis}
            onChange={(e) => setImeis(e.target.value)}
            className="text-[13px] font-mono"
            placeholder="123456789012345, 234567890123456&#10;345678901234567"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Submit
          </Button>
        </div>
      </Card>

      {result ? (
        <Card className="p-4 mt-3">
          <h3 className="text-[13px] font-semibold mb-2">Result</h3>
          <pre className="text-[12px] bg-muted/30 p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
