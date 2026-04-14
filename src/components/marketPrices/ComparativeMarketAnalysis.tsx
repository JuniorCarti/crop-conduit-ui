/**
 * Comparative Market Analysis Component (UI Mockup)
 * Compares prices across multiple markets with transport cost analysis
 */

import { MapPin, TrendingUp, Truck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/currency";

interface MarketComparison {
  market: string;
  county: string;
  retailPrice: number;
  wholesalePrice: number;
  distanceKm: number;
  transportCost: number;
  netProfit: number;
  demand: "High" | "Moderate" | "Low";
  recommended: boolean;
}

interface ComparativeMarketAnalysisProps {
  commodity: string;
  currentLocation: string;
}

export function ComparativeMarketAnalysis({ commodity, currentLocation }: ComparativeMarketAnalysisProps) {
  // Mock data - will be replaced with real API data
  const mockComparisons: MarketComparison[] = [
    {
      market: "Wakulima (Nairobi)",
      county: "Nairobi",
      retailPrice: 85,
      wholesalePrice: 72,
      distanceKm: 45,
      transportCost: 1200,
      netProfit: 70800,
      demand: "High",
      recommended: true,
    },
    {
      market: "Kongowea (Mombasa)",
      county: "Mombasa",
      retailPrice: 90,
      wholesalePrice: 75,
      distanceKm: 480,
      transportCost: 8500,
      netProfit: 66500,
      demand: "Moderate",
      recommended: false,
    },
    {
      market: "Kisumu",
      county: "Kisumu",
      retailPrice: 78,
      wholesalePrice: 65,
      distanceKm: 320,
      transportCost: 5200,
      netProfit: 59800,
      demand: "Moderate",
      recommended: false,
    },
    {
      market: "Nakuru",
      county: "Nakuru",
      retailPrice: 80,
      wholesalePrice: 68,
      distanceKm: 120,
      transportCost: 2400,
      netProfit: 65600,
      demand: "High",
      recommended: false,
    },
  ];

  const getDemandBadge = (demand: string) => {
    const colors = {
      High: "bg-success/10 text-success border-success/30",
      Moderate: "bg-warning/10 text-warning border-warning/30",
      Low: "bg-muted text-muted-foreground border-border",
    };
    return colors[demand as keyof typeof colors] || colors.Low;
  };

  const bestMarket = mockComparisons.find((m) => m.recommended);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Market Comparison
            </CardTitle>
            <CardDescription>
              Best markets to sell {commodity} from {currentLocation}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {bestMarket && (
          <div className="mb-4 rounded-lg border-2 border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <p className="text-sm font-semibold text-success">Recommended Market</p>
            </div>
            <p className="text-lg font-bold">{bestMarket.market}</p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <p className="text-muted-foreground">Wholesale Price</p>
                <p className="font-semibold">{formatKsh(bestMarket.wholesalePrice)}/kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Profit (1000kg)</p>
                <p className="font-semibold text-success">{formatKsh(bestMarket.netProfit)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Distance</p>
                <p className="font-semibold">{bestMarket.distanceKm} km</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transport Cost</p>
                <p className="font-semibold">{formatKsh(bestMarket.transportCost)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-semibold">All Markets</p>
          {mockComparisons.map((market) => (
            <div
              key={market.market}
              className={`rounded-lg border p-4 ${market.recommended ? "border-success/30 bg-success/5" : "border-border/60 bg-background"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{market.market}</p>
                  <p className="text-xs text-muted-foreground">{market.county}</p>
                </div>
                <Badge className={getDemandBadge(market.demand)} variant="outline">
                  {market.demand} Demand
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Wholesale</p>
                  <p className="font-semibold">{formatKsh(market.wholesalePrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Retail</p>
                  <p className="font-semibold">{formatKsh(market.retailPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margin</p>
                  <p className="font-semibold text-success">
                    {formatKsh(market.retailPrice - market.wholesalePrice)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center gap-1">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{market.distanceKm} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Transport:</span>
                  <span className="font-semibold">{formatKsh(market.transportCost)}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-muted-foreground">Net Profit:</span>
                  <span className="font-semibold text-success">{formatKsh(market.netProfit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold">Calculation Assumptions:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Based on 1000 kg batch size</li>
            <li>Transport costs include fuel, driver, and vehicle hire</li>
            <li>Net profit = (Wholesale Price × 1000kg) - Transport Cost</li>
            <li>Prices updated daily from Market Oracle</li>
          </ul>
        </div>

        <Button className="w-full mt-4" variant="outline">
          View Detailed Transport Routes
        </Button>
      </CardContent>
    </Card>
  );
}
