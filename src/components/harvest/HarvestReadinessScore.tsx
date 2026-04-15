import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CloudSun, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarvestSchedule, Worker, Delivery } from "@/types/harvest";

interface Props {
  schedule: HarvestSchedule | null;
  workers: Worker[];
  deliveries: Delivery[];
  rainChance?: number;
  marketTrend?: "up" | "down" | "stable";
}

interface ReadinessFactor {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  note: string;
}

function computeReadiness(
  schedule: HarvestSchedule | null,
  workers: Worker[],
  deliveries: Delivery[],
  rainChance: number,
  marketTrend: "up" | "down" | "stable"
): { score: number; factors: ReadinessFactor[]; label: string; tone: "good" | "warning" | "critical" } {
  if (!schedule) return { score: 0, factors: [], label: "No schedule", tone: "critical" };

  const assignedWorkers = workers.filter((w) => w.assignedScheduleIds?.includes(schedule.id) && w.status === "Active");
  const hasDelivery = deliveries.some((d) => d.scheduleId === schedule.id && d.status !== "Cancelled");
  const isReady = schedule.status === "Ready" || schedule.status === "InProgress";
  const weatherOk = rainChance < 40;
  const marketGood = marketTrend === "up" || marketTrend === "stable";

  const factors: ReadinessFactor[] = [
    {
      label: "Crop status",
      score: isReady ? 100 : schedule.status === "Pending" ? 50 : 20,
      icon: ShieldCheck,
      color: isReady ? "text-success" : "text-warning",
      bg: isReady ? "bg-success/10" : "bg-warning/10",
      note: isReady ? `Status: ${schedule.status}` : `Status: ${schedule.status} — not ready yet`,
    },
    {
      label: "Weather window",
      score: rainChance < 20 ? 100 : rainChance < 40 ? 75 : rainChance < 60 ? 40 : 10,
      icon: CloudSun,
      color: weatherOk ? "text-success" : "text-destructive",
      bg: weatherOk ? "bg-success/10" : "bg-destructive/10",
      note: `${rainChance}% rain chance — ${weatherOk ? "good window" : "rain risk"}`,
    },
    {
      label: "Market signal",
      score: marketTrend === "up" ? 100 : marketTrend === "stable" ? 70 : 30,
      icon: TrendingUp,
      color: marketGood ? "text-success" : "text-warning",
      bg: marketGood ? "bg-success/10" : "bg-warning/10",
      note: `Prices ${marketTrend === "up" ? "rising ↑" : marketTrend === "down" ? "falling ↓" : "stable →"}`,
    },
    {
      label: "Workers ready",
      score: assignedWorkers.length >= 3 ? 100 : assignedWorkers.length >= 1 ? 60 : 0,
      icon: Users,
      color: assignedWorkers.length > 0 ? "text-info" : "text-destructive",
      bg: assignedWorkers.length > 0 ? "bg-info/10" : "bg-destructive/10",
      note: `${assignedWorkers.length} active worker${assignedWorkers.length !== 1 ? "s" : ""} assigned`,
    },
    {
      label: "Delivery planned",
      score: hasDelivery ? 100 : 0,
      icon: AlertTriangle,
      color: hasDelivery ? "text-success" : "text-warning",
      bg: hasDelivery ? "bg-success/10" : "bg-warning/10",
      note: hasDelivery ? "Delivery scheduled" : "No delivery plan yet",
    },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const tone: "good" | "warning" | "critical" = score >= 70 ? "good" : score >= 40 ? "warning" : "critical";
  const label = score >= 70 ? "Ready" : score >= 40 ? "Almost ready" : "Not ready";

  return { score, factors, label, tone };
}

const TONE_RING: Record<string, string> = {
  good: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export function HarvestReadinessScore({ schedule, workers, deliveries, rainChance = 25, marketTrend = "stable" }: Props) {
  const { score, factors, label, tone } = computeReadiness(schedule, workers, deliveries, rainChance, marketTrend);
  const circumference = 2 * Math.PI * 36;
  const strokeDash = (score / 100) * circumference;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <CardTitle className="text-base">Harvest Readiness Score</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule ? `${schedule.cropName} — ${schedule.field}` : "Select a schedule to see readiness"}
        </p>
      </CardHeader>
      <CardContent>
        {!schedule ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select a harvest schedule above</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="44" cy="44" r="36" fill="none"
                    stroke={TONE_RING[tone]}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{score}</span>
                  <span className="text-[9px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge className={cn("border text-xs",
                tone === "good" ? "bg-success/10 text-success border-success/30" :
                tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
                "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {label}
              </Badge>
            </div>

            {/* Factor breakdown */}
            <div className="flex-1 space-y-2">
              {factors.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", f.bg)}>
                      <Icon className={cn("h-3 w-3", f.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{f.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{f.score}/100</span>
                      </div>
                      <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            f.score >= 70 ? "bg-success" : f.score >= 40 ? "bg-warning" : "bg-destructive"
                          )}
                          style={{ width: `${f.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{f.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
