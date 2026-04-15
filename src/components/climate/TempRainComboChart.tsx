import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
}

const SAMPLE_DATA = [
  { date: "Mon", maxTemp: 26, minTemp: 14, rain: 0 },
  { date: "Tue", maxTemp: 28, minTemp: 15, rain: 3.2 },
  { date: "Wed", maxTemp: 22, minTemp: 13, rain: 12.5 },
  { date: "Thu", maxTemp: 25, minTemp: 16, rain: 6.1 },
  { date: "Fri", maxTemp: 30, minTemp: 17, rain: 0.5 },
  { date: "Sat", maxTemp: 27, minTemp: 15, rain: 0 },
  { date: "Sun", maxTemp: 24, minTemp: 14, rain: 8.4 },
];

export function TempRainComboChart({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data = days.length
    ? days.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        maxTemp: Math.round(day.day.maxtemp_c ?? 0),
        minTemp: Math.round(day.day.mintemp_c ?? 0),
        rain: Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10,
      }))
    : SAMPLE_DATA;

  const isMockup = days.length === 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Temperature vs Rainfall</CardTitle>
          </div>
          {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Combined view of temperature range and daily precipitation</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="temp" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="°" />
              <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="mm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "rain") return [`${value} mm`, "Precipitation"];
                  if (name === "maxTemp") return [`${value}°C`, "Max Temp"];
                  return [`${value}°C`, "Min Temp"];
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "rain" ? "Precipitation (mm)" : value === "maxTemp" ? "Max Temp" : "Min Temp"
                }
              />
              <Area yAxisId="temp" type="monotone" dataKey="maxTemp" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#tempGradient)" dot={{ r: 2 }} />
              <Area yAxisId="temp" type="monotone" dataKey="minTemp" stroke="hsl(var(--info))" strokeWidth={2} fill="none" dot={{ r: 2 }} />
              <Bar yAxisId="rain" dataKey="rain" fill="hsl(var(--primary))" opacity={0.6} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
