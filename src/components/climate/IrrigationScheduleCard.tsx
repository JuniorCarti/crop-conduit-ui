import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
}

type IrrigationAction = "irrigate" | "reduce" | "skip";

interface IrrigationDay {
  label: string;
  date: string;
  action: IrrigationAction;
  reason: string;
  rainMm: number;
  maxTemp: number;
}

const SAMPLE_DAYS: IrrigationDay[] = [
  { label: "Mon", date: "Mon", action: "irrigate", reason: "Hot & dry — high water demand",       rainMm: 0,    maxTemp: 31 },
  { label: "Tue", date: "Tue", action: "reduce",   reason: "Light rain expected — reduce by 50%", rainMm: 3.2,  maxTemp: 27 },
  { label: "Wed", date: "Wed", action: "skip",     reason: "Heavy rain — natural irrigation",     rainMm: 12.5, maxTemp: 22 },
  { label: "Thu", date: "Thu", action: "skip",     reason: "Soil still wet from yesterday",       rainMm: 6.1,  maxTemp: 24 },
  { label: "Fri", date: "Fri", action: "irrigate", reason: "Drying out — resume irrigation",      rainMm: 0.5,  maxTemp: 30 },
  { label: "Sat", date: "Sat", action: "irrigate", reason: "Hot day ahead — irrigate early AM",   rainMm: 0,    maxTemp: 32 },
  { label: "Sun", date: "Sun", action: "reduce",   reason: "Moderate rain — reduce by 30%",       rainMm: 8.4,  maxTemp: 25 },
];

const ACTION_CONFIG = {
  irrigate: { label: "Irrigate",    bg: "bg-info/10",        border: "border-info/30",        text: "text-info",        dot: "bg-info"        },
  reduce:   { label: "Reduce 50%",  bg: "bg-warning/10",     border: "border-warning/30",     text: "text-warning",     dot: "bg-warning"     },
  skip:     { label: "Skip",        bg: "bg-success/10",     border: "border-success/30",     text: "text-success",     dot: "bg-success"     },
};

function getIrrigationAction(rainMm: number, rainChance: number, maxTemp: number): IrrigationAction {
  if (rainMm >= 8 || rainChance >= 70) return "skip";
  if (rainMm >= 3 || rainChance >= 40) return "reduce";
  return "irrigate";
}

function getIrrigationReason(action: IrrigationAction, rainMm: number, maxTemp: number): string {
  if (action === "skip") return rainMm >= 8 ? "Heavy rain — natural irrigation sufficient" : "High rain chance — hold irrigation";
  if (action === "reduce") return rainMm >= 3 ? `Light rain (${rainMm}mm) — reduce by 50%` : "Moderate rain chance — reduce by 30%";
  return maxTemp >= 30 ? "Hot & dry — irrigate early morning" : "Dry conditions — maintain schedule";
}

export function IrrigationScheduleCard({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data: IrrigationDay[] = days.length
    ? days.map((day) => {
        const rainMm = Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10;
        const rainChance = Math.round(day.day.daily_chance_of_rain ?? 0);
        const maxTemp = Math.round(day.day.maxtemp_c ?? 0);
        const action = getIrrigationAction(rainMm, rainChance, maxTemp);
        return {
          label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          date: day.date,
          action,
          reason: getIrrigationReason(action, rainMm, maxTemp),
          rainMm,
          maxTemp,
        };
      })
    : SAMPLE_DAYS;

  const isMockup = days.length === 0;
  const irrigateDays = data.filter((d) => d.action === "irrigate").length;
  const skipDays = data.filter((d) => d.action === "skip").length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Droplets className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Irrigation Schedule</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-info/10 text-info border-info/30 border text-xs">{irrigateDays}d irrigate</Badge>
            <Badge className="bg-success/10 text-success border-success/30 border text-xs">{skipDays}d skip</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Daily water management based on rain forecast and temperature</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((day) => {
          const cfg = ACTION_CONFIG[day.action];
          return (
            <div
              key={day.date}
              className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", cfg.bg, cfg.border)}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", cfg.dot)} />
              <span className="text-sm font-semibold text-foreground w-8 shrink-0">{day.label}</span>
              <p className="flex-1 text-xs text-muted-foreground truncate">{day.reason}</p>
              <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                <span>{day.maxTemp}°C</span>
                <span>·</span>
                <span>{day.rainMm}mm</span>
                <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.text)}>
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
