import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Thermometer, CloudRain, Wind, Sun, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
}

interface HourSlot {
  hour: string;
  time: string;
  tempC: number;
  rainChance: number;
  windKph: number;
  condition: "sunny" | "cloudy" | "rainy";
  isNow: boolean;
  isBestSpray: boolean;
  isBestHarvest: boolean;
}

// Generate 24 hourly slots from daily data using a diurnal curve
function buildHourlySlots(forecast: WeatherApiForecast | null): HourSlot[] {
  const today = forecast?.forecast?.forecastday?.[0];
  const minTemp = today?.day.mintemp_c ?? 14;
  const maxTemp = today?.day.maxtemp_c ?? 28;
  const dailyRain = today?.day.daily_chance_of_rain ?? 30;
  const dailyWind = today?.day.maxwind_kph ?? 18;
  const now = new Date().getHours();

  return Array.from({ length: 24 }, (_, h) => {
    // Diurnal temperature curve: min at 6am, max at 2pm
    const tempFactor = Math.sin(((h - 6) / 24) * 2 * Math.PI);
    const tempC = Math.round(minTemp + ((maxTemp - minTemp) / 2) * (1 + tempFactor));

    // Rain more likely in afternoon
    const rainBias = h >= 13 && h <= 18 ? 1.3 : h >= 19 || h <= 5 ? 0.7 : 1;
    const rainChance = Math.round(Math.min(100, dailyRain * rainBias));

    // Wind peaks midday
    const windBias = h >= 10 && h <= 16 ? 1.4 : h <= 6 || h >= 20 ? 0.5 : 1;
    const windKph = Math.round(dailyWind * windBias);

    const condition: HourSlot["condition"] =
      rainChance >= 60 ? "rainy" : rainChance >= 30 ? "cloudy" : "sunny";

    const isBestSpray = rainChance < 20 && windKph < 15 && h >= 6 && h <= 10;
    const isBestHarvest = rainChance < 30 && tempC >= 18 && tempC <= 28 && h >= 6 && h <= 11;

    const hourDate = new Date();
    hourDate.setHours(h, 0, 0, 0);

    return {
      hour: String(h).padStart(2, "0"),
      time: hourDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      tempC,
      rainChance,
      windKph,
      condition,
      isNow: h === now,
      isBestSpray,
      isBestHarvest,
    };
  });
}

const CONDITION_ICON = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

const CONDITION_COLOR = {
  sunny: "text-warning",
  cloudy: "text-muted-foreground",
  rainy: "text-info",
};

export function HourlyForecastPanel({ forecast }: Props) {
  const slots = buildHourlySlots(forecast);
  const isMockup = !forecast?.forecast?.forecastday?.length;
  const now = new Date().getHours();

  // Show 12 hours starting from current hour
  const startIdx = now;
  const visible = [...slots.slice(startIdx), ...slots.slice(0, startIdx)].slice(0, 12);

  const bestSpraySlots = slots.filter((s) => s.isBestSpray).map((s) => s.time);
  const bestHarvestSlots = slots.filter((s) => s.isBestHarvest).map((s) => s.time);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Clock className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Hourly Forecast</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Today</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Hour-by-hour temperature, rain chance, and wind for today</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best windows */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-2">
            <p className="text-xs font-semibold text-success">Best spray window</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bestSpraySlots.length ? bestSpraySlots.slice(0, 3).join(", ") : "No ideal window today"}
            </p>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2">
            <p className="text-xs font-semibold text-warning">Best harvest window</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bestHarvestSlots.length ? bestHarvestSlots.slice(0, 3).join(", ") : "No ideal window today"}
            </p>
          </div>
        </div>

        {/* Hourly scroll */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {visible.map((slot) => {
              const Icon = CONDITION_ICON[slot.condition];
              return (
                <div
                  key={slot.hour}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 min-w-[60px] text-center transition-all",
                    slot.isNow
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : slot.isBestSpray
                      ? "border-success/40 bg-success/5"
                      : slot.isBestHarvest
                      ? "border-warning/40 bg-warning/5"
                      : "border-border/60 bg-background/60"
                  )}
                >
                  <span className={cn("text-[10px] font-semibold", slot.isNow ? "text-primary" : "text-muted-foreground")}>
                    {slot.isNow ? "Now" : slot.time}
                  </span>
                  <Icon className={cn("h-4 w-4", CONDITION_COLOR[slot.condition])} />
                  <span className="text-sm font-bold text-foreground">{slot.tempC}°</span>
                  <div className="flex items-center gap-0.5 text-[9px] text-info">
                    <CloudRain className="h-2.5 w-2.5" />
                    <span>{slot.rainChance}%</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Wind className="h-2.5 w-2.5" />
                    <span>{slot.windKph}</span>
                  </div>
                  {slot.isBestSpray && (
                    <span className="text-[8px] font-medium text-success bg-success/10 rounded-full px-1">Spray</span>
                  )}
                  {slot.isBestHarvest && !slot.isBestSpray && (
                    <span className="text-[8px] font-medium text-warning bg-warning/10 rounded-full px-1">Harvest</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" /> Current hour</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success inline-block" /> Best spray</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" /> Best harvest</span>
        </div>
      </CardContent>
    </Card>
  );
}
