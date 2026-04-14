/**
 * Predictive Crop Recommendation Engine Component
 * AI-powered crop recommendations based on weather, market trends, soil, and competition
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, TrendingUp, Cloud, DollarSign, Users, AlertTriangle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CropRecommendation {
  crop: string;
  profitabilityScore: number;
  expectedROI: number;
  plantingDate: string;
  harvestDate: string;
  daysToHarvest: number;
  expectedRevenue: number;
  estimatedCosts: number;
  expectedProfit: number;
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  warnings: string[];
}

const MOCK_RECOMMENDATIONS: CropRecommendation[] = [
  {
    crop: "Tomatoes",
    profitabilityScore: 92,
    expectedROI: 145,
    plantingDate: "Next week",
    harvestDate: "In 90 days",
    daysToHarvest: 90,
    expectedRevenue: 245000,
    estimatedCosts: 100000,
    expectedProfit: 145000,
    riskLevel: "Medium",
    reasons: [
      "Peak prices expected in 90 days (KSh 115/kg)",
      "Favorable weather forecast for next 3 months",
      "Low competition - only 30% of farmers planting",
      "Your soil pH (6.5) is ideal for tomatoes",
      "You have proven success with tomatoes (3 harvests)",
    ],
    warnings: [
      "Tomato blight risk in rainy season - use resistant varieties",
      "Market may be saturated if many farmers plant now",
    ],
  },
  {
    crop: "Onions",
    profitabilityScore: 85,
    expectedROI: 120,
    plantingDate: "In 2 weeks",
    harvestDate: "In 120 days",
    daysToHarvest: 120,
    expectedRevenue: 220000,
    estimatedCosts: 100000,
    expectedProfit: 120000,
    riskLevel: "Low",
    reasons: [
      "Stable prices year-round (KSh 75-85/kg)",
      "Low volatility - safe investment",
      "High demand in December (holiday season)",
      "Drought-resistant - good for dry season",
      "Long shelf life reduces post-harvest losses",
    ],
    warnings: [
      "Longer growing period (120 days)",
    ],
  },
  {
    crop: "Kale",
    profitabilityScore: 78,
    expectedROI: 95,
    plantingDate: "Now",
    harvestDate: "In 60 days",
    daysToHarvest: 60,
    expectedRevenue: 97500,
    estimatedCosts: 50000,
    expectedProfit: 47500,
    riskLevel: "Low",
    reasons: [
      "Fast harvest (60 days) - quick returns",
      "Low input costs (KSh 50,000)",
      "Consistent demand from urban markets",
      "Multiple harvests possible (cut-and-come-again)",
      "Minimal pest problems",
    ],
    warnings: [
      "Lower profit margins compared to tomatoes",
      "Requires frequent watering",
    ],
  },
];

export function PredictiveCropRecommendationEngine() {
  const topRecommendation = MOCK_RECOMMENDATIONS[0];

  const getRiskColor = (risk: string) => {
    if (risk === "High") return "bg-red-100 text-red-700 border-red-300";
    if (risk === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              Predictive Crop Recommendation Engine
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>AI-powered crop recommendations for maximum profitability</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Recommendation Alert */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-green-900 text-lg mb-1">🎯 Top Recommendation: {topRecommendation.crop}</h4>
              <p className="text-sm text-green-700">
                Plant {topRecommendation.plantingDate.toLowerCase()} for {topRecommendation.expectedROI}% ROI
              </p>
            </div>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              {topRecommendation.profitabilityScore}/100
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Expected Profit</p>
              <p className="text-xl font-bold text-green-600">{formatKsh(topRecommendation.expectedProfit)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">ROI</p>
              <p className="text-xl font-bold text-blue-600">{topRecommendation.expectedROI}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Days to Harvest</p>
              <p className="text-xl font-bold">{topRecommendation.daysToHarvest}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
              <Badge className={getRiskColor(topRecommendation.riskLevel)}>
                {topRecommendation.riskLevel}
              </Badge>
            </div>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
            Start Planning {topRecommendation.crop} Crop
          </Button>
        </div>

        {/* All Recommendations */}
        <div className="space-y-4">
          <h4 className="font-semibold">All Crop Recommendations (Ranked by Profitability)</h4>
          
          {MOCK_RECOMMENDATIONS.map((rec, index) => (
            <div
              key={rec.crop}
              className={`border rounded-lg p-4 ${
                index === 0 ? "border-green-300 bg-green-50/50" : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${
                    index === 0 ? "text-green-600" : 
                    index === 1 ? "text-blue-600" : 
                    "text-gray-600"
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-lg">{rec.crop}</h5>
                    <p className="text-sm text-muted-foreground">
                      Plant {rec.plantingDate} • Harvest {rec.harvestDate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{rec.profitabilityScore}</div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>

              {/* Profitability Score Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Profitability Score</span>
                  <span className="font-semibold">{rec.profitabilityScore}/100</span>
                </div>
                <Progress value={rec.profitabilityScore} className="h-2" />
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-xs text-blue-700 mb-1">Expected Revenue</p>
                  <p className="font-bold text-blue-900">{formatKsh(rec.expectedRevenue)}</p>
                </div>
                <div className="bg-red-50 rounded p-3">
                  <p className="text-xs text-red-700 mb-1">Estimated Costs</p>
                  <p className="font-bold text-red-900">{formatKsh(rec.estimatedCosts)}</p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-xs text-green-700 mb-1">Expected Profit</p>
                  <p className="font-bold text-green-900">{formatKsh(rec.expectedProfit)}</p>
                </div>
              </div>

              {/* ROI and Risk */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border rounded p-3 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <p className="text-xl font-bold text-green-600">{rec.expectedROI}%</p>
                </div>
                <div className="border rounded p-3 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <Badge className={getRiskColor(rec.riskLevel)} variant="outline">
                    {rec.riskLevel}
                  </Badge>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-white rounded-lg p-4 mb-3 border">
                <h6 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-green-600" />
                  Why {rec.crop}?
                </h6>
                <div className="space-y-1">
                  {rec.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5"></div>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {rec.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h6 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Important Considerations
                  </h6>
                  <div className="space-y-1">
                    {rec.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                        <span>⚠️</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤖 How AI Makes Recommendations</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Cloud className="h-4 w-4 mt-0.5" />
              <span><strong>Weather Analysis:</strong> 90-day forecast for optimal growing conditions</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5" />
              <span><strong>Market Trends:</strong> Price predictions at harvest time</span>
            </div>
            <div className="flex items-start gap-2">
              <Sprout className="h-4 w-4 mt-0.5" />
              <span><strong>Soil Analysis:</strong> Your land's suitability for each crop</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5" />
              <span><strong>Competition:</strong> What other farmers are planting</span>
            </div>
          </div>
        </div>

        {/* Personalization Note */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-2">✨ Personalized for You</h5>
          <p className="text-sm text-purple-700">
            These recommendations are customized based on your farm location (Kiambu), land size (2 acres),
            soil type (loam), farming experience (3 years), and past crop performance. Update your profile
            for even better recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
