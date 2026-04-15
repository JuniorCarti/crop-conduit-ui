import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  crop?: string;
}

interface ETDay {
  label: string;
  et0: number;       // mm/day reference ET
  etCrop: number;    // mm/day crop-adjusted ET
  deficit: number;   // mm/day water deficit (ET - rain)
  action: "irrigate" | "monitor" | "skip";
}

// Simplified Hargreaves ET₀ estimation from daily temp + radiation proxy
function estimateET0(maxTemp: number, minTemp: number, rainMm: number): number {
  const avgTemp = (maxTemp + minTemp) / 2;
  const tempRange = maxTemp - minTemp;
  // Hargreaves simplified: ET0 ≈ 0.0023 * (Tmean + 17.8) * sqrt(Trange) * Ra
  // Ra proxy from latitude ~0° (Kenya): ~15 MJ/m²/day average
  const Ra = 15;
  const et0 = 0.0023 * (avgTemp + 17.8) * Math.sqrt(Math.max(0, tempRange)) * Ra;
  return Math.round(et0 * 10) / 10;
}

// Crop coefficients (Kc) by crop type
const CROP_KC: Record<string, number> = {
  tomatoes: 1.15, potatoes: 1.1, maize: 1.2, kale: 1.0,
  cabbage: 1.05, beans: 1.1, onion: 1.0, default: 1.0,
};

const SAMPLE_DAYS: ETDay[] = [
  { label: "Mon", et0: 4.2, etCrop: 4.8, deficit: 4.8,  action: "irrigate" },
  { label: "Tue", et0: 3.8, etCrop: 4.4, deficit: 1.2,  action: "monitor"  },
  { label: "Wed", et0: 2.1, etCrop: 2.4, deficit: -10.1, action: "skip"    },
  { label: "Thu", et0: 2.8, etCrop: 3.2, deficit: -3.3,  action: "skip"    },
  { label: "Fri", et0: 4.5, etCrop: 5.2, deficit: 4.7,  action: "irrigate" },
  { label: "Sat", et0: 5.1, etCrop: 5.9, deficit: 5.9,  action: "irrigate" },
  { label: "Sun", et0: 3.3, etCrop: 3.8, deficit: -4.6,  action: "skip"    },
];

const ACTION_CONFIG = {
  irrigate: { label: "Irrigate",  bg: "bg-info/10",    border: "border-info/30",    text: "text-info",    dot: "bg-info"    },
  monitor:  { label: "Monitor",   bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", dot: "bg-warning" },
  skip:     { label: "Skip",      bg: "bg-success/10", border: "border-success/30", text: "text-success", dot: "bg-success" },
};

export function EvapotranspirationCard({ forecast, crop = "tomatoes" }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];
  const isMockup = days.length === 0;

  const cropKey = Object.keys(CROP_KC).find((k) => crop.toLowerCase().includes(k)) ?? "default";
  const kc = CROP_KC[cropKey] ?? 1.0;

  const etDays: ETDay[] = days.length
    ? days.map((day) => {
        const et0 = estimateET0(day.day.maxtemp_c, day.day.mintemp_c, day.day.totalprecip_mm ?? 0);
        const etCrop = Math.round(et0 * kc * 10) / 10;
        const rainMm = day.day.totalprecip_mm ?? 0;
        const deficit = Math.round((etCrop - rainMm) * 10) / 10;
        const action: ETDay["action"] = deficit > 2 ? "irrigate" : deficit > 0 ? "monitor" : "skip";
        return {
          label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          et0,
          etCrop,
          deficit,
          action,
        };
      })
    : SAMPLE_DAYS;

  const totalDeficit = etDays.reduce((s, d) => s + Math.max(0, d.deficit), 0);
  const irrigateDays = etDays.filter((d) => d.action === "irrigate").length;
  const avgET0 = Math.round((etDays.reduce((s, d) => s + d.et0, 0) / etDays.length) * 10) / 10;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Droplets className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Evapotranspiration (ET₀)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">{crop}</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Daily crop water demand estimate · Kc = {kc} for <span className="font-medium text-foreground capitalize">{crop}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Avg ET₀",       value: `${avgET0} mm/d`,                  icon: Droplets,    color: "text-info"    },
            { label: "Total deficit",  value: `${Math.round(totalDeficit)} mm`,  icon: TrendingUp,  color: "text-warning" },
            { label: "Irrigate days",  value: `${irrigateDays} / ${etDays.length}`, icon: Minus,   color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <span className="text-sm font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Daily rows */}
        <div className="space-y-2">
          {etDays.map((day) => {
            const cfg = ACTION_CONFIG[day.action];
            const deficitAbs = Math.abs(day.deficit);
            const barWidth = Math.min(100, (deficitAbs / 8) * 100);
            return (
              <div key={day.label} className={cn("rounded-xl border px-3 py-2.5 space-y-1.5", cfg.bg, cfg.border)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                    <span className="text-sm font-semibold text-foreground w-8">{day.label}</span>
                    <span className="text-xs text-muted-foreground">ET₀ {day.et0} mm · Crop {day.etCrop} mm</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-medium", day.deficit > 0 ? "text-destructive" : "text-success")}>
                      {day.deficit > 0 ? `+${day.deficit}` : day.deficit} mm
                    </span>
                    <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.text)}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>
                {/* Deficit bar */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", day.deficit > 0 ? "bg-destructive/60" : "bg-success/60")}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground">
          ET₀ estimated using Hargreaves method from daily temperature range. Positive deficit = irrigation needed.
        </p>
      </CardContent>
    </Card>
  );
}
