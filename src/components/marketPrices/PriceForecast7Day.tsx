/**
 * 7-Day Price Forecast Component (UI Mockup)
 * Shows predicted prices for the next 7 days with confidence intervals
 */

import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKsh } from "@/lib/currency";
import { format, addDays } from "date-fns";

interface PriceForecast7DayProps {
  commodity: string;
  market: string;
  currentPrice: number;
}

export function PriceForecast7Day({ commodity, market, currentPrice }: PriceForecast7DayProps) {
  // Mock data - will be replaced with real API data
  const mockForecast = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    const variance = (Math.random() - 0.5) * 20;
    const price = currentPrice + variance;
    const confidence = Math.random() > 0.3 ? "High" : Math.random() > 0.5 ? "Medium" : "Low";
    const trend = variance > 2 ? "up" : variance < -2 ? "down" : "flat";
    
    return {
      date: format(date, "MMM dd"),
      fullDate: format(date, "yyyy-MM-dd"),
      price: Math.round(price),
      lowerBound: Math.round(price * 0.9),
      upperBound: Math.round(price * 1.1),
      confidence,
      trend,
      change: Math.round((variance / currentPrice) * 100),
    };
  });

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      High: "bg-success/10 text-success border-success/30",
      Medium: "bg-warning/10 text-warning border-warning/30",
      Low: "bg-muted text-muted-foreground border-border",
    };
    return colors[confidence as keyof typeof colors] || colors.Low;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>7-Day Price Forecast</CardTitle>
            <CardDescription>
              Predicted prices for {commodity} in {market}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockForecast.map((day) => (
            <div
              key={day.fullDate}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3"
            >
              <div className="flex items-center gap-3">
                {getTrendIcon(day.trend)}
                <div>
                  <p className="text-sm font-semibold">{day.date}</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {formatKsh(day.lowerBound)} - {formatKsh(day.upperBound)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold">{formatKsh(day.price)}</p>
                  <p className={`text-xs ${day.change > 0 ? "text-success" : day.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {day.change > 0 ? "+" : ""}{day.change}%
                  </p>
                </div>
                <Badge className={getConfidenceBadge(day.confidence)} variant="outline">
                  {day.confidence}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold">Note:</p>
          <p>Predictions based on historical trends, weather patterns, and market dynamics. Actual prices may vary.</p>
        </div>
      </CardContent>
    </Card>
  );
}
