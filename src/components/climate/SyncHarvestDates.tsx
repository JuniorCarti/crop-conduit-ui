import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  crop?: string;
  farmName?: string;
}

interface HarvestDate {
  date: string;
  label: string;
  score: number;
  reason: string;
  synced: boolean;
}

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

function buildHarvestDates(forecast: WeatherApiForecast | null): HarvestDate[] {
  const days = forecast?.forecast?.forecastday ?? [];
  if (!days.length) {
    return [
      { date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), label: "Wed", score: 92, reason: "Clear skies, low wind", synced: false },
      { date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), label: "Thu", score: 85, reason: "Mild conditions, no rain", synced: false },
      { date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), label: "Sat", score: 71, reason: "Partly cloudy, light wind", synced: false },
    ];
  }
  return days
    .map((day) => {
      const maxTemp = Math.round(day.day.maxtemp_c ?? 0);
      const wind = Math.round(day.day.maxwind_kph ?? 0);
      const rainChance = Math.round(day.day.daily_chance_of_rain ?? 0);
      const rainMm = Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10;
      const score = scoreDay(maxTemp, wind, rainChance, rainMm);
      const reason = rainChance < 20 && wind < 15
        ? "Clear skies, low wind"
        : rainChance < 40
        ? "Mostly dry conditions"
        : rainChance < 60
        ? "Moderate rain chance"
        : "High rain — harvest early";
      return {
        date: day.date,
        label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        score,
        reason,
        synced: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function SyncHarvestDates({ forecast, crop = "Tomatoes", farmName = "Your Farm" }: Props) {
  const navigate = useNavigate();
  const isMockup = !forecast?.forecast?.forecastday?.length;
  const [dates, setDates] = useState<HarvestDate[]>(() => buildHarvestDates(forecast));
  const [allSynced, setAllSynced] = useState(false);

  const syncDate = (idx: number) => {
    setDates((prev) => prev.map((d, i) => i === idx ? { ...d, synced: true } : d));
    toast.success(`${dates[idx].label} added to Harvest Planner`);
  };

  const syncAll = () => {
    setDates((prev) => prev.map((d) => ({ ...d, synced: true })));
    setAllSynced(true);
    toast.success("All harvest windows synced to Harvest Planner");
  };

  const syncedCount = dates.filter((d) => d.synced).length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <CalendarCheck className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Sync to Harvest Planner</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {syncedCount > 0 && (
              <Badge className="bg-success/10 text-success border-success/30 border text-xs">
                {syncedCount} synced
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Push the best harvest windows for <span className="font-medium text-foreground capitalize">{crop}</span> directly to your Harvest Planner
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Harvest date cards */}
        <div className="space-y-2">
          {dates.map((d, idx) => (
            <div
              key={d.date}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                d.synced ? "border-success/40 bg-success/5" : idx === 0 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/60"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                d.score >= 80 ? "bg-success/10 text-success" : d.score >= 60 ? "bg-warning/10 text-warning" : "bg-muted/60 text-muted-foreground"
              )}>
                {d.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.date}</span>
                  {idx === 0 && !d.synced && <Badge className="bg-primary/10 text-primary border-primary/30 border text-[10px]">Best</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{d.reason}</p>
              </div>
              {d.synced ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs shrink-0 gap-1" onClick={() => syncDate(idx)}>
                  <CalendarCheck className="h-3.5 w-3.5" /> Add
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="gap-2"
            onClick={syncAll}
            disabled={allSynced}
          >
            {allSynced ? <CheckCircle2 className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
            {allSynced ? "All synced!" : "Sync all windows"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/harvest")}
          >
            <ExternalLink className="h-4 w-4" />
            Open Harvest Planner
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {allSynced && (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">
              {syncedCount} harvest window{syncedCount !== 1 ? "s" : ""} added to your Harvest Planner for <span className="font-medium text-foreground">{farmName}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
