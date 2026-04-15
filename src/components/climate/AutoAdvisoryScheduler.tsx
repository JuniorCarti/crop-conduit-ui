import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Bell, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  crop?: string;
  farmName?: string;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: "weekly" | "biweekly" | "daily";
  day: string;
  time: string;
  channels: { email: boolean; whatsapp: boolean; inApp: boolean };
  language: "en" | "sw";
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIMES = ["06:00","07:00","08:00","09:00","10:00","12:00"];

export function AutoAdvisoryScheduler({ crop = "tomatoes", farmName = "Your Farm" }: Props) {
  const [config, setConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: "weekly",
    day: "Monday",
    time: "07:00",
    channels: { email: true, whatsapp: false, inApp: true },
    language: "en",
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof ScheduleConfig["channels"]) => {
    setConfig((prev) => ({ ...prev, channels: { ...prev.channels, [key]: !prev.channels[key] } }));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Advisory schedule saved successfully");
    setTimeout(() => setSaved(false), 3000);
  };

  const nextRunLabel = () => {
    if (!config.enabled) return "Scheduler disabled";
    if (config.frequency === "daily") return `Daily at ${config.time}`;
    if (config.frequency === "biweekly") return `Every other ${config.day} at ${config.time}`;
    return `Every ${config.day} at ${config.time}`;
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Auto-Advisory Scheduler</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn("border text-xs", config.enabled
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted/60 text-muted-foreground border-border"
              )}
            >
              {config.enabled ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatically generate and deliver advisories for <span className="font-medium text-foreground capitalize">{crop}</span> at <span className="font-medium text-foreground">{farmName}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Enable auto-advisory</p>
            <p className="text-xs text-muted-foreground">{nextRunLabel()}</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))}
          />
        </div>

        <div className={cn("space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
          {/* Frequency + Day + Time */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select value={config.frequency} onValueChange={(v: any) => setConfig((p) => ({ ...p, frequency: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.frequency !== "daily" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Day</Label>
                <Select value={config.day} onValueChange={(v) => setConfig((p) => ({ ...p, day: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Select value={config.time} onValueChange={(v) => setConfig((p) => ({ ...p, time: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <Label className="text-xs">Advisory language</Label>
            <div className="flex gap-2">
              {(["en", "sw"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, language: lang }))}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    config.language === lang
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {lang === "en" ? "English" : "Kiswahili"}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery channels */}
          <div className="space-y-2">
            <Label className="text-xs">Delivery channels</Label>
            <div className="space-y-2">
              {[
                { key: "inApp" as const,   icon: Bell,           label: "In-app notification",  note: "Always available" },
                { key: "email" as const,   icon: Mail,           label: "Email",                note: "Requires email subscription" },
                { key: "whatsapp" as const,icon: MessageSquare,  label: "WhatsApp",             note: "Requires WhatsApp subscription" },
              ].map(({ key, icon: Icon, label, note }) => (
                <div key={key} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{note}</p>
                    </div>
                  </div>
                  <Switch checked={config.channels[key]} onCheckedChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={!config.enabled}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
          {saved ? "Schedule saved!" : "Save schedule"}
        </Button>
      </CardContent>
    </Card>
  );
}
