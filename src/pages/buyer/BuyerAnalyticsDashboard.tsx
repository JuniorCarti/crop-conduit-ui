import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download, Filter } from "lucide-react";

export default function BuyerAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedCommodity, setSelectedCommodity] = useState("all");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procurement Analytics</h1>
          <p className="text-sm text-muted-foreground">Track spending, trends, and supplier performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Commodity</label>
              <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All commodities</SelectItem>
                  <SelectItem value="tomatoes">Tomatoes</SelectItem>
                  <SelectItem value="maize">Maize</SelectItem>
                  <SelectItem value="beans">Beans</SelectItem>
                  <SelectItem value="potatoes">Potatoes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total Spend</p>
            <p className="mt-2 text-3xl font-bold">KES 2.4M</p>
            <p className="mt-1 text-xs text-green-600">↑ 12% vs last period</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total Volume</p>
            <p className="mt-2 text-3xl font-bold">45,200 kg</p>
            <p className="mt-1 text-xs text-green-600">↑ 8% vs last period</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Avg Price/kg</p>
            <p className="mt-2 text-3xl font-bold">KES 53</p>
            <p className="mt-1 text-xs text-red-600">↑ 3% vs last period</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Active Suppliers</p>
            <p className="mt-2 text-3xl font-bold">24</p>
            <p className="mt-1 text-xs text-muted-foreground">+2 new this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spend by Commodity */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Spend by Commodity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Tomatoes", value: 45, amount: "KES 1.08M" },
                { name: "Maize", value: 25, amount: "KES 600K" },
                { name: "Beans", value: 18, amount: "KES 432K" },
                { name: "Potatoes", value: 12, amount: "KES 288K" },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Trends */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Price Trends (Tomatoes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                {[45, 48, 52, 50, 55, 58, 56, 53].map((price, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{ height: `${(price / 60) * 100}px` }}
                    />
                    <span className="text-xs text-muted-foreground">W{i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current: KES 53/kg</span>
                <span className="text-green-600">↑ 17.8% from start</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Performance */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Supplier Performance Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-2 text-left font-medium">Supplier</th>
                  <th className="px-4 py-2 text-left font-medium">On-Time %</th>
                  <th className="px-4 py-2 text-left font-medium">Quality Score</th>
                  <th className="px-4 py-2 text-left font-medium">Price Competitiveness</th>
                  <th className="px-4 py-2 text-left font-medium">Overall Score</th>
                  <th className="px-4 py-2 text-left font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Cooperative A", onTime: 95, quality: 92, price: 88, overall: 91 },
                  { name: "Cooperative B", onTime: 88, quality: 85, price: 92, overall: 88 },
                  { name: "Cooperative C", onTime: 92, quality: 88, price: 85, overall: 88 },
                  { name: "Supplier D", onTime: 78, quality: 80, price: 90, overall: 82 },
                ].map((supplier) => (
                  <tr key={supplier.name} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{supplier.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{supplier.onTime}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{supplier.quality}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{supplier.price}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-600">{supplier.overall}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600">↑</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ROI Analysis */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">ROI by Supplier Relationship</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { supplier: "Cooperative A", investment: "KES 450K", roi: 24, savings: "KES 108K" },
              { supplier: "Cooperative B", investment: "KES 380K", roi: 18, savings: "KES 68.4K" },
              { supplier: "Cooperative C", investment: "KES 320K", roi: 15, savings: "KES 48K" },
            ].map((item) => (
              <div key={item.supplier} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.supplier}</p>
                    <p className="text-sm text-muted-foreground">Investment: {item.investment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{item.roi}%</p>
                    <p className="text-sm text-muted-foreground">Savings: {item.savings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
