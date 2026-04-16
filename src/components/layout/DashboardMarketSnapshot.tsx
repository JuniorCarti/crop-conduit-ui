import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface CropPrice {
  name: string;
  price: number;
  change: number;
  unit: string;
}

interface Props {
  prices: CropPrice[] | null | undefined;
  isLoading: boolean;
  crops?: string[];
}

const SAMPLE_PRICES: CropPrice[] = [
  { name: "Tomatoes",  price: 65, change: +8.2,  unit: "kg" },
  { name: "Kale",      price: 45, change: -2.1,  unit: "kg" },
  { name: "Potatoes",  price: 38, change: +1.5,  unit: "kg" },
  { name: "Onions",    price: 55, change: +12.4, unit: "kg" },
];

export function DashboardMarketSnapshot({ prices, isLoading, crops = [] }: Props) {
  const navigate = useNavigate();

  const display = prices && prices.length > 0
    ? (crops.length > 0
        ? prices.filter((p) => crops.some((c) => p.name.toLowerCase().includes(c.toLowerCase())))
        : prices
      ).slice(0, 4)
    : SAMPLE_PRICES;

  const isMockup = !prices || prices.length === 0;
  const bestPrice = [...display].sort((a, b) => b.price - a.price)[0];
  const risingCount = display.filter((p) => p.change > 3).length;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Market Prices</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {risingCount > 0 && (
              <Badge className="bg-success/10 text-success border-success/30 border text-xs">
                {risingCount} rising
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample</Badge>}
          </div>
        </div>
        {bestPrice && (
          <p className="text-xs text-muted-foreground">
            Best today: <span className="font-medium text-foreground">{bestPrice.name} at {formatKsh(bestPrice.price)}/{bestPrice.unit}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => <div key={i} className="h-10 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : (
          display.map((price) => {
            const isUp = price.change > 0;
            const isDown = price.change < 0;
            const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
            return (
              <div key={price.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                <span className="text-sm font-medium text-foreground">{price.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{formatKsh(price.price)}/{price.unit}</span>
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium",
                    isUp ? "text-success" : isDown ? "text-destructive" : "text-muted-foreground"
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    {isUp ? "+" : ""}{price.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })
        )}
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs" onClick={() => navigate("/market")}>
          View all prices & predictions <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
