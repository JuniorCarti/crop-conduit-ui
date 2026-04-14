/**
 * Cross-Market Arbitrage Opportunities Component
 * Shows price differences across markets with transport cost analysis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Truck, DollarSign, AlertCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface ArbitrageOpportunity {
  fromMarket: string;
  toMarket: string;
  commodity: string;
  fromPrice: number;
  toPrice: number;
  priceDiff: number;
  distance: number;
  transportCost: number;
  netProfit: number;
  profitMargin: number;
  isViable: boolean;
}

const MOCK_ARBITRAGE: ArbitrageOpportunity[] = [
  {
    fromMarket: "Nairobi (Wakulima)",
    toMarket: "Mombasa",
    commodity: "Tomatoes",
    fromPrice: 80,
    toPrice: 120,
    priceDiff: 40,
    distance: 480,
    transportCost: 15,
    netProfit: 25,
    profitMargin: 31,
    isViable: true,
  },
  {
    fromMarket: "Nakuru",
    toMarket: "Nairobi (Wakulima)",
    commodity: "Irish Potato",
    fromPrice: 55,
    toPrice: 75,
    priceDiff: 20,
    distance: 160,
    transportCost: 8,
    netProfit: 12,
    profitMargin: 22,
    isViable: true,
  },
  {
    fromMarket: "Kisumu",
    toMarket: "Eldoret",
    commodity: "Onions",
    fromPrice: 70,
    toPrice: 85,
    priceDiff: 15,
    distance: 120,
    transportCost: 6,
    netProfit: 9,
    profitMargin: 13,
    isViable: true,
  },
  {
    fromMarket: "Nairobi (Gikomba)",
    toMarket: "Thika",
    commodity: "Kale",
    fromPrice: 40,
    toPrice: 48,
    priceDiff: 8,
    distance: 45,
    transportCost: 5,
    netProfit: 3,
    profitMargin: 8,
    isViable: false,
  },
];

export function CrossMarketArbitrage() {
  const viableOpportunities = MOCK_ARBITRAGE.filter(o => o.isViable);
  const bestOpportunity = MOCK_ARBITRAGE.reduce((best, current) => 
    current.netProfit > best.netProfit ? current : best
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cross-Market Arbitrage Opportunities
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Profit from price differences across markets</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best Opportunity Alert */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-6 w-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">🎯 Best Arbitrage Opportunity</h4>
              <p className="text-sm text-green-700 mb-2">
                <span className="font-bold">{bestOpportunity.commodity}</span>: {formatKsh(bestOpportunity.fromPrice)} in{" "}
                {bestOpportunity.fromMarket} → {formatKsh(bestOpportunity.toPrice)} in {bestOpportunity.toMarket}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">
                  Net Profit: <span className="font-bold">{formatKsh(bestOpportunity.netProfit)}/kg</span>
                </span>
                <span className="text-green-600">
                  Margin: <span className="font-bold">{bestOpportunity.profitMargin}%</span>
                </span>
              </div>
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              View Details
            </Button>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">
            {viableOpportunities.length} Viable Opportunities Found
          </h4>
          
          {MOCK_ARBITRAGE.map((opp, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                opp.isViable ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{opp.commodity}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{opp.fromMarket} → {opp.toMarket}</span>
                  </div>
                </div>
                {opp.isViable ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    ✓ Viable
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Low Margin
                  </Badge>
                )}
              </div>

              {/* Price Comparison */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white rounded p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Buy Price</p>
                  <p className="text-lg font-bold">{formatKsh(opp.fromPrice)}</p>
                  <p className="text-xs text-muted-foreground">{opp.fromMarket}</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Sell Price</p>
                  <p className="text-lg font-bold text-green-600">{formatKsh(opp.toPrice)}</p>
                  <p className="text-xs text-muted-foreground">{opp.toMarket}</p>
                </div>
                <div className="bg-green-100 rounded p-3 border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Price Diff</p>
                  <p className="text-lg font-bold text-green-600">+{formatKsh(opp.priceDiff)}</p>
                  <p className="text-xs text-green-700">+{Math.round((opp.priceDiff / opp.fromPrice) * 100)}%</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-lg p-3 border mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Transport Cost</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">-{formatKsh(opp.transportCost)}/kg</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Distance: {opp.distance} km</span>
                  <span>~{formatKsh(opp.transportCost * 100)} per 100kg</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`rounded-lg p-3 ${
                opp.isViable ? "bg-green-100 border border-green-200" : "bg-gray-100 border border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Net Profit (after transport)</p>
                    <p className={`text-2xl font-bold ${opp.isViable ? "text-green-600" : "text-gray-600"}`}>
                      {formatKsh(opp.netProfit)}/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Profit Margin</p>
                    <p className={`text-2xl font-bold ${opp.isViable ? "text-green-600" : "text-gray-600"}`}>
                      {opp.profitMargin}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              {opp.isViable && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Find Transport
                  </Button>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    Set Alert
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">💡 How Arbitrage Works</h4>
              <p className="text-sm text-blue-700">
                Buy produce at a lower price in one market and sell it at a higher price in another market.
                Ensure net profit covers transport costs and your time. Best for bulk quantities (100kg+).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
