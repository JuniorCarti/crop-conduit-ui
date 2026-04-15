import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, AlertTriangle, CheckCircle2, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarvestSchedule } from "@/types/harvest";

interface CountdownEntry {
  schedule: HarvestSchedule;
  daysRemaining: number;
  urgency: "overdue" | "urgent" | "soon" | "upcoming" | "ready";
  label: string;
  optimalDate: string;
}

interface Props {
  schedules: HarvestSchedule[];
}

const SAMPLE_SCHEDULES = [
  { id: "s1", cropName: "Tomatoes",  field: "Field A", optimalDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),  status: "Ready"    as const },
  { id: "s2", cropName: "Kale",      field: "Field B", optimalDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),  status: "Pending"  as const },
  { id: "s3", cropName: "Potatoes",  field: "Field C", optimalDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10), status: "Pending"  as const },
  { id: "s4", cropName: "Maize",     field: "Field D", optimalDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),  status: "InProgress" as const },
];

function getDaysRemaining(optimalDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(optimalDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getUrgency(days: number, status: HarvestSchedule["status"]): CountdownEntry["urgency"] {
  if (status === "Harvested" || status === "Cancelled") return "upcoming";
  if (days < 0) return "overdue";
  if (days === 0) return "ready";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "upcoming";
}

const URGENCY_CONFIG: Record<CountdownEntry["urgency"], {
  bg: string; border: string; text: string; badgeBg: string;
  icon: React.ElementType; label: string;
}> = {
  overdue:  { bg: "bg-destructive/10", border: "border-destructive/40", text: "text-destructive", badgeBg: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle, label: "Overdue"  },
  ready:    { bg: "bg-success/10",     border: "border-success/40",     text: "text-success",     badgeBg: "bg-success/10 text-success border-success/30",             icon: CheckCircle2, label: "Harvest now" },
  urgent:   { bg: "bg-warning/10",     border: "border-warning/40",     text: "text-warning",     badgeBg: "bg-warning/10 text-warning border-warning/30",             icon: AlertTriangle, label: "Urgent"   },
  soon:     { bg: "bg-info/10",        border: "border-info/40",        text: "text-info",        badgeBg: "bg-info/10 text-info border-info/30",                      icon: Clock,        label: "Soon"     },
  upcoming: { bg: "bg-muted/20",       border: "border-border/60",      text: "text-muted-foreground", badgeBg: "bg-muted/60 text-muted-foreground border-border",    icon: Calendar,     label: "Upcoming" },
};

function CountdownRing({ days, urgency }: { days: number; urgency: CountdownEntry["urgency"] }) {
  const cfg = URGENCY_CONFIG[urgency];
  const ringColor = urgency === "overdue" ? "#ef4444" : urgency === "ready" ? "#22c55e" : urgency === "urgent" ? "#f59e0b" : urgency === "soon" ? "#3b82f6" : "#94a3b8";
  const maxDays = 30;
  const pct = urgency === "overdue" ? 100 : Math.max(0, Math.min(100, ((maxDays - Math.abs(days)) / maxDays) * 100));
  const circumference = 2 * Math.PI * 22;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={ringColor} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-sm font-bold leading-none", cfg.text)}>
          {urgency === "overdue" ? Math.abs(days) : days}
        </span>
        <span className="text-[8px] text-muted-foreground leading-none">
          {urgency === "overdue" ? "late" : "days"}
        </span>
      </div>
    </div>
  );
}

export function HarvestCountdownTimer({ schedules }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const source = schedules.length > 0 ? schedules : (SAMPLE_SCHEDULES as unknown as HarvestSchedule[]);
  const isMockup = schedules.length === 0;

  const entries: CountdownEntry[] = source
    .filter((s) => s.status !== "Harvested" && s.status !== "Cancelled")
    .map((s) => {
      const optimalDate = s.optimalDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const days = getDaysRemaining(optimalDate);
      const urgency = getUrgency(days, s.status);
      return { schedule: s, daysRemaining: days, urgency, label: URGENCY_CONFIG[urgency].label, optimalDate };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueCount = entries.filter((e) => e.urgency === "overdue").length;
  const urgentCount = entries.filter((e) => e.urgency === "urgent" || e.urgency === "ready").length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Harvest Countdown</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-xs">
                {overdueCount} overdue
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge className="bg-warning/10 text-warning border-warning/30 border text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Days remaining to optimal harvest date per schedule</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sprout className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No active harvest schedules</p>
          </div>
        ) : (
          entries.map((entry) => {
            const cfg = URGENCY_CONFIG[entry.urgency];
            const Icon = cfg.icon;
            return (
              <div key={entry.schedule.id} className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-all",
                cfg.bg, cfg.border
              )}>
                <CountdownRing days={entry.daysRemaining} urgency={entry.urgency} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{entry.schedule.cropName}</span>
                    <span className="text-xs text-muted-foreground">{entry.schedule.field}</span>
                    <Badge className={cn("border text-[10px] px-1.5", cfg.badgeBg)}>
                      <Icon className="h-2.5 w-2.5 mr-0.5 inline" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optimal date: <span className="font-medium text-foreground">{entry.optimalDate}</span>
                    {entry.urgency === "overdue" && (
                      <span className="text-destructive ml-1">— {Math.abs(entry.daysRemaining)} day{Math.abs(entry.daysRemaining) !== 1 ? "s" : ""} past optimal</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Expected: {entry.schedule.expectedYield} {entry.schedule.yieldUnit}</span>
                    <span>·</span>
                    <span className="capitalize">{entry.schedule.status}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
