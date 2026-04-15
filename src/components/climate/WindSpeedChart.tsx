import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind } from "lucide-react";
import {
  BarChart,
  Bar,
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
  { date: "Mon", wind: 12 },
  { date: "Tue", wind: 18 },
  { date: "Wed", wind: 32 },
  { date: "Thu", wind: 25 },
  { date: "Fri", wind: 14 },
  { date: "Sat", wind: 9 },
  { date: "Sun", wind: 21 },
];

const getBarColor = (wind: number) => {
  if (wind >= 35) return "hsl(var(--destructive))";
  if (wind >= 25) return "hsl(var(--warning))";
  return "hsl(var(--success))";
};

export function WindSpeedChart({ forecast, isLoading }: Props) {
  const days = forecast?.forecast?.forecastday ?? [];

  const data = days.length
    ? days.map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
        wind: Math.round(day.day.maxwind_kph ?? 0),
      }))
    : SAMPLE_DATA;

  const isMockup = days.length === 0;
  const peakWind = Math.max(...data.map((d) => d.wind));
  const peakTone = peakWind >= 35 ? "destructive" : peakWind >= 25 ? "warning" : "success";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
              <Wind className="h-3.5 w-3.5 text-foreground" />
            </div>
            <CardTitle className="text-base">Wind Speed Chart</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs ${peakTone === "destructive" ? "bg-destructive/10 text-destructive" : peakTone === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}
            >
              Peak {peakWind} km/h
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Daily max wind speed · Spray risk threshold at 25 km/h</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit=" kph" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} km/h`, "Max Wind"]}
              />
              <ReferenceLine y={25} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: "Spray limit", fontSize: 10, fill: "hsl(var(--warning))" }} />
              <ReferenceLine y={35} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "High risk", fontSize: 10, fill: "hsl(var(--destructive))" }} />
              <Bar
                dataKey="wind"
                radius={[3, 3, 0, 0]}
                fill="hsl(var(--primary))"
                // Color each bar individually based on value
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success inline-block" /> &lt;25 km/h Safe</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" /> 25–35 km/h Caution</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive inline-block" /> &gt;35 km/h High Risk</span>
        </div>
      </CardContent>
    </Card>
  );
}
