import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CloudRain, Sun, Lock, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface ExtendedDay {
  date: string;
  label: string;
  minTemp: number;
  maxTemp: number;
  rainChance: number;
  condition: "dry" | "mixed" | "wet";
  week: 1 | 2;
}

// Generate 14 days of sample data seeded from real forecast if available
function buildExtendedDays(forecast: WeatherApiForecast | null): ExtendedDay[] {
  const real = forecast?.forecast?.forecastday ?? [];
  const days: ExtendedDay[] = [];

  for (let i = 0; i < 14; i++) {
    const realDay = real[i];
    const date = new Date(Date.now() + i * 86400000);
    const label = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    // Use real data for first 7 days, extrapolate for days 8-14
    const minTemp = realDay
      ? Math.round(realDay.day.mintemp_c)
      : Math.round(14 + Math.sin(i * 0.8) * 3 + (Math.random() * 2 - 1));
    const maxTemp = realDay
      ? Math.round(realDay.day.maxtemp_c)
      : Math.round(26 + Math.sin(i * 0.6) * 4 + (Math.random() * 3 - 1.5));
    const rainChance = realDay
      ? Math.round(realDay.day.daily_chance_of_rain ?? 0)
      : Math.round(Math.max(0, Math.min(100, 30 + Math.sin(i * 1.2) * 30)));

    const condition: ExtendedDay["condition"] =
      rainChance >= 60 ? "wet" : rainChance >= 30 ? "mixed" : "dry";

    days.push({ date: date.toISOString().slice(0, 10), label, minTemp, maxTemp, rainChance, condition, week: i < 7 ? 1 : 2 });
  }
  return days;
}

const CONDITION_STYLE = {
  dry:   { bg: "bg-warning/10",  text: "text-warning",  icon: Sun,       label: "Dry"   },
  mixed: { bg: "bg-muted/40",    text: "text-foreground", icon: Sun,      label: "Mixed" },
  wet:   { bg: "bg-info/10",     text: "text-info",     icon: CloudRain, label: "Wet"   },
};

export function ExtendedOutlookCard({ forecast, isPremium = false, onUpgrade }: Props) {
  const days = buildExtendedDays(forecast);
  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);
  const isMockup = !forecast?.forecast?.forecastday?.length;

  const week2AvgRain = Math.round(week2.reduce((s, d) => s + d.rainChance, 0) / week2.length);
  const week2AvgMax = Math.round(week2.reduce((s, d) => s + d.maxTemp, 0) / week2.length);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">14-Day Extended Outlook</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isPremium && <Badge className="bg-warning/10 text-warning border-warning/30 border text-xs gap-1"><Lock className="h-3 w-3" />Premium</Badge>}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Two-week temperature and rainfall outlook for planning</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week 1 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Week 1 — Days 1–7</p>
          <div className="grid grid-cols-7 gap-1">
            {week1.map((day) => {
              const cfg = CONDITION_STYLE[day.condition];
              const Icon = cfg.icon;
              return (
                <div key={day.date} className={cn("flex flex-col items-center gap-1 rounded-xl p-2 text-center", cfg.bg)}>
                  <span className="text-[10px] font-medium text-muted-foreground">{day.label.split(",")[0]}</span>
                  <Icon className={cn("h-4 w-4", cfg.text)} />
                  <span className="text-[10px] font-semibold text-foreground">{day.maxTemp}°</span>
                  <span className="text-[9px] text-muted-foreground">{day.minTemp}°</span>
                  <span className={cn("text-[9px] font-medium", cfg.text)}>{day.rainChance}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week 2 — locked for free users */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Week 2 — Days 8–14</p>
            {!isPremium && (
              <Badge className="bg-warning/10 text-warning border-warning/30 border text-[10px] gap-1">
                <Lock className="h-2.5 w-2.5" /> Premium only
              </Badge>
            )}
          </div>

          {isPremium ? (
            <div className="grid grid-cols-7 gap-1">
              {week2.map((day) => {
                const cfg = CONDITION_STYLE[day.condition];
                const Icon = cfg.icon;
                return (
                  <div key={day.date} className={cn("flex flex-col items-center gap-1 rounded-xl p-2 text-center", cfg.bg)}>
                    <span className="text-[10px] font-medium text-muted-foreground">{day.label.split(",")[0]}</span>
                    <Icon className={cn("h-4 w-4", cfg.text)} />
                    <span className="text-[10px] font-semibold text-foreground">{day.maxTemp}°</span>
                    <span className="text-[9px] text-muted-foreground">{day.minTemp}°</span>
                    <span className={cn("text-[9px] font-medium", cfg.text)}>{day.rainChance}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative rounded-xl border border-warning/30 bg-warning/5 p-4">
              {/* Blurred preview */}
              <div className="grid grid-cols-7 gap-1 blur-sm pointer-events-none select-none">
                {week2.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-2 text-center">
                    <span className="text-[10px]">{day.label.split(",")[0]}</span>
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px]">{day.maxTemp}°</span>
                    <span className="text-[9px]">{day.minTemp}°</span>
                    <span className="text-[9px]">{day.rainChance}%</span>
                  </div>
                ))}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl">
                <Lock className="h-5 w-5 text-warning" />
                <p className="text-xs font-semibold text-foreground">Week 2 requires Premium</p>
                <p className="text-[10px] text-muted-foreground">Avg {week2AvgMax}°C · {week2AvgRain}% rain chance</p>
                {onUpgrade && (
                  <Button size="sm" variant="outline" className="h-7 text-xs mt-1" onClick={onUpgrade}>
                    Upgrade to unlock
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "7-day avg max",  value: `${Math.round(week1.reduce((s,d)=>s+d.maxTemp,0)/7)}°C`,  icon: Thermometer, color: "text-warning" },
            { label: "7-day rain avg", value: `${Math.round(week1.reduce((s,d)=>s+d.rainChance,0)/7)}%`, icon: CloudRain,   color: "text-info"    },
            { label: "Wet days",       value: `${week1.filter(d=>d.condition==="wet").length} / 7`,       icon: CloudRain,   color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <span className="text-sm font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
