import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
}

const SAMPLE_DATA = [
  { date: "Mon", humidity: 58 },
  { date: "Tue", humidity: 65 },
  { date: "Wed", humidity: 82 },
  { date: "Thu", humidity: 76 },
  { date: "Fri", humidity: 61 },
  { date: "Sat", humidity: 54 },
  { date: "Sun", humidity: 72 },
];

export function HumidityTrendChart({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data = days.length
    ? days.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        humidity: Math.round(day.day.avghumidity ?? 0),
      }))
    : SAMPLE_DATA;

  const isMockup = days.length === 0;
  const avgHumidity = Math.round(data.reduce((s, d) => s + d.humidity, 0) / data.length);
  const highDays = data.filter((d) => d.humidity >= 70).length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Droplets className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Humidity Trend</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Avg {avgHumidity}%</Badge>
            {highDays > 0 && (
              <Badge className="bg-warning/10 text-warning text-xs">{highDays}d high humidity</Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Average daily humidity · Disease risk threshold at 70%</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "Avg Humidity"]}
              />
              <ReferenceLine y={70} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: "Disease risk", fontSize: 10, fill: "hsl(var(--warning))" }} />
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#humidityGradient)"
                dot={{ r: 3, fill: "hsl(var(--success))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
