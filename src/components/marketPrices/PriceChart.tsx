/**
 * Price Chart Component
 * Compares Wholesale vs Retail prices
 */

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatKsh } from "@/lib/currency";
import { format } from "date-fns";
import type { MarketPrice } from "@/services/marketPriceService";

interface PriceChartProps {
  commodity?: string;
  market?: string;
  days?: number;
}

export function PriceChart({ commodity, market, days = 30 }: PriceChartProps) {
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }, [days]);

  const { prices, isLoading } = useMarketPrices({
    commodity,
    market,
    startDate,
  });

  // Group prices by date
  const chartData = useMemo(() => {
    const grouped = new Map<string, { date: string; wholesale: number; retail: number; count: number }>();

    prices.forEach((price) => {
      const dateKey = format(price.date, "yyyy-MM-dd");
      const existing = grouped.get(dateKey) || { date: dateKey, wholesale: 0, retail: 0, count: 0 };

      existing.wholesale += price.wholesale;
      existing.retail += price.retail;
      existing.count += 1;

      grouped.set(dateKey, existing);
    });

    // Calculate averages
    const result = Array.from(grouped.values())
      .map((item) => ({
        date: format(new Date(item.date), "MMM dd"),
        wholesale: item.wholesale / item.count,
        retail: item.retail / item.count,
        margin: (item.retail / item.count) - (item.wholesale / item.count),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result;
  }, [prices]);

  if (isLoading) {
    return <Card><CardContent className="h-64 flex items-center justify-center">Loading chart...</CardContent></Card>;
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No data available for the selected period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Trends</CardTitle>
        <CardDescription>
          {commodity ? `${commodity} prices` : "All commodities"} over the last {days} days
          {market && ` in ${market}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `KSh ${value.toFixed(0)}`} />
            <Tooltip
              formatter={(value: number) => formatKsh(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="wholesale"
              stroke="#8884d8"
              strokeWidth={2}
              name="Wholesale"
            />
            <Line
              type="monotone"
              dataKey="retail"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Retail"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Margin Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Price Margin (Retail - Wholesale)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `KSh ${value.toFixed(0)}`} />
              <Tooltip formatter={(value: number) => formatKsh(value)} />
              <Bar dataKey="margin" fill="#ffc658" name="Margin" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
