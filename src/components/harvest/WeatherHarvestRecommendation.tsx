import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloudSun, CloudRain, Thermometer, Wind, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ForecastDay {
  label: string;
  rainChance: number;
  maxTemp: number;
  windKph: number;
  condition: "clear" | "mixed" | "rainy";
}

interface Props {
  cropName?: string;
  forecastDays?: ForecastDay[];
}

type Recommendation = "harvest_now" | "wait" | "urgent" | "not_ready";

const SAMPLE_FORECAST: ForecastDay[] = [
  { label: "Today",    rainChance: 15, maxTemp: 27, windKph: 12, condition: "clear" },
  { label: "Tomorrow", rainChance: 20, maxTemp: 28, windKph: 10, condition: "clear" },
  { label: "Wed",      rainChance: 75, maxTemp: 22, windKph: 18, condition: "rainy" },
  { label: "Thu",      rainChance: 80, maxTemp: 21, windKph: 22, condition: "rainy" },
  { label: "Fri",      rainChance: 30, maxTemp: 26, windKph: 14, condition: "mixed" },
];

function getRecommendation(days: ForecastDay[]): {
  type: Recommendation;
  title: string;
  message: string;
  urgency: "high" | "medium" | "low";
  bestDays: string[];
  avoidDays: string[];
} {
  const today = days[0];
  const tomorrow = days[1];
  const heavyRainSoon = days.slice(0, 3).some((d) => d.rainChance >= 70);
  const heavyRainTomorrow = tomorrow?.rainChance >= 70;
  const goodToday = (today?.rainChance ?? 100) < 30 && (today?.windKph ?? 99) < 25;
  const goodTomorrow = (tomorrow?.rainChance ?? 100) < 30 && (tomorrow?.windKph ?? 99) < 25;

  const bestDays = days.filter((d) => d.rainChance < 30 && d.windKph < 20).map((d) => d.label);
  const avoidDays = days.filter((d) => d.rainChance >= 60).map((d) => d.label);

  if (heavyRainTomorrow && goodToday) {
    return {
      type: "urgent",
      title: "Harvest today — rain arrives tomorrow",
      message: `Heavy rain (${tomorrow.rainChance}%) forecast from tomorrow. Harvest today to avoid crop damage, mold, and transport delays.`,
      urgency: "high",
      bestDays,
      avoidDays,
    };
  }

  if (goodToday && goodTomorrow) {
    return {
      type: "harvest_now",
      title: "Good conditions — harvest now",
      message: `Clear skies today and tomorrow. Low rain chance (${today?.rainChance}%) and calm winds. Ideal 2-day harvest window.`,
      urgency: "low",
      bestDays,
      avoidDays,
    };
  }

  if (heavyRainSoon && !goodToday) {
    return {
      type: "wait",
      title: "Wait for the rain to clear",
      message: `Rain expected in the next 3 days. Best harvest window opens ${bestDays[0] ?? "later this week"} when conditions improve.`,
      urgency: "medium",
      bestDays,
      avoidDays,
    };
  }

  return {
    type: "harvest_now",
    title: "Conditions acceptable — proceed",
    message: "No major weather disruptions expected. Monitor conditions and harvest when crop is ready.",
    urgency: "low",
    bestDays,
    avoidDays,
  };
}

const REC_CONFIG = {
  urgent:       { icon: XCircle,      color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  harvest_now:  { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     border: "border-success/30"     },
  wait:         { icon: Clock,        color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30"     },
  not_ready:    { icon: AlertTriangle,color: "text-muted-foreground", bg: "bg-muted/40",  border: "border-border"         },
};

const CONDITION_ICON = { clear: CloudSun, mixed: CloudSun, rainy: CloudRain };
const CONDITION_COLOR = { clear: "text-warning", mixed: "text-muted-foreground", rainy: "text-info" };

export function WeatherHarvestRecommendation({ cropName = "your crop", forecastDays }: Props) {
  const navigate = useNavigate();
  const days = forecastDays ?? SAMPLE_FORECAST;
  const isMockup = !forecastDays;
  const rec = getRecommendation(days);
  const cfg = REC_CONFIG[rec.type];
  const Icon = cfg.icon;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <CloudSun className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Weather Harvest Recommendation</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs",
              rec.urgency === "high" ? "bg-destructive/10 text-destructive border-destructive/30" :
              rec.urgency === "medium" ? "bg-warning/10 text-warning border-warning/30" :
              "bg-success/10 text-success border-success/30"
            )}>
              {rec.urgency === "high" ? "Urgent" : rec.urgency === "medium" ? "Monitor" : "All clear"}
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          Harvest timing for <span className="font-medium text-foreground">{cropName}</span> based on 5-day forecast
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main recommendation */}
        <div className={cn("flex items-start gap-3 rounded-xl border p-4", cfg.bg, cfg.border)}>
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.color)} />
          <div className="space-y-1">
            <p className={cn("text-sm font-semibold", cfg.color)}>{rec.title}</p>
            <p className="text-xs text-muted-foreground">{rec.message}</p>
          </div>
        </div>

        {/* 5-day strip */}
        <div className="grid grid-cols-5 gap-1.5">
          {days.map((day) => {
            const DayIcon = CONDITION_ICON[day.condition];
            const isBest = rec.bestDays.includes(day.label);
            const isAvoid = rec.avoidDays.includes(day.label);
            return (
              <div key={day.label} className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 text-center",
                isBest ? "border-success/40 bg-success/5" :
                isAvoid ? "border-destructive/30 bg-destructive/5" :
                "border-border/60 bg-background/60"
              )}>
                <span className="text-[10px] font-medium text-muted-foreground">{day.label}</span>
                <DayIcon className={cn("h-4 w-4", CONDITION_COLOR[day.condition])} />
                <span className="text-xs font-bold text-foreground">{day.maxTemp}°</span>
                <span className={cn("text-[9px] font-medium",
                  day.rainChance >= 60 ? "text-destructive" : day.rainChance >= 30 ? "text-warning" : "text-success"
                )}>{day.rainChance}%</span>
                {isBest && <span className="text-[8px] text-success font-semibold">✓ Best</span>}
                {isAvoid && <span className="text-[8px] text-destructive font-semibold">✗ Avoid</span>}
              </div>
            );
          })}
        </div>

        {/* Best / avoid summary */}
        <div className="grid gap-2 sm:grid-cols-2">
          {rec.bestDays.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-2">
              <p className="text-xs font-semibold text-success">Best harvest days</p>
              <p className="text-xs text-muted-foreground">{rec.bestDays.join(", ")}</p>
            </div>
          )}
          {rec.avoidDays.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-xs font-semibold text-destructive">Avoid harvesting</p>
              <p className="text-xs text-muted-foreground">{rec.avoidDays.join(", ")} — rain risk</p>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/climate")}>
          <CloudSun className="h-3.5 w-3.5" />
          View full climate forecast
        </Button>
      </CardContent>
    </Card>
  );
}
