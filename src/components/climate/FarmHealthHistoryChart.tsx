import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface Props {
  farmName?: string;
  currentScore?: number;
}

// Generate 30 days of sample health score history
function generateHistory(currentScore: number) {
  const days: { date: string; score: number; label: string }[] = [];
  let score = Math.max(30, currentScore - 15 + Math.random() * 10);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    score = Math.min(100, Math.max(20, score + (Math.random() * 10 - 4)));
    days.push({
      date: d.toISOString().slice(0, 10),
      label: i === 0 ? "Today" : i === 7 ? "7d ago" : i === 14 ? "14d ago" : i === 29 ? "30d ago" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Math.round(score),
    });
  }
  // Nudge last point to currentScore
  days[days.length - 1].score = currentScore;
  return days;
}

const SAMPLE_HISTORY = generateHistory(74);

export function FarmHealthHistoryChart({ farmName = "Your Farm", currentScore = 74 }: Props) {
  const data = SAMPLE_HISTORY;
  const prev7 = data.slice(-8, -1);
  const avgPrev = Math.round(prev7.reduce((s, d) => s + d.score, 0) / prev7.length);
  const trend = currentScore - avgPrev;
  const trendLabel = trend > 3 ? "Improving" : trend < -3 ? "Declining" : "Stable";
  const TrendIcon = trend > 3 ? TrendingUp : trend < -3 ? TrendingDown : Minus;
  const trendColor = trend > 3 ? "text-success" : trend < -3 ? "text-destructive" : "text-muted-foreground";

  const scoreColor = currentScore >= 75 ? "#22c55e" : currentScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Farm Health History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">30 days</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          How <span className="font-medium text-foreground">{farmName}</span>'s health score has trended over the past month
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Current score", value: `${currentScore}`, color: scoreColor },
            { label: "7-day avg",     value: `${avgPrev}`,      color: "hsl(var(--foreground))" },
            { label: "Trend",         value: trendLabel,         color: trendColor },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
              <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Trend indicator */}
        <div className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2",
          trend > 3 ? "border-success/30 bg-success/5" : trend < -3 ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-muted/20"
        )}>
          <TrendIcon className={cn("h-4 w-4 shrink-0", trendColor)} />
          <p className="text-xs text-muted-foreground">
            {trend > 3
              ? `Farm health improved by ${trend} points vs last week — keep up current practices`
              : trend < -3
              ? `Farm health declined by ${Math.abs(trend)} points vs last week — review recent signals`
              : "Farm health is stable — no significant change from last week"}
          </p>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={scoreColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={scoreColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
                interval={6}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}/100`, "Health Score"]}
                labelFormatter={(label) => label}
              />
              <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Good", fontSize: 9, fill: "#22c55e" }} />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Monitor", fontSize: 9, fill: "#f59e0b" }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={scoreColor}
                strokeWidth={2}
                fill="url(#healthGradient)"
                dot={false}
                activeDot={{ r: 4, fill: scoreColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success inline-block" /> 75–100 Healthy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" /> 50–74 Monitor</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive inline-block" /> 0–49 At Risk</span>
        </div>
      </CardContent>
    </Card>
  );
}
