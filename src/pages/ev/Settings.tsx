import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loadGatewayConfig, saveGatewayConfig, GatewayConfig, getApiBaseUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function EvSettings() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<GatewayConfig>({});

  useEffect(() => setCfg(loadGatewayConfig()), []);

  const save = () => {
    saveGatewayConfig(cfg);
    toast({ title: "Settings saved" });
  };

  return (
    <div className="p-5 max-w-[800px] mx-auto">
      <PageHeader
        title="Settings"
        description={`API base: ${getApiBaseUrl()}`}
      />

      <Card className="p-4 space-y-3">
        <h3 className="text-[13px] font-semibold">Gateway headers</h3>
        {[
          ["authorization", "Authorization (gateway token)"],
          ["gatewayToken", "X-Gateway-Token (legacy)"],
          ["gatewayBaseUrl", "X-Gateway-Base-Url override"],
          ["webhookToken", "X-Webhook-Token"],
        ].map(([k, lbl]) => (
          <div key={k} className="space-y-1">
            <Label className="text-[12px]">{lbl}</Label>
            <Input
              value={(cfg as any)[k] ?? ""}
              onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })}
              className="h-9 text-[13px]"
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={save}>Save</Button>
        </div>
      </Card>
    </div>
  );
}
