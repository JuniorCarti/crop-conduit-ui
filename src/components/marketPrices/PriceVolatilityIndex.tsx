/**
 * Price Volatility Index Component
 * Shows stability scores and risk assessment for commodities
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield, Activity } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

interface VolatilityData {
  commodity: string;
  volatilityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  weeklyFluctuation: number;
  currentPrice: number;
  priceRange: { min: number; max: number };
  recommendation: string;
}

const MOCK_VOLATILITY: VolatilityData[] = [
  {
    commodity: "Tomatoes",
    volatilityScore: 75,
    riskLevel: "High",
    weeklyFluctuation: 25,
    currentPrice: 95,
    priceRange: { min: 70, max: 120 },
    recommendation: "Lock in prices early or use contracts to reduce risk",
  },
  {
    commodity: "Onions",
    volatilityScore: 45,
    riskLevel: "Medium",
    weeklyFluctuation: 15,
    currentPrice: 80,
    priceRange: { min: 68, max: 92 },
    recommendation: "Moderate risk - monitor daily price trends",
  },
  {
    commodity: "Irish Potato",
    volatilityScore: 30,
    riskLevel: "Low",
    weeklyFluctuation: 8,
    currentPrice: 65,
    priceRange: { min: 60, max: 70 },
    recommendation: "Stable commodity - safe for planning ahead",
  },
  {
    commodity: "Kale",
    volatilityScore: 55,
    riskLevel: "Medium",
    weeklyFluctuation: 18,
    currentPrice: 45,
    priceRange: { min: 37, max: 53 },
    recommendation: "Weather-sensitive - watch forecasts closely",
  },
  {
    commodity: "Cabbage",
    volatilityScore: 40,
    riskLevel: "Medium",
    weeklyFluctuation: 12,
    currentPrice: 55,
    priceRange: { min: 48, max: 62 },
    recommendation: "Relatively stable - good for consistent income",
  },
];

export function PriceVolatilityIndex() {
  const getRiskColor = (risk: string) => {
    if (risk === "High") return "bg-red-100 text-red-700 border-red-300";
    if (risk === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const getRiskIcon = (risk: string) => {
    if (risk === "High") return <AlertTriangle className="h-4 w-4" />;
    if (risk === "Medium") return <Activity className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getVolatilityColor = (score: number) => {
    if (score >= 60) return "bg-red-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Price Volatility Index
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Risk assessment and price stability scores for each commodity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insight */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">High Volatility Alert</h4>
              <p className="text-sm text-amber-700">
                Tomato prices fluctuate <span className="font-bold">±25% weekly</span> - Consider price contracts or early sales
              </p>
            </div>
          </div>
        </div>

        {/* Volatility Cards */}
        <div className="space-y-4">
          {MOCK_VOLATILITY.map((item) => (
            <div
              key={item.commodity}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{item.commodity}</h4>
                  <p className="text-sm text-muted-foreground">Current: {formatKsh(item.currentPrice)}</p>
                </div>
                <Badge className={getRiskColor(item.riskLevel)} variant="outline">
                  {getRiskIcon(item.riskLevel)}
                  <span className="ml-1">{item.riskLevel} Risk</span>
                </Badge>
              </div>

              {/* Volatility Score */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volatility Score</span>
                  <span className="font-semibold">{item.volatilityScore}/100</span>
                </div>
                <Progress value={item.volatilityScore} className="h-2" indicatorClassName={getVolatilityColor(item.volatilityScore)} />
              </div>

              {/* Price Range */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-2">7-Day Price Range</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="font-semibold text-red-600">{formatKsh(item.priceRange.min)}</p>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="font-semibold text-green-600">{formatKsh(item.priceRange.max)}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs text-blue-700">Weekly Fluctuation</p>
                  <p className="text-lg font-bold text-blue-900">±{item.weeklyFluctuation}%</p>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <p className="text-xs text-purple-700">Price Spread</p>
                  <p className="text-lg font-bold text-purple-900">{formatKsh(item.priceRange.max - item.priceRange.min)}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">💡 Strategy</p>
                <p className="text-sm text-blue-700">{item.recommendation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Risk Level Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Low Risk (0-40)</p>
                <p className="text-xs text-green-700">Stable prices, safe for planning</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Medium Risk (41-60)</p>
                <p className="text-xs text-yellow-700">Monitor trends, flexible timing</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">High Risk (61-100)</p>
                <p className="text-xs text-red-700">Lock prices early, use contracts</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
