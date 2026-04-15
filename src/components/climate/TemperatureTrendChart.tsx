import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer } from "lucide-react";
import {
  LineChart,
  Line,
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
  { date: "Mon", min: 14, max: 26 },
  { date: "Tue", min: 15, max: 28 },
  { date: "Wed", min: 13, max: 24 },
  { date: "Thu", min: 16, max: 30 },
  { date: "Fri", min: 17, max: 31 },
  { date: "Sat", min: 15, max: 27 },
  { date: "Sun", min: 14, max: 25 },
];

export function TemperatureTrendChart({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data = days.length
    ? days.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        min: Math.round(day.day.mintemp_c),
        max: Math.round(day.day.maxtemp_c),
      }))
    : SAMPLE_DATA;

  const isMockup = days.length === 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Thermometer className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">7-Day Temperature Trend</CardTitle>
          </div>
          {isMockup && (
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Min / Max temperature across the forecast window</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="°" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`${value}°C`, name === "max" ? "Max Temp" : "Min Temp"]}
              />
              <Legend formatter={(value) => value === "max" ? "Max Temp" : "Min Temp"} />
              <Line type="monotone" dataKey="max" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="min" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
