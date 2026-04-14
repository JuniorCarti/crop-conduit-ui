/**
 * Dynamic Pricing Algorithm Component
 * Real-time price adjustments based on inventory, competition, weather, and demand
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingDown, TrendingUp, Cloud, Users, Package, AlertCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface PricingFactor {
  name: string;
  impact: number;
  direction: "increase" | "decrease";
  reason: string;
  icon: any;
}

interface PricingRecommendation {
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  urgency: "Low" | "Medium" | "High" | "Critical";
  reasoning: string;
  factors: PricingFactor[];
  expectedOutcome: string;
}

const MOCK_RECOMMENDATION: PricingRecommendation = {
  currentPrice: 100,
  recommendedPrice: 95,
  priceChange: -5,
  priceChangePercent: -5,
  urgency: "High",
  reasoning: "Lower price by 5% to sell faster before rain arrives tomorrow",
  factors: [
    {
      name: "Weather Forecast",
      impact: -8,
      direction: "decrease",
      reason: "Heavy rain expected tomorrow - sell before quality drops",
      icon: Cloud,
    },
    {
      name: "Inventory Level",
      impact: -5,
      direction: "decrease",
      reason: "You have 200kg - high inventory needs quick sale",
      icon: Package,
    },
    {
      name: "Competitor Pricing",
      impact: -3,
      direction: "decrease",
      reason: "3 farmers selling at KSh 92-95 nearby",
      icon: Users,
    },
    {
      name: "Demand Signal",
      impact: +4,
      direction: "increase",
      reason: "High buyer activity at Wakulima market today",
      icon: TrendingUp,
    },
  ],
  expectedOutcome: "85% chance of selling all 200kg within 6 hours at KSh 95",
};

export function DynamicPricingAlgorithm() {
  const [customPrice, setCustomPrice] = useState(MOCK_RECOMMENDATION.recommendedPrice);
  const [urgencyLevel, setUrgencyLevel] = useState<"Low" | "Medium" | "High">("Medium");

  const getUrgencyColor = (urgency: string) => {
    if (urgency === "Critical") return "bg-red-100 text-red-700 border-red-300";
    if (urgency === "High") return "bg-orange-100 text-orange-700 border-orange-300";
    if (urgency === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const calculateExpectedSaleTime = (price: number) => {
    const diff = price - MOCK_RECOMMENDATION.recommendedPrice;
    if (diff <= -5) return "2-4 hours";
    if (diff <= 0) return "4-6 hours";
    if (diff <= 5) return "8-12 hours";
    return "12-24 hours";
  };

  const calculateSaleProbability = (price: number) => {
    const diff = price - MOCK_RECOMMENDATION.recommendedPrice;
    if (diff <= -5) return 95;
    if (diff <= 0) return 85;
    if (diff <= 5) return 65;
    return 45;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Dynamic Pricing Algorithm
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>AI-powered real-time price optimization</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Urgency Alert */}
        <div className={`border-2 rounded-lg p-4 ${
          MOCK_RECOMMENDATION.urgency === "High" || MOCK_RECOMMENDATION.urgency === "Critical"
            ? "bg-orange-50 border-orange-300"
            : "bg-blue-50 border-blue-300"
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`h-6 w-6 mt-0.5 ${
              MOCK_RECOMMENDATION.urgency === "High" ? "text-orange-600" : "text-blue-600"
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">AI Pricing Recommendation</h4>
                <Badge className={getUrgencyColor(MOCK_RECOMMENDATION.urgency)}>
                  {MOCK_RECOMMENDATION.urgency} Urgency
                </Badge>
              </div>
              <p className="text-sm font-semibold mb-2">{MOCK_RECOMMENDATION.reasoning}</p>
              <p className="text-xs text-muted-foreground">{MOCK_RECOMMENDATION.expectedOutcome}</p>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Price</p>
            <p className="text-3xl font-bold">{formatKsh(MOCK_RECOMMENDATION.currentPrice)}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700 mb-1">AI Recommended</p>
            <p className="text-3xl font-bold text-green-600">
              {formatKsh(MOCK_RECOMMENDATION.recommendedPrice)}
            </p>
          </div>
          <div className={`border rounded-lg p-4 text-center ${
            MOCK_RECOMMENDATION.priceChange < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Change</p>
            <p className={`text-3xl font-bold ${
              MOCK_RECOMMENDATION.priceChange < 0 ? "text-red-600" : "text-green-600"
            }`}>
              {MOCK_RECOMMENDATION.priceChange > 0 ? "+" : ""}
              {MOCK_RECOMMENDATION.priceChangePercent}%
            </p>
          </div>
        </div>

        {/* Pricing Factors */}
        <div className="space-y-3">
          <h5 className="font-semibold">Pricing Factors Analysis</h5>
          {MOCK_RECOMMENDATION.factors.map((factor, idx) => {
            const Icon = factor.icon;
            return (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  factor.direction === "decrease" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${
                      factor.direction === "decrease" ? "text-red-600" : "text-green-600"
                    }`} />
                    <div>
                      <h6 className="font-semibold">{factor.name}</h6>
                      <p className="text-sm text-muted-foreground">{factor.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      factor.direction === "decrease" ? "text-red-600" : "text-green-600"
                    }`}>
                      {factor.impact > 0 ? "+" : ""}{factor.impact}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Price Adjuster */}
        <div className="border-2 border-purple-200 rounded-lg p-5 bg-purple-50">
          <h5 className="font-semibold mb-4">🎯 Adjust Your Price</h5>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Your Price</span>
              <span className="text-3xl font-bold text-purple-600">{formatKsh(customPrice)}</span>
            </div>
            <Slider
              value={[customPrice]}
              onValueChange={(value) => setCustomPrice(value[0])}
              min={80}
              max={120}
              step={1}
              className="mb-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatKsh(80)}</span>
              <span>AI: {formatKsh(MOCK_RECOMMENDATION.recommendedPrice)}</span>
              <span>{formatKsh(120)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded p-3">
              <p className="text-xs text-muted-foreground mb-1">Expected Sale Time</p>
              <p className="font-semibold">{calculateExpectedSaleTime(customPrice)}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-muted-foreground mb-1">Sale Probability</p>
              <p className="font-semibold text-green-600">{calculateSaleProbability(customPrice)}%</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold">Sale Urgency</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Low", "Medium", "High"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgencyLevel(level)}
                  className={`py-2 px-3 rounded text-sm font-semibold transition-colors ${
                    urgencyLevel === level
                      ? level === "High"
                        ? "bg-red-600 text-white"
                        : level === "Medium"
                        ? "bg-yellow-600 text-white"
                        : "bg-green-600 text-white"
                      : "bg-white border"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {customPrice !== MOCK_RECOMMENDATION.recommendedPrice && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <p className="text-sm text-amber-700">
                {customPrice > MOCK_RECOMMENDATION.recommendedPrice
                  ? `⚠️ Pricing ${Math.abs(customPrice - MOCK_RECOMMENDATION.recommendedPrice)}% above AI recommendation may slow sales`
                  : `✅ Pricing ${Math.abs(customPrice - MOCK_RECOMMENDATION.recommendedPrice)}% below AI recommendation will speed up sales`
                }
              </p>
            </div>
          )}

          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Set Price at {formatKsh(customPrice)}
          </Button>
        </div>

        {/* Pricing Scenarios */}
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold mb-3">📊 Pricing Scenarios</h5>
          <div className="space-y-2">
            {[
              { price: 90, label: "Aggressive (Fast Sale)", time: "2-4 hours", prob: 95, color: "green" },
              { price: 95, label: "AI Recommended (Balanced)", time: "4-6 hours", prob: 85, color: "blue" },
              { price: 100, label: "Current Price (Slower)", time: "8-12 hours", prob: 65, color: "yellow" },
              { price: 105, label: "Premium (Risky)", time: "12-24 hours", prob: 45, color: "red" },
            ].map((scenario) => (
              <div
                key={scenario.price}
                className={`flex items-center justify-between p-3 rounded ${
                  scenario.price === MOCK_RECOMMENDATION.recommendedPrice
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-sm">{formatKsh(scenario.price)}</p>
                  <p className="text-xs text-muted-foreground">{scenario.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{scenario.time}</p>
                  <p className={`text-xs font-semibold text-${scenario.color}-600`}>
                    {scenario.prob}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤖 How Dynamic Pricing Works</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Cloud className="h-4 w-4 mt-0.5" />
              <span><strong>Weather Analysis:</strong> Adjusts prices based on forecast (rain, heat, frost)</span>
            </div>
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5" />
              <span><strong>Inventory Tracking:</strong> Higher inventory = lower prices for faster sales</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5" />
              <span><strong>Competition Monitoring:</strong> Matches or undercuts nearby farmer prices</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5" />
              <span><strong>Demand Signals:</strong> Increases prices when buyer activity is high</span>
            </div>
          </div>
        </div>

        {/* Success Stats */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3">✅ Your Dynamic Pricing Performance</h5>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">87%</p>
              <p className="text-xs text-green-700">Sold Within Target Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">+8%</p>
              <p className="text-xs text-green-700">Avg Above Market</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">23</p>
              <p className="text-xs text-green-700">Successful Sales</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
