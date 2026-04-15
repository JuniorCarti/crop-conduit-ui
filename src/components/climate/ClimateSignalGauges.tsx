import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity, Thermometer, CloudRain, Droplets, Wind, AlertTriangle, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClimateSignal } from "@/lib/climateInsights";

interface Props {
  signals: ClimateSignal[];
}

const SIGNAL_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "heat-stress":        { icon: Thermometer,   color: "text-warning",     bg: "bg-warning/10" },
  "cold-stress":        { icon: Thermometer,   color: "text-info",        bg: "bg-info/10" },
  "rainfall-trend":     { icon: CloudRain,     color: "text-info",        bg: "bg-info/10" },
  "planting-window":    { icon: Leaf,          color: "text-success",     bg: "bg-success/10" },
  "irrigation-pressure":{ icon: Droplets,      color: "text-primary",     bg: "bg-primary/10" },
  "soil-waterlogging":  { icon: CloudRain,     color: "text-destructive", bg: "bg-destructive/10" },
  "disease-pressure":   { icon: Activity,      color: "text-warning",     bg: "bg-warning/10" },
  "wind-exposure":      { icon: Wind,          color: "text-muted-foreground", bg: "bg-muted/60" },
  "spray-suitability":  { icon: Wind,          color: "text-success",     bg: "bg-success/10" },
  "harvest-disruption": { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  "market-transport":   { icon: Activity,      color: "text-primary",     bg: "bg-primary/10" },
};

const LEVEL_TO_SCORE: Record<string, number> = {
  good: 90, low: 75, medium: 50, warning: 40, high: 25, critical: 10,
};

const LEVEL_STYLES: Record<string, string> = {
  good:     "bg-success/10 text-success border-success/30",
  low:      "bg-success/10 text-success border-success/30",
  medium:   "bg-warning/10 text-warning border-warning/30",
  warning:  "bg-warning/10 text-warning border-warning/30",
  high:     "bg-destructive/10 text-destructive border-destructive/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

const TRACK_COLOR: Record<string, string> = {
  good: "bg-success", low: "bg-success",
  medium: "bg-warning", warning: "bg-warning",
  high: "bg-destructive", critical: "bg-destructive",
};

const SAMPLE_SIGNALS: ClimateSignal[] = [
  { id: "heat-stress",         title: "Heat Stress",          level: "medium",   badgeText: "Medium",   observations: [], why: "" },
  { id: "cold-stress",         title: "Cold Stress",          level: "good",     badgeText: "Good",     observations: [], why: "" },
  { id: "rainfall-trend",      title: "Rainfall Trend",       level: "high",     badgeText: "High",     observations: [], why: "" },
  { id: "planting-window",     title: "Planting Window",      level: "warning",  badgeText: "Uncertain",observations: [], why: "" },
  { id: "irrigation-pressure", title: "Irrigation Pressure",  level: "medium",   badgeText: "Medium",   observations: [], why: "" },
  { id: "disease-pressure",    title: "Disease Pressure",     level: "high",     badgeText: "High",     observations: [], why: "" },
];

export function ClimateSignalGauges({ signals }: Props) {
  const displaySignals = signals.length ? signals.filter((s) => s.id !== "snapshot") : SAMPLE_SIGNALS;
  const isMockup = signals.length === 0;

  // Overall health score = average of all signal scores
  const overallScore = Math.round(
    displaySignals.reduce((sum, s) => sum + (LEVEL_TO_SCORE[s.level] ?? 50), 0) / displaySignals.length
  );
  const overallTone = overallScore >= 70 ? "good" : overallScore >= 45 ? "warning" : "critical";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Climate Signal Strength</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs", LEVEL_STYLES[overallTone])}>
              Farm Score: {overallScore}/100
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Signal strength across all climate indicators</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {displaySignals.map((signal) => {
            const meta = SIGNAL_META[signal.id] ?? { icon: Activity, color: "text-muted-foreground", bg: "bg-muted/60" };
            const Icon = meta.icon;
            const score = LEVEL_TO_SCORE[signal.level] ?? 50;
            const trackColor = TRACK_COLOR[signal.level] ?? "bg-muted";

            return (
              <div key={signal.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{signal.title}</p>
                    <Badge className={cn("border text-[10px] px-1.5 py-0 shrink-0", LEVEL_STYLES[signal.level])}>
                      {signal.badgeText}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", trackColor)}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{score}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
