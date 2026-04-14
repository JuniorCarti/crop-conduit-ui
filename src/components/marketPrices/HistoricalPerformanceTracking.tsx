/**
 * Historical Performance Tracking Component
 * Track farmer's past sales, timing analysis, and learning recommendations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { formatKsh } from "@/lib/currency";

interface SaleRecord {
  date: string;
  commodity: string;
  quantity: number;
  priceAchieved: number;
  marketAverage: number;
  timing: "Excellent" | "Good" | "Fair" | "Poor";
  profit: number;
}

const MOCK_SALES: SaleRecord[] = [
  {
    date: "2024-01-15",
    commodity: "Tomatoes",
    quantity: 150,
    priceAchieved: 115,
    marketAverage: 95,
    timing: "Excellent",
    profit: 3000,
  },
  {
    date: "2024-01-08",
    commodity: "Onions",
    quantity: 200,
    priceAchieved: 75,
    marketAverage: 80,
    timing: "Fair",
    profit: -1000,
  },
  {
    date: "2023-12-20",
    commodity: "Kale",
    quantity: 100,
    priceAchieved: 48,
    marketAverage: 45,
    timing: "Good",
    profit: 300,
  },
];

export function HistoricalPerformanceTracking() {
  const totalSales = MOCK_SALES.length;
  const avgPriceVsMarket = MOCK_SALES.reduce((sum, sale) => 
    sum + ((sale.priceAchieved - sale.marketAverage) / sale.marketAverage * 100), 0
  ) / totalSales;
  const totalProfit = MOCK_SALES.reduce((sum, sale) => sum + sale.profit, 0);
  const excellentTiming = MOCK_SALES.filter(s => s.timing === "Excellent").length;

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case "Excellent": return "bg-green-100 text-green-700 border-green-300";
      case "Good": return "bg-blue-100 text-blue-700 border-blue-300";
      case "Fair": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-red-100 text-red-700 border-red-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Historical Performance Tracking
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Your sales history and timing analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
            <p className="text-3xl font-bold">{totalSales}</p>
            <p className="text-xs text-muted-foreground">This year</p>
          </div>
          <div className="border rounded-lg p-4 text-center bg-green-50 border-green-200">
            <p className="text-sm text-green-700 mb-1">Avg vs Market</p>
            <p className="text-3xl font-bold text-green-600">+{avgPriceVsMarket.toFixed(1)}%</p>
            <p className="text-xs text-green-600">Above average</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
            <p className="text-3xl font-bold text-green-600">{formatKsh(totalProfit)}</p>
            <p className="text-xs text-muted-foreground">Net earnings</p>
          </div>
          <div className="border rounded-lg p-4 text-center bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Excellent Timing</p>
            <p className="text-3xl font-bold text-blue-600">{excellentTiming}</p>
            <p className="text-xs text-blue-600">Peak sales</p>
          </div>
        </div>

        {/* Sales History */}
        <div className="space-y-4">
          <h4 className="font-semibold">Recent Sales</h4>
          {MOCK_SALES.map((sale, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-lg">{sale.commodity}</h5>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(sale.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge className={getTimingColor(sale.timing)} variant="outline">
                  {sale.timing} Timing
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{sale.quantity} kg</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Your Price</p>
                  <p className="font-semibold text-green-600">{formatKsh(sale.priceAchieved)}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Market Avg</p>
                  <p className="font-semibold">{formatKsh(sale.marketAverage)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50 rounded p-3">
                <div>
                  <p className="text-xs text-blue-700">Performance vs Market</p>
                  <p className="font-semibold text-blue-900">
                    {sale.priceAchieved > sale.marketAverage ? "+" : ""}
                    {((sale.priceAchieved - sale.marketAverage) / sale.marketAverage * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700">Profit</p>
                  <p className={`font-semibold ${sale.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatKsh(sale.profit)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-semibold">📊 Performance Insights</h4>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-green-900 mb-1">Strength: Price Timing</h5>
                <p className="text-sm text-green-700">
                  You consistently sell above market average (+{avgPriceVsMarket.toFixed(1)}%). 
                  Keep using Market Oracle predictions!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-yellow-900 mb-1">Opportunity: Diversification</h5>
                <p className="text-sm text-yellow-700">
                  You've sold 3 different crops. Consider adding 2 more commodities to spread risk
                  and capture more market opportunities.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-blue-900 mb-1">Learning: Seasonal Patterns</h5>
                <p className="text-sm text-blue-700">
                  Your best sales were in January. Plan to harvest more during Q1 when prices peak.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-3">🎯 Personalized Recommendations</h5>
          <ul className="space-y-2 text-sm text-purple-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Continue selling tomatoes - you're 21% above market average</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Improve onion timing - you sold 6% below market last time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Try Irish Potato - high demand and stable prices in your region</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
