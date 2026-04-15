import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BellRing, Smartphone, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface NotificationTopic {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function PushNotificationOptIn() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return (Notification.permission as PermissionState) ?? "default";
  });

  const [topics, setTopics] = useState<NotificationTopic[]>([
    { id: "frost",    label: "Frost alerts",          description: "Immediate warning when frost risk is detected",    enabled: true  },
    { id: "rain",     label: "Heavy rain alerts",      description: "Alert when heavy rain is forecast in 24 hours",    enabled: true  },
    { id: "advisory", label: "New AI advisory ready",  description: "Notify when your scheduled advisory is generated", enabled: false },
    { id: "market",   label: "Market price spikes",    description: "Alert when your crop price moves >10%",            enabled: false },
    { id: "harvest",  label: "Harvest window open",    description: "Notify when optimal harvest conditions arrive",    enabled: true  },
  ]);

  const toggleTopic = (id: string) =>
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result === "granted") {
        toast.success("Push notifications enabled!");
      } else if (result === "denied") {
        toast.error("Notifications blocked. Enable them in your browser settings.");
      }
    } catch {
      toast.error("Could not request notification permission.");
    }
  };

  const enabledCount = topics.filter((t) => t.enabled).length;

  const statusConfig = {
    granted:     { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     label: "Enabled",     desc: "Push notifications are active"                    },
    denied:      { icon: XCircle,      color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Blocked",     desc: "Enable notifications in your browser settings"    },
    default:     { icon: BellRing,     color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     label: "Not set up",  desc: "Click below to enable push notifications"         },
    unsupported: { icon: AlertCircle,  color: "text-muted-foreground", bg: "bg-muted/40",  border: "border-border",         label: "Unsupported", desc: "Your browser does not support push notifications" },
  };

  const cfg = statusConfig[permission];
  const Icon = cfg.icon;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BellRing className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Push Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs", cfg.bg, cfg.border, cfg.color)}>{cfg.label}</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Receive instant browser alerts for critical farm events</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission status banner */}
        <div className={cn("flex items-center gap-3 rounded-xl border p-3", cfg.bg, cfg.border)}>
          <Icon className={cn("h-5 w-5 shrink-0", cfg.color)} />
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</p>
            <p className="text-xs text-muted-foreground">{cfg.desc}</p>
          </div>
          <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>

        {/* Topic toggles — only show when granted or for preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notification topics · {enabledCount} enabled
          </p>
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5",
                permission !== "granted" && "opacity-50 pointer-events-none"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{topic.label}</p>
                <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
              </div>
              <Switch checked={topic.enabled} onCheckedChange={() => toggleTopic(topic.id)} />
            </div>
          ))}
        </div>

        {permission !== "granted" && permission !== "denied" && (
          <Button type="button" className="w-full gap-2" onClick={handleRequestPermission} disabled={permission === "unsupported"}>
            <BellRing className="h-4 w-4" />
            Enable push notifications
          </Button>
        )}

        {permission === "denied" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground">
              To re-enable: open your browser settings → Site permissions → Notifications → Allow for this site.
            </p>
          </div>
        )}

        {permission === "granted" && (
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => toast.success("Test notification sent!")}>
            <BellRing className="h-4 w-4" />
            Send test notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
