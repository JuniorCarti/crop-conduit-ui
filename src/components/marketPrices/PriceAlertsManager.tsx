/**
 * Price Alerts Component (UI Mockup)
 * Allows farmers to set price threshold alerts
 */

import { useState } from "react";
import { Bell, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatKsh } from "@/lib/currency";

interface PriceAlert {
  id: string;
  commodity: string;
  market: string;
  condition: "above" | "below";
  threshold: number;
  enabled: boolean;
  channels: ("sms" | "whatsapp" | "email")[];
}

export function PriceAlertsManager() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: "1",
      commodity: "Tomatoes",
      market: "Wakulima (Nairobi)",
      condition: "above",
      threshold: 80,
      enabled: true,
      channels: ["sms", "whatsapp"],
    },
    {
      id: "2",
      commodity: "Onions",
      market: "Kongowea (Mombasa)",
      condition: "below",
      threshold: 50,
      enabled: false,
      channels: ["email"],
    },
  ]);

  const [newAlert, setNewAlert] = useState({
    commodity: "",
    market: "",
    condition: "above" as "above" | "below",
    threshold: "",
    channels: [] as ("sms" | "whatsapp" | "email")[],
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddAlert = () => {
    if (!newAlert.commodity || !newAlert.market || !newAlert.threshold) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      commodity: newAlert.commodity,
      market: newAlert.market,
      condition: newAlert.condition,
      threshold: Number(newAlert.threshold),
      enabled: true,
      channels: newAlert.channels.length > 0 ? newAlert.channels : ["sms"],
    };

    setAlerts([...alerts, alert]);
    setNewAlert({
      commodity: "",
      market: "",
      condition: "above",
      threshold: "",
      channels: [],
    });
    setDialogOpen(false);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, enabled: !alert.enabled } : alert)));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const toggleChannel = (channel: "sms" | "whatsapp" | "email") => {
    setNewAlert((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <CardDescription>Get notified when prices reach your target</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              UI Mockup
            </Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Commodity</Label>
                    <Select value={newAlert.commodity} onValueChange={(value) => setNewAlert({ ...newAlert, commodity: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commodity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                        <SelectItem value="Onions">Onions</SelectItem>
                        <SelectItem value="Irish Potato">Irish Potato</SelectItem>
                        <SelectItem value="Kale">Kale</SelectItem>
                        <SelectItem value="Cabbage">Cabbage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Market</Label>
                    <Select value={newAlert.market} onValueChange={(value) => setNewAlert({ ...newAlert, market: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wakulima (Nairobi)">Wakulima (Nairobi)</SelectItem>
                        <SelectItem value="Dandora (Nairobi)">Dandora (Nairobi)</SelectItem>
                        <SelectItem value="Kongowea (Mombasa)">Kongowea (Mombasa)</SelectItem>
                        <SelectItem value="Kisumu">Kisumu</SelectItem>
                        <SelectItem value="Nakuru">Nakuru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Condition</Label>
                      <Select value={newAlert.condition} onValueChange={(value: "above" | "below") => setNewAlert({ ...newAlert, condition: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above</SelectItem>
                          <SelectItem value="below">Below</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Price (KSh/kg)</Label>
                      <Input
                        type="number"
                        placeholder="80"
                        value={newAlert.threshold}
                        onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notification Channels</Label>
                    <div className="flex gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAlert.channels.includes("sms")}
                          onChange={() => toggleChannel("sms")}
                          className="rounded"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAlert.channels.includes("whatsapp")}
                          onChange={() => toggleChannel("whatsapp")}
                          className="rounded"
                        />
                        <span className="text-sm">WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAlert.channels.includes("email")}
                          onChange={() => toggleChannel("email")}
                          className="rounded"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                    </div>
                  </div>
                  <Button onClick={handleAddAlert} className="w-full">
                    Create Alert
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-sm">Create an alert to get notified when prices change</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <Switch checked={alert.enabled} onCheckedChange={() => handleToggleAlert(alert.id)} />
                  <div>
                    <p className="text-sm font-semibold">
                      {alert.commodity} {alert.condition === "above" ? ">" : "<"} {formatKsh(alert.threshold)}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.market}</p>
                    <div className="flex gap-1 mt-1">
                      {alert.channels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
