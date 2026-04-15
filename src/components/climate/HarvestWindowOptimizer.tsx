import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, CloudRain, Thermometer, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
  crop?: string;
}

interface HarvestWindow {
  label: string;
  date: string;
  score: number;
  confidence: "High" | "Medium" | "Low";
  conditions: string[];
  risks: string[];
}

const SAMPLE_WINDOWS: HarvestWindow[] = [
  {
    label: "Fri",
    date: "Best window",
    score: 92,
    confidence: "High",
    conditions: ["Clear skies", "Low wind 10 kph", "No rain expected"],
    risks: [],
  },
  {
    label: "Sat",
    date: "Good window",
    score: 78,
    confidence: "Medium",
    conditions: ["Partly cloudy", "Mild wind 18 kph"],
    risks: ["Light rain possible in evening"],
  },
  {
    label: "Mon",
    date: "Acceptable",
    score: 61,
    confidence: "Low",
    conditions: ["Warm morning"],
    risks: ["Wind picking up", "Rain chance 40%"],
  },
];

function scoreDay(maxTemp: number, wind: number, rainChance: number, rainMm: number): number {
  let score = 100;
  if (rainChance >= 70) score -= 40;
  else if (rainChance >= 40) score -= 20;
  if (rainMm >= 10) score -= 30;
  else if (rainMm >= 5) score -= 15;
  if (wind >= 35) score -= 20;
  else if (wind >= 25) score -= 10;
  if (maxTemp >= 34) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function getConfidence(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

function buildConditions(maxTemp: number, wind: number, rainChance: number): string[] {
  const out: string[] = [];
  if (rainChance < 20) out.push("Clear skies expected");
  else if (rainChance < 50) out.push(`${rainChance}% rain chance`);
  if (wind < 15) out.push(`Low wind ${wind} kph`);
  else out.push(`Wind ${wind} kph`);
  if (maxTemp >= 28 && maxTemp <= 32) out.push("Warm harvest conditions");
  else if (maxTemp < 28) out.push("Cool comfortable conditions");
  return out;
}

function buildRisks(maxTemp: number, wind: number, rainChance: number, rainMm: number): string[] {
  const out: string[] = [];
  if (rainChance >= 60) out.push(`High rain chance (${rainChance}%)`);
  else if (rainChance >= 40) out.push(`Moderate rain chance (${rainChance}%)`);
  if (rainMm >= 5) out.push(`${rainMm}mm rain expected`);
  if (wind >= 35) out.push("Very high wind — crop damage risk");
  else if (wind >= 25) out.push("Elevated wind speed");
  if (maxTemp >= 34) out.push("Heat stress risk during harvest");
  return out;
}

export function HarvestWindowOptimizer({ forecast, isLoading, crop = "your crop" }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const windows: HarvestWindow[] = days.length
    ? days
        .map((day) => {
          const maxTemp = Math.round(day.day.maxtemp_c ?? 0);
          const wind = Math.round(day.day.maxwind_kph ?? 0);
          const rainChance = Math.round(day.day.daily_chance_of_rain ?? 0);
          const rainMm = Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10;
          const score = scoreDay(maxTemp, wind, rainChance, rainMm);
          return {
            label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
            date: day.date,
            score,
            confidence: getConfidence(score),
            conditions: buildConditions(maxTemp, wind, rainChance),
            risks: buildRisks(maxTemp, wind, rainChance, rainMm),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : SAMPLE_WINDOWS;

  const isMockup = days.length === 0;
  const best = windows[0];

  const confidenceStyle = {
    High:   "bg-success/10 text-success border-success/30",
    Medium: "bg-warning/10 text-warning border-warning/30",
    Low:    "bg-muted/60 text-muted-foreground border-border",
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Calendar className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Harvest Window Optimizer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {best && (
              <Badge className="bg-success/10 text-success border-success/30 border text-xs">
                Best: {best.label}
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Top 3 harvest windows for {crop} ranked by weather score
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {windows.map((w, i) => (
          <div
            key={w.date}
            className={cn(
              "rounded-xl border p-3 space-y-2",
              i === 0 ? "border-success/40 bg-success/5" : "border-border/60 bg-background/60"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {i === 0 && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
                <span className="text-sm font-semibold text-foreground">{w.label}</span>
                <span className="text-xs text-muted-foreground">Score: {w.score}/100</span>
              </div>
              <Badge className={cn("border text-[10px] px-1.5", confidenceStyle[w.confidence])}>
                {w.confidence} confidence
              </Badge>
            </div>

            {/* Score bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full", w.score >= 80 ? "bg-success" : w.score >= 60 ? "bg-warning" : "bg-destructive")}
                style={{ width: `${w.score}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {w.conditions.map((c) => (
                <span key={c} className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">{c}</span>
              ))}
              {w.risks.map((r) => (
                <span key={r} className="text-[10px] bg-warning/10 text-warning rounded-full px-2 py-0.5">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
