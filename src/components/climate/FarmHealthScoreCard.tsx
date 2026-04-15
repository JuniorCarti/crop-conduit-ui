import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClimateSignal } from "@/lib/climateInsights";

interface Props {
  signals: ClimateSignal[];
  farmName?: string;
}

const LEVEL_SCORE: Record<string, number> = {
  good: 95, low: 80, medium: 50, warning: 40, high: 20, critical: 5,
};

const SAMPLE_SIGNALS: ClimateSignal[] = [
  { id: "heat-stress",          title: "Heat Stress",          level: "medium",  badgeText: "Medium",    observations: [], why: "" },
  { id: "cold-stress",          title: "Cold Stress",          level: "good",    badgeText: "Good",      observations: [], why: "" },
  { id: "rainfall-trend",       title: "Rainfall Trend",       level: "high",    badgeText: "High",      observations: [], why: "" },
  { id: "planting-window",      title: "Planting Window",      level: "warning", badgeText: "Uncertain", observations: [], why: "" },
  { id: "irrigation-pressure",  title: "Irrigation Pressure",  level: "medium",  badgeText: "Medium",    observations: [], why: "" },
  { id: "disease-pressure",     title: "Disease Pressure",     level: "high",    badgeText: "High",      observations: [], why: "" },
  { id: "harvest-disruption",   title: "Harvest Disruption",   level: "low",     badgeText: "Low",       observations: [], why: "" },
];

const SCORE_CONTRIBUTORS = [
  "heat-stress", "cold-stress", "rainfall-trend", "irrigation-pressure",
  "disease-pressure", "harvest-disruption", "soil-waterlogging",
];

export function FarmHealthScoreCard({ signals, farmName = "Your Farm" }: Props) {
  const active = signals.length ? signals.filter((s) => SCORE_CONTRIBUTORS.includes(s.id)) : SAMPLE_SIGNALS;
  const isMockup = signals.length === 0;

  const score = active.length
    ? Math.round(active.reduce((sum, s) => sum + (LEVEL_SCORE[s.level] ?? 50), 0) / active.length)
    : 62;

  const tone = score >= 75 ? "good" : score >= 50 ? "warning" : "critical";
  const ringColor = tone === "good" ? "#22c55e" : tone === "warning" ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Monitor" : "At Risk";

  const topRisks = [...active]
    .filter((s) => ["high", "critical", "warning", "medium"].includes(s.level))
    .sort((a, b) => (LEVEL_SCORE[a.level] ?? 50) - (LEVEL_SCORE[b.level] ?? 50))
    .slice(0, 3);

  const circumference = 2 * Math.PI * 40;
  const strokeDash = (score / 100) * circumference;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sprout className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Farm Health Score</CardTitle>
          </div>
          {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Composite score across all climate signals</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Badge
              className={cn("border text-xs px-3", {
                "bg-success/10 text-success border-success/30": tone === "good",
                "bg-warning/10 text-warning border-warning/30": tone === "warning",
                "bg-destructive/10 text-destructive border-destructive/30": tone === "critical",
              })}
            >
              {label}
            </Badge>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{farmName}</p>
              <p className="text-xs text-muted-foreground">Based on {active.length} climate signals</p>
            </div>

            {topRisks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top risks</p>
                {topRisks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                    <p className="text-xs text-foreground truncate">{s.title}</p>
                    <Badge
                      className={cn("border text-[10px] px-1.5 shrink-0", {
                        "bg-destructive/10 text-destructive border-destructive/30": ["high", "critical"].includes(s.level),
                        "bg-warning/10 text-warning border-warning/30": ["medium", "warning"].includes(s.level),
                      })}
                    >
                      {s.badgeText}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {topRisks.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="text-xs text-success font-medium">All signals are in good range</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
