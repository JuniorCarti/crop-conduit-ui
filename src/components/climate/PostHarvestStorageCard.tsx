import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Thermometer, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
  crop?: string;
}

interface StorageCondition {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
  tip: string;
  icon: React.ElementType;
}

const CROP_STORAGE: Record<string, { minTemp: number; maxTemp: number; maxHumidity: number; notes: string }> = {
  tomatoes:  { minTemp: 10, maxTemp: 15, maxHumidity: 85, notes: "Keep away from direct sunlight. Do not refrigerate unripe tomatoes." },
  potatoes:  { minTemp: 4,  maxTemp: 10, maxHumidity: 90, notes: "Store in dark, cool, well-ventilated area. Avoid light exposure." },
  kale:      { minTemp: 0,  maxTemp: 5,  maxHumidity: 95, notes: "Keep moist and cool. Best consumed within 3–5 days of harvest." },
  cabbage:   { minTemp: 0,  maxTemp: 5,  maxHumidity: 90, notes: "Store whole heads. Trim outer leaves before storage." },
  onion:     { minTemp: 0,  maxTemp: 10, maxHumidity: 65, notes: "Requires low humidity. Cure for 2–4 weeks before long-term storage." },
  maize:     { minTemp: 10, maxTemp: 25, maxHumidity: 70, notes: "Dry to <13% moisture before storage. Use hermetic bags." },
  default:   { minTemp: 8,  maxTemp: 18, maxHumidity: 80, notes: "Store in a cool, dry, well-ventilated space away from pests." },
};

export function PostHarvestStorageCard({ forecast, isLoading, crop = "tomatoes" }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];
  const isMockup = days.length === 0;

  const cropKey = crop.toLowerCase().replace(/s$/, "") in CROP_STORAGE
    ? crop.toLowerCase()
    : crop.toLowerCase().replace(/s$/, "") in CROP_STORAGE
    ? crop.toLowerCase().replace(/s$/, "")
    : "default";

  const guide = CROP_STORAGE[cropKey] ?? CROP_STORAGE.default;

  // Use today's forecast or sample values
  const today = days[0];
  const ambientTemp = today ? Math.round((today.day.maxtemp_c + today.day.mintemp_c) / 2) : 22;
  const ambientHumidity = today ? Math.round(today.day.avghumidity ?? 68) : 68;

  const tempStatus: "good" | "warning" | "critical" =
    ambientTemp <= guide.maxTemp ? "good" : ambientTemp <= guide.maxTemp + 5 ? "warning" : "critical";
  const humidStatus: "good" | "warning" | "critical" =
    ambientHumidity <= guide.maxHumidity ? "good" : ambientHumidity <= guide.maxHumidity + 10 ? "warning" : "critical";

  const conditions: StorageCondition[] = [
    {
      label: "Ambient Temperature",
      value: `${ambientTemp}°C`,
      status: tempStatus,
      tip: tempStatus === "good"
        ? `Within safe range (${guide.minTemp}–${guide.maxTemp}°C)`
        : `Too warm — target ${guide.minTemp}–${guide.maxTemp}°C`,
      icon: Thermometer,
    },
    {
      label: "Ambient Humidity",
      value: `${ambientHumidity}%`,
      status: humidStatus,
      tip: humidStatus === "good"
        ? `Within safe range (max ${guide.maxHumidity}%)`
        : `Too humid — target below ${guide.maxHumidity}%`,
      icon: Droplets,
    },
  ];

  const overallStatus = [tempStatus, humidStatus].includes("critical")
    ? "critical"
    : [tempStatus, humidStatus].includes("warning")
    ? "warning"
    : "good";

  const statusStyle = {
    good:     "bg-success/10 text-success border-success/30",
    warning:  "bg-warning/10 text-warning border-warning/30",
    critical: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
              <Package className="h-3.5 w-3.5 text-foreground" />
            </div>
            <CardTitle className="text-base">Post-Harvest Storage</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs capitalize", statusStyle[overallStatus])}>
              {overallStatus === "good" ? "Conditions OK" : overallStatus === "warning" ? "Monitor" : "Action Needed"}
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          Storage guidance for <span className="font-medium text-foreground">{crop}</span> based on today's ambient conditions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition rows */}
        <div className="grid gap-2 sm:grid-cols-2">
          {conditions.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={cn("rounded-xl border p-3 space-y-1", statusStyle[c.status])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{c.label}</span>
                  </div>
                  <span className="text-sm font-bold">{c.value}</span>
                </div>
                <p className="text-[10px] opacity-80">{c.tip}</p>
              </div>
            );
          })}
        </div>

        {/* Recommended range */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Recommended storage range</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {guide.minTemp}–{guide.maxTemp}°C</span>
            <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Max {guide.maxHumidity}% humidity</span>
          </div>
        </div>

        {/* Crop-specific note */}
        <div className={cn("flex items-start gap-2 rounded-xl border p-3", overallStatus === "good" ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5")}>
          {overallStatus === "good"
            ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            : <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          }
          <p className="text-xs text-muted-foreground">{guide.notes}</p>
        </div>
      </CardContent>
    </Card>
  );
}
