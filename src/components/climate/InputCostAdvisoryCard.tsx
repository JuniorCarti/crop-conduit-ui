import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  crop?: string;
}

type InputTiming = "now" | "wait" | "avoid";

interface InputRecommendation {
  input: string;
  timing: InputTiming;
  reason: string;
  bestWindow: string;
  costNote: string;
}

const TIMING_CONFIG = {
  now:   { icon: CheckCircle2, label: "Apply Now",  bg: "bg-success/10",     border: "border-success/30",     text: "text-success"     },
  wait:  { icon: Clock,        label: "Wait",        bg: "bg-warning/10",     border: "border-warning/30",     text: "text-warning"     },
  avoid: { icon: XCircle,      label: "Avoid",       bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
};

function getInputRecommendations(
  forecast: WeatherApiForecast | null,
  crop: string
): InputRecommendation[] {
  const days = forecast?.forecast?.forecastday ?? [];
  const today = days[0];
  const tomorrow = days[1];

  const todayRain = today?.day.daily_chance_of_rain ?? 0;
  const tomorrowRain = tomorrow?.day.daily_chance_of_rain ?? 0;
  const todayWind = today?.day.maxwind_kph ?? 0;
  const todayTemp = today?.day.maxtemp_c ?? 25;
  const totalRain = days.slice(0, 3).reduce((s, d) => s + (d.day.totalprecip_mm ?? 0), 0);

  const fungicideTiming: InputTiming = todayRain >= 60 ? "avoid" : tomorrowRain >= 60 ? "wait" : "now";
  const fertilizerTiming: InputTiming = totalRain >= 10 ? "now" : todayRain < 20 && todayTemp >= 30 ? "wait" : "now";
  const herbicideTiming: InputTiming = todayWind >= 25 ? "avoid" : todayRain >= 40 ? "wait" : "now";
  const pesticideTiming: InputTiming = todayRain >= 60 || todayWind >= 25 ? "avoid" : todayRain >= 30 ? "wait" : "now";

  const bestSprayDay = days.find((d) => (d.day.daily_chance_of_rain ?? 0) < 30 && (d.day.maxwind_kph ?? 0) < 20);
  const bestSprayLabel = bestSprayDay
    ? new Date(bestSprayDay.date).toLocaleDateString("en-US", { weekday: "short" })
    : "Next dry day";

  return [
    {
      input: "Fungicide",
      timing: fungicideTiming,
      reason: fungicideTiming === "avoid" ? "Rain will wash off application" : fungicideTiming === "wait" ? "Rain expected tomorrow — wait for dry window" : "Good conditions — apply before rain arrives",
      bestWindow: bestSprayLabel,
      costNote: "Apply 4–6 hrs before any rain for best efficacy",
    },
    {
      input: "Fertilizer (top dress)",
      timing: fertilizerTiming,
      reason: fertilizerTiming === "now" && totalRain >= 10 ? "Rain will help incorporate fertilizer" : fertilizerTiming === "wait" ? "Too hot and dry — fertilizer may burn roots" : "Apply before expected rain for best uptake",
      bestWindow: totalRain >= 5 ? "Today" : bestSprayLabel,
      costNote: "Apply 1–2 days before rain for optimal absorption",
    },
    {
      input: "Herbicide",
      timing: herbicideTiming,
      reason: herbicideTiming === "avoid" ? "High wind — drift will damage crops" : herbicideTiming === "wait" ? "Rain will reduce effectiveness" : "Calm conditions — good window for application",
      bestWindow: bestSprayLabel,
      costNote: "Avoid application when wind > 15 kph",
    },
    {
      input: "Pesticide / Insecticide",
      timing: pesticideTiming,
      reason: pesticideTiming === "avoid" ? "Rain or wind will reduce effectiveness significantly" : pesticideTiming === "wait" ? "Moderate rain chance — wait for clearer window" : "Good conditions — apply early morning",
      bestWindow: bestSprayLabel,
      costNote: "Apply early morning when insects are most active",
    },
  ];
}

const SAMPLE_RECS: InputRecommendation[] = [
  { input: "Fungicide",              timing: "now",   reason: "Good conditions — apply before rain arrives",          bestWindow: "Today",  costNote: "Apply 4–6 hrs before any rain for best efficacy"       },
  { input: "Fertilizer (top dress)", timing: "now",   reason: "Rain expected in 2 days — fertilizer will be absorbed", bestWindow: "Today",  costNote: "Apply 1–2 days before rain for optimal absorption"     },
  { input: "Herbicide",              timing: "wait",  reason: "Moderate wind today — drift risk",                     bestWindow: "Thu",    costNote: "Avoid application when wind > 15 kph"                  },
  { input: "Pesticide / Insecticide",timing: "avoid", reason: "Heavy rain forecast — application will wash off",      bestWindow: "Fri",    costNote: "Apply early morning when insects are most active"       },
];

export function InputCostAdvisoryCard({ forecast, crop = "tomatoes" }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];
  const isMockup = days.length === 0;
  const recs = days.length ? getInputRecommendations(forecast, crop) : SAMPLE_RECS;

  const nowCount = recs.filter((r) => r.timing === "now").length;
  const avoidCount = recs.filter((r) => r.timing === "avoid").length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Input Cost Advisory</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border-success/30 border text-xs">{nowCount} apply now</Badge>
            {avoidCount > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-xs">{avoidCount} avoid</Badge>}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Optimal timing for farm inputs based on weather forecast
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {recs.map((rec) => {
          const cfg = TIMING_CONFIG[rec.timing];
          const Icon = cfg.icon;
          return (
            <div key={rec.input} className={cn("rounded-xl border p-3 space-y-1.5", cfg.bg, cfg.border)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4 shrink-0", cfg.text)} />
                  <span className="text-sm font-semibold text-foreground">{rec.input}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Best: {rec.bestWindow}</span>
                  <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.text)}>
                    {cfg.label}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{rec.reason}</p>
              <p className="text-[10px] text-muted-foreground/70 italic">{rec.costNote}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
