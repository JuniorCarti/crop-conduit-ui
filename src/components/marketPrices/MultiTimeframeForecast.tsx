/**
 * Multi-Timeframe Forecast Component
 * Shows 1-day, 3-day, 7-day, 14-day, 30-day price forecasts with confidence intervals
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatKsh } from "@/lib/currency";

interface ForecastData {
  timeframe: string;
  predictedPrice: number;
  confidenceMin: number;
  confidenceMax: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  peakDay?: string;
}

const MOCK_FORECASTS: Record<string, ForecastData[]> = {
  "Tomatoes": [
    { timeframe: "1-Day", predictedPrice: 95, confidenceMin: 90, confidenceMax: 100, trend: "up", confidence: 95, peakDay: "Tomorrow" },
    { timeframe: "3-Day", predictedPrice: 102, confidenceMin: 95, confidenceMax: 110, trend: "up", confidence: 88 },
    { timeframe: "7-Day", predictedPrice: 115, confidenceMin: 105, confidenceMax: 125, trend: "up", confidence: 82, peakDay: "Day 5" },
    { timeframe: "14-Day", predictedPrice: 108, confidenceMin: 95, confidenceMax: 120, trend: "down", confidence: 75 },
    { timeframe: "30-Day", predictedPrice: 85, confidenceMin: 70, confidenceMax: 100, trend: "down", confidence: 68 },
  ],
  "Onions": [
    { timeframe: "1-Day", predictedPrice: 78, confidenceMin: 75, confidenceMax: 82, trend: "stable", confidence: 92 },
    { timeframe: "3-Day", predictedPrice: 80, confidenceMin: 76, confidenceMax: 85, trend: "up", confidence: 85 },
    { timeframe: "7-Day", predictedPrice: 88, confidenceMin: 82, confidenceMax: 95, trend: "up", confidence: 80, peakDay: "Day 6" },
    { timeframe: "14-Day", predictedPrice: 92, confidenceMin: 85, confidenceMax: 100, trend: "up", confidence: 72 },
    { timeframe: "30-Day", predictedPrice: 105, confidenceMin: 95, confidenceMax: 115, trend: "up", confidence: 65, peakDay: "Day 28" },
  ],
};

export function MultiTimeframeForecast() {
  const [selectedCommodity, setSelectedCommodity] = useState("Tomatoes");
  const forecasts = MOCK_FORECASTS[selectedCommodity] || MOCK_FORECASTS["Tomatoes"];

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <span className="h-4 w-4">→</span>;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Multi-Timeframe Forecasts
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Price predictions across multiple timeframes with confidence intervals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Tomatoes" onValueChange={setSelectedCommodity}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="Tomatoes">Tomatoes</TabsTrigger>
            <TabsTrigger value="Onions">Onions</TabsTrigger>
            <TabsTrigger value="Kale">Kale</TabsTrigger>
            <TabsTrigger value="Cabbage">Cabbage</TabsTrigger>
            <TabsTrigger value="Potato">Potato</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCommodity} className="space-y-4 mt-4">
            {/* Peak Price Alert */}
            {forecasts.find(f => f.peakDay) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Peak Price Expected</p>
                  <p className="text-sm text-green-700">
                    {selectedCommodity} prices will peak at {formatKsh(forecasts.find(f => f.peakDay)?.predictedPrice || 0)} on{" "}
                    {forecasts.find(f => f.peakDay)?.peakDay}
                  </p>
                </div>
              </div>
            )}

            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((forecast) => (
                <div
                  key={forecast.timeframe}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">{forecast.timeframe}</h4>
                    {getTrendIcon(forecast.trend)}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Predicted Price</p>
                      <p className={`text-2xl font-bold ${getTrendColor(forecast.trend)}`}>
                        {formatKsh(forecast.predictedPrice)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-muted-foreground mb-1">Confidence Range (±{100 - forecast.confidence}%)</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600">{formatKsh(forecast.confidenceMin)}</span>
                        <span className="text-gray-400">to</span>
                        <span className="text-green-600">{formatKsh(forecast.confidenceMax)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <Badge variant={forecast.confidence >= 80 ? "default" : "secondary"}>
                        {forecast.confidence}%
                      </Badge>
                    </div>

                    {forecast.peakDay && (
                      <div className="bg-green-50 rounded p-2 text-xs text-green-700">
                        🎯 Peak on {forecast.peakDay}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Best/Worst Case Scenarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">📈 Best Case Scenario</h4>
                <p className="text-sm text-green-700">
                  If market conditions remain favorable, prices could reach{" "}
                  <span className="font-bold">{formatKsh(Math.max(...forecasts.map(f => f.confidenceMax)))}</span> within 7 days
                </p>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">📉 Worst Case Scenario</h4>
                <p className="text-sm text-red-700">
                  If supply increases or demand drops, prices could fall to{" "}
                  <span className="font-bold">{formatKsh(Math.min(...forecasts.map(f => f.confidenceMin)))}</span> within 30 days
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
