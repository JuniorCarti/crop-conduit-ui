import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudRain } from "lucide-react";
import {
  ComposedChart,
  Bar,
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
  { date: "Mon", mm: 0, chance: 10 },
  { date: "Tue", mm: 3.2, chance: 45 },
  { date: "Wed", mm: 12.5, chance: 80 },
  { date: "Thu", mm: 6.1, chance: 65 },
  { date: "Fri", mm: 0.5, chance: 20 },
  { date: "Sat", mm: 0, chance: 5 },
  { date: "Sun", mm: 8.4, chance: 70 },
];

export function RainfallBarChart({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data = days.length
    ? days.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        mm: Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10,
        chance: Math.round(day.day.daily_chance_of_rain ?? 0),
      }))
    : SAMPLE_DATA;

  const isMockup = days.length === 0;
  const totalMm = data.reduce((sum, d) => sum + d.mm, 0).toFixed(1);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <CloudRain className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">7-Day Rainfall Chart</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{totalMm} mm total</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Daily precipitation (mm) and rain probability (%)</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="mm" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="mm" />
              <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) =>
                  name === "mm" ? [`${value} mm`, "Precipitation"] : [`${value}%`, "Rain Chance"]
                }
              />
              <Legend formatter={(value) => value === "mm" ? "Precipitation (mm)" : "Rain Chance (%)"} />
              <Bar yAxisId="mm" dataKey="mm" fill="hsl(var(--info))" opacity={0.7} radius={[3, 3, 0, 0]} />
              <Line yAxisId="pct" type="monotone" dataKey="chance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
