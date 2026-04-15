import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
}

type SprayStatus = "safe" | "caution" | "avoid";

interface SprayDay {
  date: string;
  label: string;
  status: SprayStatus;
  reason: string;
  wind: number;
  rain: number;
}

const SAMPLE_DAYS: SprayDay[] = [
  { date: "Mon", label: "Mon", status: "safe",    reason: "Low wind, no rain expected",        wind: 10, rain: 5  },
  { date: "Tue", label: "Tue", status: "safe",    reason: "Calm conditions, ideal window",     wind: 8,  rain: 10 },
  { date: "Wed", label: "Wed", status: "avoid",   reason: "Heavy rain forecast — spray washes off", wind: 14, rain: 80 },
  { date: "Thu", label: "Thu", status: "caution", reason: "Moderate wind — spray drift risk",  wind: 28, rain: 20 },
  { date: "Fri", label: "Fri", status: "safe",    reason: "Good conditions after rain clears", wind: 12, rain: 15 },
  { date: "Sat", label: "Sat", status: "caution", reason: "Wind picking up in afternoon",      wind: 26, rain: 5  },
  { date: "Sun", label: "Sun", status: "avoid",   reason: "High rain chance — avoid spraying", wind: 18, rain: 75 },
];

const STATUS_CONFIG = {
  safe:    { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     label: "Safe"    },
  caution: { icon: AlertTriangle, color: "text-warning",    bg: "bg-warning/10",     border: "border-warning/30",     label: "Caution" },
  avoid:   { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Avoid"   },
};

function getSprayStatus(wind: number, rainChance: number): SprayStatus {
  if (rainChance >= 60) return "avoid";
  if (wind >= 25 || rainChance >= 40) return "caution";
  return "safe";
}

function getSprayReason(wind: number, rainChance: number): string {
  if (rainChance >= 60) return "High rain chance — spray will wash off";
  if (wind >= 35) return "Very high wind — significant drift risk";
  if (wind >= 25) return "Moderate wind — spray drift possible";
  if (rainChance >= 40) return "Moderate rain chance — timing carefully";
  return "Good conditions for spraying";
}

export function SprayCalendarCard({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data: SprayDay[] = days.length
    ? days.map((day) => {
        const wind = Math.round(day.day.maxwind_kph ?? 0);
        const rain = Math.round(day.day.daily_chance_of_rain ?? 0);
        return {
          date: day.date,
          label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          status: getSprayStatus(wind, rain),
          reason: getSprayReason(wind, rain),
          wind,
          rain,
        };
      })
    : SAMPLE_DAYS;

  const isMockup = days.length === 0;
  const safeDays = data.filter((d) => d.status === "safe").length;
  const bestDay = data.find((d) => d.status === "safe");

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Wind className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Spray Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border-success/30 border text-xs">
              {safeDays} safe day{safeDays !== 1 ? "s" : ""}
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Day-by-day spray suitability based on wind and rain forecast
          {bestDay && <> · Best window: <span className="font-medium text-foreground">{bestDay.label}</span></>}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((day) => {
          const cfg = STATUS_CONFIG[day.status];
          const Icon = cfg.icon;
          return (
            <div
              key={day.date}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                cfg.bg, cfg.border
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground w-8 shrink-0">{day.label}</span>
                  <span className="text-xs text-muted-foreground truncate">{day.reason}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                <span>{day.wind} kph</span>
                <span>·</span>
                <span>{day.rain}%</span>
                <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.color)}>
                  {cfg.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
