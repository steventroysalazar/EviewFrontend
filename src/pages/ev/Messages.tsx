import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Send } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [debug, setDebug] = useState<any>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadReplies = async () => {
    setLoadingReplies(true);
    try {
      const d = await fetchApi<any>(`/api/messages/replies`);
      setReplies(Array.isArray(d) ? d : d?.items ?? []);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingReplies(false);
    }
  };
  const loadHealth = async () => {
    try {
      setHealth(await fetchApi(`/api/messages/health`));
    } catch {
      setHealth(null);
    }
  };
  const loadDebug = async () => {
    try {
      setDebug(await fetchApi(`/api/messages/debug/config`));
    } catch {
      setDebug(null);
    }
  };

  useEffect(() => {
    loadReplies();
    loadHealth();
    loadDebug();
  }, []);

  const send = async () => {
    if (!phone || !body) return;
    setSending(true);
    try {
      await fetchApi(`/api/messages/send`, {
        method: "POST",
        body: { phone, message: body },
      });
      toast({ title: "Message sent" });
      setBody("");
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 max-w-[1100px] mx-auto">
      <PageHeader title="Messages" description="Manual SMS, replies and gateway health." />

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15555550100"
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            </div>
            <div className="flex justify-end">
              <Button onClick={send} disabled={sending}>
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                Send SMS
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="replies" className="mt-4">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={loadReplies}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
          <DataTable
            loading={loadingReplies}
            rows={replies}
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
            emptyText="No replies."
          />
        </TabsContent>

        <TabsContent value="health" className="mt-4 space-y-3">
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Gateway health</h3>
            <pre className="text-[12px] bg-muted/30 p-3 rounded overflow-auto max-h-64">
              {health ? JSON.stringify(health, null, 2) : "—"}
            </pre>
          </Card>
          <Card className="p-4">
            <h3 className="text-[13px] font-semibold mb-2">Resolved config</h3>
            <pre className="text-[12px] bg-muted/30 p-3 rounded overflow-auto max-h-64">
              {debug ? JSON.stringify(debug, null, 2) : "—"}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
