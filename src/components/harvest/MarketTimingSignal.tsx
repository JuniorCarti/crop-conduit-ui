import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Star, Truck, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatKsh } from "@/lib/currency";

interface MarketDay {
  label: string;
  date: string;
  priceKes: number;
  transportCostKes: number;
  netKes: number;
  score: number;
  isBest: boolean;
}

interface Props {
  cropName?: string;
  currentPrice?: number | null;
  priceChangePct?: number | null;
  marketDays?: MarketDay[];
}

const SAMPLE_DAYS: MarketDay[] = [
  { label: "Mon", date: "Today",    priceKes: 55, transportCostKes: 8,  netKes: 47, score: 72, isBest: false },
  { label: "Tue", date: "Tomorrow", priceKes: 58, transportCostKes: 8,  netKes: 50, score: 85, isBest: true  },
  { label: "Wed", date: "Wed",      priceKes: 60, transportCostKes: 10, netKes: 50, score: 83, isBest: false },
  { label: "Thu", date: "Thu",      priceKes: 52, transportCostKes: 8,  netKes: 44, score: 61, isBest: false },
  { label: "Fri", date: "Fri",      priceKes: 54, transportCostKes: 9,  netKes: 45, score: 65, isBest: false },
];

export function MarketTimingSignal({ cropName = "Tomatoes", currentPrice, priceChangePct, marketDays }: Props) {
  const navigate = useNavigate();
  const days = marketDays ?? SAMPLE_DAYS;
  const isMockup = !marketDays;
  const bestDay = days.find((d) => d.isBest) ?? days[0];
  const maxNet = Math.max(...days.map((d) => d.netKes));
  const minNet = Math.min(...days.map((d) => d.netKes));
  const netRange = Math.max(maxNet - minNet, 1);

  const trend = priceChangePct != null
    ? priceChangePct > 3 ? "up" : priceChangePct < -3 ? "down" : "stable"
    : "stable";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const trendBg = trend === "up" ? "bg-success/10 border-success/30" : trend === "down" ? "bg-destructive/10 border-destructive/30" : "bg-muted/40 border-border";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Market Timing Signal</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs gap-1", trendBg, trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          Best day to sell <span className="font-medium text-foreground">{cropName}</span> this week (price minus transport)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best day highlight */}
        <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-3">
          <Star className="h-5 w-5 text-warning fill-warning shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Best day: {bestDay.label} ({bestDay.date})
            </p>
            <p className="text-xs text-muted-foreground">
              Net {formatKsh(bestDay.netKes)}/kg after transport · Score {bestDay.score}/100
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-success">{formatKsh(bestDay.priceKes)}</p>
            <p className="text-[10px] text-muted-foreground">per kg</p>
          </div>
        </div>

        {/* Current price if available */}
        {currentPrice != null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Current price</p>
              </div>
              <p className="text-base font-bold text-foreground">{formatKsh(currentPrice)}/kg</p>
              {priceChangePct != null && (
                <p className={cn("text-[10px] font-medium mt-0.5", trendColor)}>
                  {priceChangePct > 0 ? "+" : ""}{priceChangePct.toFixed(1)}% today
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Best net price</p>
              </div>
              <p className="text-base font-bold text-success">{formatKsh(bestDay.netKes)}/kg</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">after transport</p>
            </div>
          </div>
        )}

        {/* 5-day net price bars */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net price this week</p>
          {days.map((day) => {
            const barWidth = ((day.netKes - minNet) / netRange) * 100;
            return (
              <div key={day.label} className="flex items-center gap-3">
                <span className={cn("text-xs font-medium w-8 shrink-0", day.isBest ? "text-success" : "text-foreground")}>
                  {day.label}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", day.isBest ? "bg-success" : "bg-primary/60")}
                      style={{ width: `${Math.max(barWidth, 8)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground w-16 text-right">{formatKsh(day.netKes)}/kg</span>
                  {day.isBest && <Star className="h-3 w-3 text-warning fill-warning" />}
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/market")}>
          <TrendingUp className="h-3.5 w-3.5" />
          Check live market prices
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
