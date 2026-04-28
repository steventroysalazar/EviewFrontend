import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Trash2, Send } from "lucide-react";

export default function Webhooks() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState('{\n  "event": "test"\n}');

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchApi<any>(`/api/webhooks/ev12/events`, { query: { limit: 100 } });
      setEvents(Array.isArray(d) ? d : d?.items ?? []);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const post = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      toast({ title: "Invalid JSON", variant: "destructive" });
      return;
    }
    try {
      await fetchApi(`/api/webhooks/ev12`, { method: "POST", body: parsed });
      toast({ title: "Webhook posted" });
      load();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const clear = async () => {
    try {
      await fetchApi(`/api/webhooks/ev12/events`, { method: "DELETE" });
      toast({ title: "Cleared" });
      load();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-5 max-w-[1100px] mx-auto">
      <PageHeader
        title="Webhook events"
        description="Inspect incoming webhook traffic."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reload
            </Button>
            <Button size="sm" variant="outline" onClick={clear}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        }
      />

      <Card className="p-4 space-y-3 mb-4">
        <h3 className="text-[13px] font-semibold">Send test webhook</h3>
        <Textarea
          rows={6}
          className="font-mono text-[12px]"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={post}>
            <Send className="h-3.5 w-3.5 mr-1" /> POST
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-3 border-b border-border text-[13px] font-semibold">
          Recent events {loading ? "(loading…)" : `(${events.length})`}
        </div>
        <ul className="divide-y divide-border max-h-[60vh] overflow-auto">
          {events.length === 0 && !loading ? (
            <li className="p-6 text-center text-[12px] text-muted-foreground">No events.</li>
          ) : (
            events.map((ev, i) => (
              <li key={i} className="p-3">
                <div className="text-[11px] text-muted-foreground">
                  {ev?.receivedAt
                    ? new Date(ev.receivedAt).toLocaleString()
                    : ev?.timestamp
                    ? new Date(ev.timestamp).toLocaleString()
                    : ""}
                </div>
                <pre className="text-[11px] bg-muted/30 p-2 rounded overflow-auto mt-1">
                  {JSON.stringify(ev, null, 2)}
                </pre>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
