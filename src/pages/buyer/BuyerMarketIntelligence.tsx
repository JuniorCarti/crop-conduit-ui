import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertCircle, Bell, Eye } from "lucide-react";

export default function BuyerMarketIntelligence() {
  const [selectedCrop, setSelectedCrop] = useState("tomatoes");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="text-sm text-muted-foreground">Monitor prices, analyze trends, and track supplier intelligence</p>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block text-sm font-medium">Commodity</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tomatoes">Tomatoes</SelectItem>
                  <SelectItem value="maize">Maize</SelectItem>
                  <SelectItem value="beans">Beans</SelectItem>
                  <SelectItem value="potatoes">Potatoes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Market</Label>
              <Select defaultValue="nairobi">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nairobi">Nairobi</SelectItem>
                  <SelectItem value="mombasa">Mombasa</SelectItem>
                  <SelectItem value="kisumu">Kisumu</SelectItem>
                  <SelectItem value="nakuru">Nakuru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Analyze</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">Price Monitoring</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
          <TabsTrigger value="supplier">Supplier Intelligence</TabsTrigger>
        </TabsList>

        {/* Price Monitoring */}
        <TabsContent value="prices" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase text-muted-foreground">Current Price</p>
                <p className="mt-2 text-3xl font-bold">KES 53/kg</p>
                <p className="mt-1 text-xs text-green-600">↑ 5% from last week</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase text-muted-foreground">30-Day Range</p>
                <p className="mt-2 text-lg font-bold">KES 48-58/kg</p>
                <p className="mt-1 text-xs text-muted-foreground">Volatility: Medium</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase text-muted-foreground">Forecast (7d)</p>
                <p className="mt-2 text-lg font-bold">KES 55/kg</p>
                <p className="mt-1 text-xs text-green-600">Expected increase</p>
              </CardContent>
            </Card>
          </div>

          {/* Price History Chart */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Price History - Tomatoes (Nairobi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  {[
                    { week: "W1", price: 45, avg: 48 },
                    { week: "W2", price: 48, avg: 48 },
                    { week: "W3", price: 50, avg: 48 },
                    { week: "W4", price: 53, avg: 48 },
                  ].map((item) => (
                    <div key={item.week} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-3 rounded-t bg-primary"
                          style={{ height: `${(item.price / 60) * 100}px` }}
                        />
                        <div
                          className="w-3 rounded-t bg-muted"
                          style={{ height: `${(item.avg / 60) * 100}px` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{item.week}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-primary" />
                    <span>Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted" />
                    <span>30-Day Avg</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Alerts */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Active Price Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    commodity: "Tomatoes",
                    trigger: "Price up 10%",
                    threshold: "KES 58/kg",
                    status: "active",
                  },
                  {
                    commodity: "Maize",
                    trigger: "Price down 5%",
                    threshold: "KES 38/kg",
                    status: "active",
                  },
                  {
                    commodity: "Beans",
                    trigger: "Price up 15%",
                    threshold: "KES 95/kg",
                    status: "triggered",
                  },
                ].map((alert) => (
                  <div key={alert.commodity} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.commodity}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.trigger} • Threshold: {alert.threshold}
                        </p>
                      </div>
                      <Badge variant={alert.status === "triggered" ? "destructive" : "default"}>
                        {alert.status === "triggered" ? "Triggered!" : "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Seasonal Price Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    season: "Peak Season (Apr-Jun)",
                    avgPrice: "KES 45/kg",
                    trend: "down",
                    reason: "High supply, prices drop",
                  },
                  {
                    season: "Off-Season (Jul-Sep)",
                    avgPrice: "KES 65/kg",
                    trend: "up",
                    reason: "Low supply, prices rise",
                  },
                  {
                    season: "Transition (Oct-Dec)",
                    avgPrice: "KES 55/kg",
                    trend: "stable",
                    reason: "Moderate supply and demand",
                  },
                ].map((item) => (
                  <div key={item.season} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.season}</p>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.avgPrice}</p>
                        <Badge variant="outline">
                          {item.trend === "down" ? "↓" : item.trend === "up" ? "↑" : "→"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supply/Demand Analysis */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supply & Demand Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { metric: "Current Supply Level", value: "High", indicator: "↑" },
                  { metric: "Current Demand Level", value: "Medium", indicator: "→" },
                  { metric: "Market Sentiment", value: "Bearish", indicator: "↓" },
                  { metric: "Price Forecast (30d)", value: "Downward", indicator: "↓" },
                ].map((item) => (
                  <div key={item.metric} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <p className="font-medium">{item.metric}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.value}</Badge>
                      <span className="text-lg">{item.indicator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarking */}
        <TabsContent value="benchmarking" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Price Benchmarking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    supplier: "Cooperative A",
                    price: "KES 52/kg",
                    vs_market: "-2%",
                    status: "competitive",
                  },
                  {
                    supplier: "Cooperative B",
                    price: "KES 54/kg",
                    vs_market: "+2%",
                    status: "above_market",
                  },
                  {
                    supplier: "Cooperative C",
                    price: "KES 51/kg",
                    vs_market: "-4%",
                    status: "best_price",
                  },
                  {
                    supplier: "Market Average",
                    price: "KES 53/kg",
                    vs_market: "0%",
                    status: "average",
                  },
                ].map((item) => (
                  <div key={item.supplier} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.supplier}</p>
                        <p className="text-lg font-semibold text-primary">{item.price}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            item.status === "best_price"
                              ? "default"
                              : item.status === "above_market"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {item.vs_market}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Negotiation Recommendations */}
          <Card className="border-border/60 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Negotiation Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Cooperative B is 2% above market - negotiate for better pricing",
                  "Cooperative C offers best price - consider increasing order volume",
                  "Market prices trending down - wait 1-2 weeks before placing large orders",
                  "Peak season approaching - lock in prices now for Q2 supply",
                ].map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Intelligence */}
        <TabsContent value="supplier" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supplier Capacity Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    supplier: "Cooperative A",
                    capacity: "5,000 kg/week",
                    utilization: 85,
                    status: "high_demand",
                  },
                  {
                    supplier: "Cooperative B",
                    capacity: "8,000 kg/week",
                    utilization: 60,
                    status: "available",
                  },
                  {
                    supplier: "Cooperative C",
                    capacity: "3,000 kg/week",
                    utilization: 95,
                    status: "at_capacity",
                  },
                ].map((item) => (
                  <div key={item.supplier} className="rounded-lg border border-border/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{item.supplier}</p>
                      <Badge
                        variant={
                          item.status === "at_capacity"
                            ? "destructive"
                            : item.status === "high_demand"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {item.status === "at_capacity"
                          ? "At Capacity"
                          : item.status === "high_demand"
                            ? "High Demand"
                            : "Available"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.capacity}</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.utilization}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.utilization}% utilized</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Financial Health */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supplier Financial Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    supplier: "Cooperative A",
                    health: "Strong",
                    rating: "A",
                    risk: "Low",
                  },
                  {
                    supplier: "Cooperative B",
                    health: "Stable",
                    rating: "B+",
                    risk: "Medium",
                  },
                  {
                    supplier: "Cooperative C",
                    health: "Concerning",
                    rating: "B",
                    risk: "High",
                  },
                ].map((item) => (
                  <div key={item.supplier} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.supplier}</p>
                        <p className="text-sm text-muted-foreground">{item.health}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{item.rating}</Badge>
                        <Badge
                          variant={
                            item.risk === "Low"
                              ? "default"
                              : item.risk === "Medium"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.risk} Risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Suppliers */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Alternative Supplier Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    supplier: "New Cooperative D",
                    commodity: "Tomatoes",
                    price: "KES 50/kg",
                    capacity: "4,000 kg/week",
                    reason: "Better price, good capacity",
                  },
                  {
                    supplier: "Supplier E",
                    commodity: "Maize",
                    price: "KES 40/kg",
                    capacity: "6,000 kg/week",
                    reason: "Dual-sourcing for risk mitigation",
                  },
                ].map((item) => (
                  <div key={item.supplier} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.supplier}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.commodity} • {item.price} • {item.capacity}
                        </p>
                        <p className="mt-1 text-xs text-green-600">{item.reason}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Explore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
