import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, ShieldAlert, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
}

interface UVDay {
  label: string;
  uvi: number;
  level: "low" | "moderate" | "high" | "very-high" | "extreme";
  maxExposureMin: number;
  peakHour: string;
}

const UV_LEVELS = [
  { max: 2,  level: "low" as const,       label: "Low",       color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     tip: "Safe for most people. No protection needed."                    },
  { max: 5,  level: "moderate" as const,  label: "Moderate",  color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     tip: "Wear sunscreen SPF 30+. Seek shade during midday."               },
  { max: 7,  level: "high" as const,      label: "High",      color: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  tip: "Reduce time in sun 10am–4pm. Cover up and use SPF 50+."          },
  { max: 10, level: "very-high" as const, label: "Very High", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", tip: "Take extra precautions. Unprotected skin burns quickly."         },
  { max: 99, level: "extreme" as const,   label: "Extreme",   color: "text-destructive", bg: "bg-destructive/20", border: "border-destructive/40", tip: "Avoid sun exposure. White clothing and SPF 50+ essential."       },
];

const MAX_EXPOSURE: Record<string, number> = {
  low: 60, moderate: 30, high: 20, "very-high": 10, extreme: 5,
};

function getUVLevel(uvi: number) {
  return UV_LEVELS.find((l) => uvi <= l.max) ?? UV_LEVELS[UV_LEVELS.length - 1];
}

// Estimate UV from max temp and rain chance (proxy since WeatherAPI free tier doesn't include UV)
function estimateUVI(maxTemp: number, rainChance: number): number {
  const base = Math.max(1, Math.min(11, (maxTemp - 15) * 0.4 + 3));
  const cloudReduction = (rainChance / 100) * 3;
  return Math.round(Math.max(1, base - cloudReduction));
}

const SAMPLE_DAYS: UVDay[] = [
  { label: "Mon", uvi: 7,  level: "high",      maxExposureMin: 20, peakHour: "12:00 PM" },
  { label: "Tue", uvi: 9,  level: "very-high", maxExposureMin: 10, peakHour: "1:00 PM"  },
  { label: "Wed", uvi: 3,  level: "moderate",  maxExposureMin: 30, peakHour: "12:30 PM" },
  { label: "Thu", uvi: 5,  level: "moderate",  maxExposureMin: 30, peakHour: "12:00 PM" },
  { label: "Fri", uvi: 8,  level: "very-high", maxExposureMin: 10, peakHour: "1:00 PM"  },
  { label: "Sat", uvi: 6,  level: "high",      maxExposureMin: 20, peakHour: "12:00 PM" },
  { label: "Sun", uvi: 4,  level: "moderate",  maxExposureMin: 30, peakHour: "12:30 PM" },
];

export function UVIndexCard({ forecast }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];
  const isMockup = days.length === 0;

  const uvDays: UVDay[] = days.length
    ? days.map((day) => {
        const uvi = estimateUVI(day.day.maxtemp_c, day.day.daily_chance_of_rain ?? 0);
        const meta = getUVLevel(uvi);
        return {
          label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          uvi,
          level: meta.level,
          maxExposureMin: MAX_EXPOSURE[meta.level] ?? 30,
          peakHour: "12:00 PM",
        };
      })
    : SAMPLE_DAYS;

  const today = uvDays[0];
  const todayMeta = getUVLevel(today.uvi);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Sun className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">UV Index</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs", todayMeta.bg, todayMeta.border, todayMeta.color)}>
              Today: {todayMeta.label}
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Daily UV index with field worker safety guidance</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's detail */}
        <div className={cn("rounded-xl border p-4 space-y-3", todayMeta.bg, todayMeta.border)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Today's UV Index</p>
              <p className={cn("text-3xl font-bold", todayMeta.color)}>{today.uvi}</p>
              <p className={cn("text-sm font-semibold", todayMeta.color)}>{todayMeta.label}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Peak: {today.peakHour}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Max exposure: {today.maxExposureMin} min</span>
              </div>
            </div>
          </div>
          {/* UV bar */}
          <div className="space-y-1">
            <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-success via-warning via-orange-500 to-destructive">
              <div
                className="h-full w-1 bg-white rounded-full shadow-md transition-all"
                style={{ marginLeft: `${Math.min(95, (today.uvi / 11) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0 Low</span><span>3 Mod</span><span>6 High</span><span>8 V.High</span><span>11+ Ext</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className={cn("h-4 w-4 shrink-0 mt-0.5", todayMeta.color)} />
            <p className="text-xs text-muted-foreground">{todayMeta.tip}</p>
          </div>
        </div>

        {/* 7-day strip */}
        <div className="grid grid-cols-7 gap-1">
          {uvDays.map((day) => {
            const meta = getUVLevel(day.uvi);
            return (
              <div key={day.label} className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-center", meta.bg, meta.border)}>
                <span className="text-[10px] text-muted-foreground">{day.label}</span>
                <span className={cn("text-sm font-bold", meta.color)}>{day.uvi}</span>
                <span className={cn("text-[9px] font-medium", meta.color)}>{meta.label.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>

        {/* Worker safety tips */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Field worker safety</p>
          <div className="grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground">
            <span>• Work before 10am or after 4pm</span>
            <span>• Wear wide-brim hat and long sleeves</span>
            <span>• Apply SPF 30+ sunscreen every 2 hrs</span>
            <span>• Stay hydrated — 500ml water/hour</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
