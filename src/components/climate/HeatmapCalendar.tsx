import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";
import type { ClimateSignal } from "@/lib/climateInsights";

interface Props {
  forecast: WeatherApiForecast | null;
  signals: ClimateSignal[];
}

type RiskLevel = "good" | "moderate" | "high" | "critical" | "none";

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  risk: RiskLevel;
  tooltip: string;
  hasForecast: boolean;
}

const RISK_STYLE: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  good:     { bg: "bg-success/20",     text: "text-success",     border: "border-success/40"     },
  moderate: { bg: "bg-warning/20",     text: "text-warning",     border: "border-warning/40"     },
  high:     { bg: "bg-orange-500/20",  text: "text-orange-500",  border: "border-orange-500/40"  },
  critical: { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive/40" },
  none:     { bg: "bg-muted/20",       text: "text-muted-foreground", border: "border-transparent" },
};

function getRiskFromForecast(rainChance: number, maxTemp: number, wind: number): RiskLevel {
  if (rainChance >= 80 || maxTemp >= 34 || wind >= 35) return "critical";
  if (rainChance >= 60 || maxTemp >= 30 || wind >= 25) return "high";
  if (rainChance >= 30 || maxTemp >= 27) return "moderate";
  return "good";
}

function buildCalendar(year: number, month: number, forecast: WeatherApiForecast | null): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const days: CalendarDay[] = [];

  // Pad start
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false, isToday: false, risk: "none", tooltip: "", hasForecast: false });
  }

  // Build forecast map
  const forecastMap: Record<string, { rainChance: number; maxTemp: number; wind: number }> = {};
  (forecast?.forecast?.forecastday ?? []).forEach((fd) => {
    forecastMap[fd.date] = {
      rainChance: fd.day.daily_chance_of_rain ?? 0,
      maxTemp: fd.day.maxtemp_c ?? 0,
      wind: fd.day.maxwind_kph ?? 0,
    };
  });

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const key = date.toISOString().slice(0, 10);
    const fd = forecastMap[key];
    const isToday = date.toDateString() === today.toDateString();
    let risk: RiskLevel = "none";
    let tooltip = "No forecast data";
    if (fd) {
      risk = getRiskFromForecast(fd.rainChance, fd.maxTemp, fd.wind);
      tooltip = `${Math.round(fd.maxTemp)}°C · ${Math.round(fd.rainChance)}% rain · ${Math.round(fd.wind)} kph wind`;
    }
    days.push({ date, day: d, isCurrentMonth: true, isToday, risk, tooltip, hasForecast: !!fd });
  }

  // Pad end to complete grid
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({ date, day: d, isCurrentMonth: false, isToday: false, risk: "none", tooltip: "", hasForecast: false });
  }

  return days;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function HeatmapCalendar({ forecast, signals }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);

  const isMockup = !forecast?.forecast?.forecastday?.length;
  const calDays = buildCalendar(viewYear, viewMonth, forecast);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const forecastDays = calDays.filter((d) => d.isCurrentMonth && d.hasForecast);
  const riskCounts = {
    critical: forecastDays.filter((d) => d.risk === "critical").length,
    high:     forecastDays.filter((d) => d.risk === "high").length,
    moderate: forecastDays.filter((d) => d.risk === "moderate").length,
    good:     forecastDays.filter((d) => d.risk === "good").length,
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Climate Heatmap Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Month-view calendar with colour-coded daily risk levels</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Risk summary */}
        {forecastDays.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(riskCounts).filter(([, v]) => v > 0).map(([level, count]) => {
              const s = RISK_STYLE[level as RiskLevel];
              return (
                <Badge key={level} className={cn("border text-[10px] px-2", s.bg, s.border, s.text)}>
                  {count}d {level}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Calendar grid */}
        <div className="space-y-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{w}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((d, i) => {
              const s = RISK_STYLE[d.isCurrentMonth ? d.risk : "none"];
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-lg border text-xs font-medium transition-all cursor-default",
                    d.isCurrentMonth ? s.bg : "bg-transparent",
                    d.isCurrentMonth ? s.border : "border-transparent",
                    d.isCurrentMonth ? s.text : "text-muted-foreground/30",
                    d.isToday && "ring-2 ring-primary ring-offset-1",
                    d.hasForecast && "cursor-pointer hover:opacity-80"
                  )}
                  onMouseEnter={() => d.hasForecast && setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {d.day}
                  {d.isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredDay && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <span className="font-semibold text-foreground">{hoveredDay.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            <span className="ml-2 text-muted-foreground">{hoveredDay.tooltip}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          {(["good","moderate","high","critical"] as RiskLevel[]).map((level) => {
            const s = RISK_STYLE[level];
            return (
              <span key={level} className="flex items-center gap-1 capitalize">
                <span className={cn("h-3 w-3 rounded border inline-block", s.bg, s.border)} />
                {level}
              </span>
            );
          })}
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-primary inline-block" /> Today
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
