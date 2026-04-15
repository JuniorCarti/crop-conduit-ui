import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, DollarSign, Truck, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { HarvestSchedule } from "@/types/harvest";

interface RevenueScenario {
  label: string;
  pricePerKg: number;
  yieldKg: number;
  transportCost: number;
  grossRevenue: number;
  netRevenue: number;
  tone: "good" | "warning" | "critical";
}

interface Props {
  schedules: HarvestSchedule[];
  currentMarketPrice?: number | null;
  economicAdjustmentPct?: number;
}

function buildScenarios(
  expectedYield: number,
  unit: string,
  basePrice: number,
  transportPerKg: number,
  economicAdj: number
): RevenueScenario[] {
  const adjPrice = Math.round(basePrice * (1 + economicAdj / 100));
  const pessimistic = Math.round(basePrice * 0.8);
  const optimistic = Math.round(basePrice * 1.2);

  return [
    {
      label: "Pessimistic",
      pricePerKg: pessimistic,
      yieldKg: Math.round(expectedYield * 0.85),
      transportCost: transportPerKg,
      grossRevenue: pessimistic * Math.round(expectedYield * 0.85),
      netRevenue: (pessimistic - transportPerKg) * Math.round(expectedYield * 0.85),
      tone: "critical",
    },
    {
      label: "Base case",
      pricePerKg: basePrice,
      yieldKg: expectedYield,
      transportCost: transportPerKg,
      grossRevenue: basePrice * expectedYield,
      netRevenue: (basePrice - transportPerKg) * expectedYield,
      tone: "warning",
    },
    {
      label: "Adjusted",
      pricePerKg: adjPrice,
      yieldKg: expectedYield,
      transportCost: transportPerKg,
      grossRevenue: adjPrice * expectedYield,
      netRevenue: (adjPrice - transportPerKg) * expectedYield,
      tone: "good",
    },
    {
      label: "Optimistic",
      pricePerKg: optimistic,
      yieldKg: Math.round(expectedYield * 1.1),
      transportCost: transportPerKg,
      grossRevenue: optimistic * Math.round(expectedYield * 1.1),
      netRevenue: (optimistic - transportPerKg) * Math.round(expectedYield * 1.1),
      tone: "good",
    },
  ];
}

const TONE_COLOR = { good: "#22c55e", warning: "#f59e0b", critical: "#ef4444" };
const TONE_BADGE: Record<string, string> = {
  good:     "bg-success/10 text-success border-success/30",
  warning:  "bg-warning/10 text-warning border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

export function RevenueForecast({ schedules, currentMarketPrice, economicAdjustmentPct = 8 }: Props) {
  const navigate = useNavigate();
  const isMockup = schedules.length === 0;

  const schedule = schedules[0] ?? null;
  const expectedYield = schedule?.expectedYield ?? 500;
  const basePrice = currentMarketPrice ?? 55;
  const transportPerKg = 8;

  const scenarios = buildScenarios(expectedYield, schedule?.yieldUnit ?? "kg", basePrice, transportPerKg, economicAdjustmentPct);
  const baseCase = scenarios.find((s) => s.label === "Base case")!;
  const adjusted = scenarios.find((s) => s.label === "Adjusted")!;
  const uplift = adjusted.netRevenue - baseCase.netRevenue;
  const upliftPct = baseCase.netRevenue > 0 ? Math.round((uplift / baseCase.netRevenue) * 100) : 0;

  const chartData = scenarios.map((s) => ({
    name: s.label,
    net: s.netRevenue,
    tone: s.tone,
  }));

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Revenue Forecast</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {economicAdjustmentPct !== 0 && (
              <Badge className={cn("border text-xs", economicAdjustmentPct > 0 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30")}>
                {economicAdjustmentPct > 0 ? "+" : ""}{economicAdjustmentPct}% econ. adj.
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule ? `${schedule.cropName} — ${schedule.expectedYield} ${schedule.yieldUnit}` : "Expected yield × best market price with economic adjustment"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Base revenue",    value: formatKsh(baseCase.grossRevenue),   icon: Package,    color: "text-foreground"  },
            { label: "Transport cost",  value: formatKsh(transportPerKg * expectedYield), icon: Truck, color: "text-warning"   },
            { label: "Base net",        value: formatKsh(baseCase.netRevenue),     icon: DollarSign, color: "text-foreground"  },
            { label: "Adjusted net",    value: formatKsh(adjusted.netRevenue),     icon: TrendingUp, color: "text-success"     },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
              <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
              <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Economic uplift */}
        {uplift !== 0 && (
          <div className={cn("flex items-center gap-2 rounded-xl border p-3",
            uplift > 0 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
          )}>
            {uplift > 0 ? <TrendingUp className="h-4 w-4 text-success shrink-0" /> : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
            <p className="text-xs text-muted-foreground">
              Economic signals (fuel, exchange rate, inflation) add{" "}
              <span className={cn("font-semibold", uplift > 0 ? "text-success" : "text-destructive")}>
                {uplift > 0 ? "+" : ""}{formatKsh(uplift)} ({upliftPct > 0 ? "+" : ""}{upliftPct}%)
              </span>{" "}
              to your base forecast
            </p>
          </div>
        )}

        {/* Scenario chart */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net revenue scenarios</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [formatKsh(value), "Net revenue"]}
                />
                <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={TONE_COLOR[entry.tone]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenario table */}
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {["Scenario", "Price/kg", "Yield", "Net revenue"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.label} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <Badge className={cn("border text-[10px] px-1.5", TONE_BADGE[s.tone])}>{s.label}</Badge>
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{formatKsh(s.pricePerKg)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.yieldKg} kg</td>
                  <td className={cn("px-3 py-2 font-bold", s.tone === "good" ? "text-success" : s.tone === "critical" ? "text-destructive" : "text-foreground")}>
                    {formatKsh(s.netRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/market")}>
          <TrendingUp className="h-3.5 w-3.5" />
          Check live prices to refine forecast
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
