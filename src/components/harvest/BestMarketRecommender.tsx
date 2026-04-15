import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Truck, Star, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface MarketOption {
  name: string;
  location: string;
  distanceKm: number;
  pricePerKg: number;
  transportCostKes: number;
  netPerKg: number;
  demandLevel: "High" | "Moderate" | "Low";
  score: number;
  isBest: boolean;
  notes?: string;
}

interface Props {
  cropName?: string;
  quantityKg?: number;
  markets?: MarketOption[];
}

const SAMPLE_MARKETS: MarketOption[] = [
  {
    name: "Wakulima Market",
    location: "Nairobi CBD",
    distanceKm: 45,
    pricePerKg: 65,
    transportCostKes: 8,
    netPerKg: 57,
    demandLevel: "High",
    score: 91,
    isBest: true,
    notes: "Highest volume buyer — tomatoes in high demand this week",
  },
  {
    name: "Marikiti Market",
    location: "Nairobi",
    distanceKm: 48,
    pricePerKg: 60,
    transportCostKes: 9,
    netPerKg: 51,
    demandLevel: "High",
    score: 78,
    isBest: false,
    notes: "Good alternative — slightly lower price but reliable buyers",
  },
  {
    name: "Nakuru Market",
    location: "Nakuru Town",
    distanceKm: 22,
    pricePerKg: 52,
    transportCostKes: 4,
    netPerKg: 48,
    demandLevel: "Moderate",
    score: 71,
    isBest: false,
    notes: "Closer but lower price — good if transport is limited",
  },
];

const DEMAND_STYLE: Record<string, string> = {
  High:     "bg-success/10 text-success border-success/30",
  Moderate: "bg-warning/10 text-warning border-warning/30",
  Low:      "bg-muted/60 text-muted-foreground border-border",
};

export function BestMarketRecommender({ cropName = "Tomatoes", quantityKg = 500, markets }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const display = markets ?? SAMPLE_MARKETS;
  const isMockup = !markets;
  const best = display.find((m) => m.isBest) ?? display[0];
  const bestRevenue = best ? best.netPerKg * quantityKg : 0;

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <MapPin className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Best Market Recommender</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Top 3 markets for <span className="font-medium text-foreground capitalize">{cropName}</span> ranked by net price after transport
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best market highlight */}
        {best && (
          <div className="rounded-xl border border-success/40 bg-success/5 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning fill-warning shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{best.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{best.location} · {best.distanceKm} km</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-success">{formatKsh(best.netPerKg)}/kg</p>
                <p className="text-[10px] text-muted-foreground">net after transport</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Market price",  value: `${formatKsh(best.pricePerKg)}/kg` },
                { label: "Transport",     value: `${formatKsh(best.transportCostKes)}/kg` },
                { label: "Est. revenue",  value: formatKsh(bestRevenue) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-background/70 p-2">
                  <p className="text-xs font-semibold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            {best.notes && <p className="text-xs text-muted-foreground">{best.notes}</p>}
          </div>
        )}

        {/* All market comparison */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Market comparison</p>
          {display.map((market, idx) => (
            <div
              key={market.name}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-all",
                market.isBest ? "border-success/30 bg-success/5" : "border-border/60 bg-background/60"
              )}
            >
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                market.isBest ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"
              )}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{market.name}</span>
                  <Badge className={cn("border text-[10px] px-1.5", DEMAND_STYLE[market.demandLevel])}>
                    {market.demandLevel} demand
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{market.distanceKm} km</span>
                  <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{formatKsh(market.pricePerKg)}/kg</span>
                  <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />-{formatKsh(market.transportCostKes)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-sm font-bold", market.isBest ? "text-success" : "text-foreground")}>
                  {formatKsh(market.netPerKg)}/kg
                </p>
                <p className="text-[10px] text-muted-foreground">Score: {market.score}</p>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/market")}>
          <TrendingUp className="h-3.5 w-3.5" />
          View live market prices
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
