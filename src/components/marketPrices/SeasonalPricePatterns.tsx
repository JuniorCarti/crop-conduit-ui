/**
 * Seasonal Price Patterns Component (UI Mockup)
 * Shows historical price patterns by month/season
 */

import { Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKsh } from "@/lib/currency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface SeasonalPricePatternsProps {
  commodity: string;
  market: string;
}

export function SeasonalPricePatterns({ commodity, market }: SeasonalPricePatternsProps) {
  // Mock data - will be replaced with real API data
  const mockSeasonalData = [
    { month: "Jan", avgPrice: 65, minPrice: 55, maxPrice: 75, trend: "Low" },
    { month: "Feb", avgPrice: 70, minPrice: 60, maxPrice: 80, trend: "Rising" },
    { month: "Mar", avgPrice: 85, minPrice: 75, maxPrice: 95, trend: "Peak" },
    { month: "Apr", avgPrice: 90, minPrice: 80, maxPrice: 100, trend: "Peak" },
    { month: "May", avgPrice: 75, minPrice: 65, maxPrice: 85, trend: "Falling" },
    { month: "Jun", avgPrice: 60, minPrice: 50, maxPrice: 70, trend: "Low" },
    { month: "Jul", avgPrice: 55, minPrice: 45, maxPrice: 65, trend: "Low" },
    { month: "Aug", avgPrice: 62, minPrice: 52, maxPrice: 72, trend: "Rising" },
    { month: "Sep", avgPrice: 78, minPrice: 68, maxPrice: 88, trend: "Rising" },
    { month: "Oct", avgPrice: 88, minPrice: 78, maxPrice: 98, trend: "Peak" },
    { month: "Nov", avgPrice: 82, minPrice: 72, maxPrice: 92, trend: "Falling" },
    { month: "Dec", avgPrice: 95, minPrice: 85, maxPrice: 105, trend: "Peak" },
  ];

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });
  const currentMonthData = mockSeasonalData.find((d) => d.month === currentMonth);
  const nextMonth = mockSeasonalData[(new Date().getMonth() + 1) % 12];

  const insights = [
    {
      title: "Best Selling Months",
      months: ["Mar", "Apr", "Oct", "Dec"],
      reason: "Prices typically 25-30% higher due to increased demand",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Avoid Selling",
      months: ["Jun", "Jul"],
      reason: "Oversupply period - prices drop 20-25% below average",
      icon: TrendingDown,
      color: "text-destructive",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seasonal Price Patterns
            </CardTitle>
            <CardDescription>
              Historical price trends for {commodity} in {market}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Month Insight */}
        <div className="mb-6 rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-sm font-semibold mb-2">Current Month: {currentMonth}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Average Price</p>
              <p className="text-lg font-bold">{formatKsh(currentMonthData?.avgPrice || 0)}/kg</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price Range</p>
              <p className="text-sm font-semibold">
                {formatKsh(currentMonthData?.minPrice || 0)} - {formatKsh(currentMonthData?.maxPrice || 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Next month ({nextMonth.month}): Expected average {formatKsh(nextMonth.avgPrice)}/kg
              {nextMonth.avgPrice > (currentMonthData?.avgPrice || 0) ? (
                <span className="text-success ml-1">↑ Rising</span>
              ) : (
                <span className="text-destructive ml-1">↓ Falling</span>
              )}
            </p>
          </div>
        </div>

        {/* Price Chart */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={mockSeasonalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value}`} />
              <Tooltip
                formatter={(value: number) => formatKsh(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="avgPrice" fill="#8884d8" name="Avg Price" />
              <Line type="monotone" dataKey="maxPrice" stroke="#82ca9d" name="Max Price" strokeWidth={2} />
              <Line type="monotone" dataKey="minPrice" stroke="#ff7c7c" name="Min Price" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Key Insights</p>
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-lg border border-border/60 bg-background p-4">
              <div className="flex items-start gap-3">
                <insight.icon className={`h-5 w-5 ${insight.color} mt-0.5`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {insight.months.map((month) => (
                      <Badge key={month} variant="secondary" className="text-xs">
                        {month}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{insight.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Year-over-Year Comparison */}
        <div className="mt-6 rounded-lg bg-muted/40 p-4">
          <p className="text-sm font-semibold mb-3">Year-over-Year Comparison</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">2024 Avg</p>
              <p className="font-semibold">{formatKsh(75)}/kg</p>
            </div>
            <div>
              <p className="text-muted-foreground">2023 Avg</p>
              <p className="font-semibold">{formatKsh(68)}/kg</p>
            </div>
            <div>
              <p className="text-muted-foreground">Change</p>
              <p className="font-semibold text-success">+10.3%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Prices have increased due to reduced supply from drought in major growing regions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
