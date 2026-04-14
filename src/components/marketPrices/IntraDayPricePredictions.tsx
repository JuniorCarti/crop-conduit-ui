/**
 * Intra-Day Price Predictions Component
 * Shows morning vs afternoon price differences and optimal selling times
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Sun, Sunset } from "lucide-react";
import { formatKsh } from "@/lib/currency";

interface IntraDayData {
  time: string;
  price: number;
  demand: "Low" | "Medium" | "High";
  isOptimal: boolean;
}

const MOCK_INTRADAY: Record<string, IntraDayData[]> = {
  "Wakulima Market": [
    { time: "6:00 AM", price: 85, demand: "Medium", isOptimal: false },
    { time: "8:00 AM", price: 88, demand: "High", isOptimal: false },
    { time: "10:00 AM", price: 92, demand: "High", isOptimal: true },
    { time: "12:00 PM", price: 95, demand: "Medium", isOptimal: true },
    { time: "2:00 PM", price: 98, demand: "High", isOptimal: true },
    { time: "4:00 PM", price: 90, demand: "Low", isOptimal: false },
    { time: "6:00 PM", price: 82, demand: "Low", isOptimal: false },
  ],
  "Gikomba Market": [
    { time: "6:00 AM", price: 80, demand: "High", isOptimal: true },
    { time: "8:00 AM", price: 85, demand: "High", isOptimal: true },
    { time: "10:00 AM", price: 88, demand: "Medium", isOptimal: false },
    { time: "12:00 PM", price: 87, demand: "Medium", isOptimal: false },
    { time: "2:00 PM", price: 85, demand: "Low", isOptimal: false },
    { time: "4:00 PM", price: 78, demand: "Low", isOptimal: false },
    { time: "6:00 PM", price: 75, demand: "Low", isOptimal: false },
  ],
};

export function IntraDayPricePredictions() {
  const market = "Wakulima Market";
  const data = MOCK_INTRADAY[market];
  const optimalTimes = data.filter(d => d.isOptimal);
  const peakPrice = Math.max(...data.map(d => d.price));
  const peakTime = data.find(d => d.price === peakPrice)?.time;

  const getDemandColor = (demand: string) => {
    if (demand === "High") return "bg-green-100 text-green-700 border-green-300";
    if (demand === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Intra-Day Price Predictions
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Optimal selling times throughout the day at {market}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insight */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-6 w-6 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Best Selling Time Today</h4>
              <p className="text-sm text-green-700">
                Prices peak at <span className="font-bold">{formatKsh(peakPrice)}</span> around{" "}
                <span className="font-bold">{peakTime}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">
                💡 Prices typically 8% higher after 2pm at this market
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Price Timeline (Tomatoes)</h4>
          {data.map((item, index) => (
            <div
              key={item.time}
              className={`relative border rounded-lg p-4 transition-all ${
                item.isOptimal
                  ? "border-green-300 bg-green-50 shadow-sm"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {index < 3 ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Sunset className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <p className="font-semibold">{item.time}</p>
                    <p className="text-xs text-muted-foreground">
                      {index < 3 ? "Morning" : index < 5 ? "Afternoon" : "Evening"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={getDemandColor(item.demand)} variant="outline">
                    {item.demand} Demand
                  </Badge>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatKsh(item.price)}</p>
                    {item.isOptimal && (
                      <p className="text-xs text-green-600 font-semibold">⭐ Optimal</p>
                    )}
                  </div>
                </div>
              </div>

              {item.isOptimal && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    🎯 High buyer activity and competitive pricing
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Morning Avg</p>
            <p className="text-lg font-bold">{formatKsh(88)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center bg-green-50 border-green-200">
            <p className="text-xs text-green-700 mb-1">Afternoon Peak</p>
            <p className="text-lg font-bold text-green-600">{formatKsh(98)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Evening Avg</p>
            <p className="text-lg font-bold">{formatKsh(79)}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h4>
          <p className="text-sm text-blue-700">
            Arrive at the market between <span className="font-bold">10:00 AM - 2:00 PM</span> for best prices.
            Avoid evening sales when demand drops and prices fall by up to 15%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
