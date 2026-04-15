import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, AlertTriangle, CheckCircle2, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
}

interface DewDay {
  label: string;
  minTemp: number;
  avgHumidity: number;
  dewPoint: number;
  dewSpread: number;       // minTemp - dewPoint (lower = more dew)
  dewRisk: "high" | "medium" | "low";
  diseaseRisk: "high" | "medium" | "low";
  condensationLikely: boolean;
}

// Magnus formula dew point approximation
function calcDewPoint(tempC: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha) * 10) / 10;
}

function getDewRisk(spread: number): DewDay["dewRisk"] {
  if (spread <= 2) return "high";
  if (spread <= 5) return "medium";
  return "low";
}

function getDiseaseRisk(humidity: number, dewRisk: DewDay["dewRisk"]): DewDay["diseaseRisk"] {
  if (humidity >= 80 && dewRisk === "high") return "high";
  if (humidity >= 70 || dewRisk === "medium") return "medium";
  return "low";
}

const SAMPLE_DAYS: DewDay[] = [
  { label: "Mon", minTemp: 14, avgHumidity: 72, dewPoint: 9.1,  dewSpread: 4.9, dewRisk: "medium", diseaseRisk: "medium", condensationLikely: false },
  { label: "Tue", minTemp: 15, avgHumidity: 85, dewPoint: 12.7, dewSpread: 2.3, dewRisk: "high",   diseaseRisk: "high",   condensationLikely: true  },
  { label: "Wed", minTemp: 13, avgHumidity: 91, dewPoint: 11.8, dewSpread: 1.2, dewRisk: "high",   diseaseRisk: "high",   condensationLikely: true  },
  { label: "Thu", minTemp: 16, avgHumidity: 68, dewPoint: 10.2, dewSpread: 5.8, dewRisk: "low",    diseaseRisk: "low",    condensationLikely: false },
  { label: "Fri", minTemp: 17, avgHumidity: 74, dewPoint: 12.1, dewSpread: 4.9, dewRisk: "medium", diseaseRisk: "medium", condensationLikely: false },
  { label: "Sat", minTemp: 15, avgHumidity: 62, dewPoint: 7.8,  dewSpread: 7.2, dewRisk: "low",    diseaseRisk: "low",    condensationLikely: false },
  { label: "Sun", minTemp: 14, avgHumidity: 88, dewPoint: 12.1, dewSpread: 1.9, dewRisk: "high",   diseaseRisk: "high",   condensationLikely: true  },
];

const RISK_STYLE = {
  high:   { badge: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  medium: { badge: "bg-warning/10 text-warning border-warning/30",             dot: "bg-warning"     },
  low:    { badge: "bg-success/10 text-success border-success/30",             dot: "bg-success"     },
};

export function DewPointHumidityCard({ forecast }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];
  const isMockup = days.length === 0;

  const dewDays: DewDay[] = days.length
    ? days.map((day) => {
        const minTemp = day.day.mintemp_c;
        const avgHumidity = day.day.avghumidity ?? 70;
        const dewPoint = calcDewPoint(minTemp, avgHumidity);
        const dewSpread = Math.round((minTemp - dewPoint) * 10) / 10;
        const dewRisk = getDewRisk(dewSpread);
        const diseaseRisk = getDiseaseRisk(avgHumidity, dewRisk);
        return {
          label: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          minTemp: Math.round(minTemp),
          avgHumidity: Math.round(avgHumidity),
          dewPoint,
          dewSpread,
          dewRisk,
          diseaseRisk,
          condensationLikely: dewSpread <= 2,
        };
      })
    : SAMPLE_DAYS;

  const today = dewDays[0];
  const highRiskDays = dewDays.filter((d) => d.diseaseRisk === "high").length;
  const condensationDays = dewDays.filter((d) => d.condensationLikely).length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Droplets className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Dew Point & Overnight Humidity</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {highRiskDays > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-xs">
                {highRiskDays}d high disease risk
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Overnight dew formation and fungal disease pressure indicator</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today highlight */}
        <div className={cn("rounded-xl border p-4 grid grid-cols-3 gap-3", RISK_STYLE[today.diseaseRisk].badge)}>
          {[
            { label: "Min Temp",    value: `${today.minTemp}°C`,       icon: Thermometer },
            { label: "Dew Point",   value: `${today.dewPoint}°C`,      icon: Droplets    },
            { label: "Dew Spread",  value: `${today.dewSpread}°C`,     icon: Droplets    },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 text-center">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Today's risk summary */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3">
          {today.diseaseRisk === "high"
            ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            : today.diseaseRisk === "medium"
            ? <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
          }
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {today.condensationLikely ? "Dew formation likely tonight" : "Low dew risk tonight"}
            </p>
            <p className="text-xs text-muted-foreground">
              {today.diseaseRisk === "high"
                ? "High humidity + dew creates ideal conditions for fungal diseases. Apply preventive fungicide."
                : today.diseaseRisk === "medium"
                ? "Moderate humidity — monitor crops for early signs of mildew or blight."
                : "Conditions are dry enough to limit overnight disease pressure."}
            </p>
          </div>
        </div>

        {/* 7-day strip */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">7-day overnight risk</p>
          {dewDays.map((day) => {
            const rs = RISK_STYLE[day.diseaseRisk];
            return (
              <div key={day.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-8 shrink-0">{day.label}</span>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{day.minTemp}°C</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{day.dewPoint}°C dew</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{day.avgHumidity}% RH</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {day.condensationLikely && <Droplets className="h-3.5 w-3.5 text-info" />}
                  {day.diseaseRisk === "high" && <Bug className="h-3.5 w-3.5 text-destructive" />}
                  <Badge className={cn("border text-[10px] px-1.5", rs.badge)}>
                    {day.diseaseRisk === "high" ? "High" : day.diseaseRisk === "medium" ? "Med" : "Low"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {condensationDays > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 p-3">
            <Droplets className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Dew formation expected on <span className="font-medium text-foreground">{condensationDays} night(s)</span> this week. Ensure good air circulation and avoid overhead irrigation in evenings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
