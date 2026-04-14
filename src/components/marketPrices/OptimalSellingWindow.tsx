/**
 * Optimal Selling Window Component
 * Shows countdown to best selling time with urgency alerts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingDown, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface SellingWindow {
  commodity: string;
  currentPrice: number;
  peakPrice: number;
  peakDate: string;
  hoursUntilPeak: number;
  dropAfterPeak: number;
  urgency: "low" | "medium" | "high" | "critical";
  recommendation: string;
  factors: string[];
}

const MOCK_WINDOWS: SellingWindow[] = [
  {
    commodity: "Tomatoes",
    currentPrice: 95,
    peakPrice: 115,
    peakDate: "Tomorrow, 2:00 PM",
    hoursUntilPeak: 18,
    dropAfterPeak: 15,
    urgency: "high",
    recommendation: "SELL TOMORROW: Prices peak at KSh 115, then drop 15%",
    factors: ["High demand expected", "Weather favorable", "Low supply in market"],
  },
  {
    commodity: "Onions",
    currentPrice: 80,
    peakPrice: 88,
    peakDate: "In 3 days",
    hoursUntilPeak: 72,
    dropAfterPeak: 8,
    urgency: "medium",
    recommendation: "WAIT 3 DAYS: Prices will rise 10% before stabilizing",
    factors: ["Gradual demand increase", "Stable supply", "No weather risks"],
  },
  {
    commodity: "Kale",
    currentPrice: 45,
    peakPrice: 42,
    peakDate: "Now",
    hoursUntilPeak: 0,
    dropAfterPeak: 20,
    urgency: "critical",
    recommendation: "SELL NOW: Prices dropping 20% in next 48 hours",
    factors: ["Oversupply incoming", "Competing harvests", "Weather improving"],
  },
];

export function OptimalSellingWindow() {
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, string> = {};
      MOCK_WINDOWS.forEach(window => {
        if (window.hoursUntilPeak > 0) {
          const hours = window.hoursUntilPeak;
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          newTimeLeft[window.commodity] = days > 0 
            ? `${days}d ${remainingHours}h` 
            : `${remainingHours}h`;
        } else {
          newTimeLeft[window.commodity] = "NOW";
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-green-100 text-green-700 border-green-300";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <Clock className="h-4 w-4" />;
      case "medium": return <Calendar className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getProgressValue = (hours: number) => {
    const maxHours = 72; // 3 days
    return Math.max(0, 100 - (hours / maxHours) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Optimal Selling Window
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Real-time countdown to best selling times</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {MOCK_WINDOWS.map((window) => (
          <div
            key={window.commodity}
            className={`border-2 rounded-lg p-5 ${
              window.urgency === "critical" 
                ? "border-red-300 bg-red-50" 
                : window.urgency === "high"
                ? "border-orange-300 bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-xl">{window.commodity}</h4>
                <p className="text-sm text-muted-foreground">Current: {formatKsh(window.currentPrice)}</p>
              </div>
              <Badge className={getUrgencyColor(window.urgency)} variant="outline">
                {getUrgencyIcon(window.urgency)}
                <span className="ml-1 uppercase">{window.urgency}</span>
              </Badge>
            </div>

            {/* Countdown */}
            {window.hoursUntilPeak > 0 ? (
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">Time Until Peak</span>
                  <span className="text-3xl font-bold text-green-600">
                    {timeLeft[window.commodity] || "..."}
                  </span>
                </div>
                <Progress value={getProgressValue(window.hoursUntilPeak)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">{window.peakDate}</p>
              </div>
            ) : (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">SELL NOW</span>
                </div>
              </div>
            )}

            {/* Price Projection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded p-3 border text-center">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-lg font-bold">{formatKsh(window.currentPrice)}</p>
              </div>
              <div className="bg-green-100 border border-green-300 rounded p-3 text-center">
                <p className="text-xs text-green-700 mb-1">Peak Price</p>
                <p className="text-lg font-bold text-green-600">{formatKsh(window.peakPrice)}</p>
              </div>
              <div className="bg-red-100 border border-red-300 rounded p-3 text-center">
                <p className="text-xs text-red-700 mb-1">After Peak</p>
                <p className="text-lg font-bold text-red-600">-{window.dropAfterPeak}%</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`rounded-lg p-4 mb-4 ${
              window.urgency === "critical" 
                ? "bg-red-100 border border-red-300" 
                : "bg-blue-50 border border-blue-200"
            }`}>
              <h5 className="font-semibold text-sm mb-2">🎯 Recommendation</h5>
              <p className={`text-sm font-semibold ${
                window.urgency === "critical" ? "text-red-700" : "text-blue-700"
              }`}>
                {window.recommendation}
              </p>
            </div>

            {/* Factors */}
            <div className="space-y-2 mb-4">
              <h5 className="font-semibold text-sm text-muted-foreground">Key Factors</h5>
              {window.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className={`flex-1 ${
                  window.urgency === "critical" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {window.hoursUntilPeak === 0 ? "List for Sale Now" : "Set Reminder"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Find Buyer
              </Button>
            </div>
          </div>
        ))}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 How It Works</h4>
          <p className="text-sm text-blue-700">
            Our AI analyzes weather forecasts, market demand, supply levels, and historical patterns to predict
            the optimal selling window. Act within the recommended timeframe to maximize your profit.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
