import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BUYER_TRADE_ENABLED } from "@/services/buyerTradeService";
import { toast } from "sonner";

type SettingsState = {
  preferredUnit: "kg" | "bags" | "crates";
  deliveryPreference: "pickup" | "delivery";
  notifyBids: boolean;
  notifyPriceSpikes: boolean;
  notifyContracts: boolean;
};

const STORAGE_KEY = "buyer_trade_settings_v1";

const getInitialSettings = (): SettingsState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    return {
      preferredUnit: parsed.preferredUnit || "kg",
      deliveryPreference: parsed.deliveryPreference || "pickup",
      notifyBids: parsed.notifyBids ?? true,
      notifyPriceSpikes: parsed.notifyPriceSpikes ?? true,
      notifyContracts: parsed.notifyContracts ?? true,
    };
  } catch {
    return {
      preferredUnit: "kg",
      deliveryPreference: "pickup",
      notifyBids: true,
      notifyPriceSpikes: true,
      notifyContracts: true,
    };
  }
};

export default function BuyerTradeSettings() {
  const [settings, setSettings] = useState<SettingsState>(getInitialSettings);

  const dirty = useMemo(() => true, [settings]);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Trade preferences saved.");
  };

  if (!BUYER_TRADE_ENABLED) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Trade Settings</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Buyer trade module is disabled.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Trade Preferences</h2>
        <p className="text-sm text-muted-foreground">Set your default unit, delivery options, and notifications.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Defaults</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Preferred unit</Label>
            <Select value={settings.preferredUnit} onValueChange={(value) => setSettings((prev) => ({ ...prev, preferredUnit: value as SettingsState["preferredUnit"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="bags">bags</SelectItem>
                <SelectItem value="crates">crates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default delivery method</Label>
            <Select value={settings.deliveryPreference} onValueChange={(value) => setSettings((prev) => ({ ...prev, deliveryPreference: value as SettingsState["deliveryPreference"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">pickup</SelectItem>
                <SelectItem value="delivery">delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Bid updates and responses</span>
            <Switch checked={settings.notifyBids} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifyBids: checked }))} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Price spikes and market changes</span>
            <Switch checked={settings.notifyPriceSpikes} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifyPriceSpikes: checked }))} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Contract and delivery status</span>
            <Switch checked={settings.notifyContracts} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifyContracts: checked }))} />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={!dirty}>Save settings</Button>
      </div>
    </div>
  );
}
