import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";

export default function BuyerDemandPlanning() {
  const [selectedCrop, setSelectedCrop] = useState("tomatoes");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Demand Planning</h1>
        <p className="text-sm text-muted-foreground">Forecast demand and optimize inventory levels</p>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block text-sm font-medium">Crop</Label>
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
              <Label className="mb-2 block text-sm font-medium">Forecast Period</Label>
              <Select defaultValue="3m">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Month</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Generate Forecast</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Forecasted Demand</p>
            <p className="mt-2 text-3xl font-bold">12,500 kg</p>
            <p className="mt-1 text-xs text-muted-foreground">Next 3 months</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Recommended Order</p>
            <p className="mt-2 text-3xl font-bold">4,200 kg</p>
            <p className="mt-1 text-xs text-green-600">Optimized for cost</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Lead Time</p>
            <p className="mt-2 text-3xl font-bold">14 days</p>
            <p className="mt-1 text-xs text-muted-foreground">Avg from suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Demand Forecast Chart */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Demand Forecast - Tomatoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Chart placeholder */}
            <div className="flex items-end gap-2">
              {[
                { month: "Apr", forecast: 4200, actual: 3800 },
                { month: "May", forecast: 4500, actual: 4100 },
                { month: "Jun", forecast: 4800, actual: null },
                { month: "Jul", forecast: 5200, actual: null },
              ].map((item) => (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-3 rounded-t bg-primary"
                      style={{ height: `${(item.forecast / 60) * 100}px` }}
                    />
                    {item.actual && (
                      <div
                        className="w-3 rounded-t bg-muted"
                        style={{ height: `${(item.actual / 60) * 100}px` }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span>Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-muted" />
                <span>Actual</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Optimization */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Inventory Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                metric: "Safety Stock Level",
                current: "800 kg",
                recommended: "1,200 kg",
                status: "low",
              },
              {
                metric: "Reorder Point",
                current: "2,000 kg",
                recommended: "2,500 kg",
                status: "optimal",
              },
              {
                metric: "Economic Order Quantity",
                current: "3,500 kg",
                recommended: "4,200 kg",
                status: "low",
              },
            ].map((item) => (
              <div key={item.metric} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.metric}</p>
                    <p className="text-sm text-muted-foreground">Current: {item.current}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{item.recommended}</p>
                    <Badge variant={item.status === "optimal" ? "default" : "secondary"}>
                      {item.status === "optimal" ? "Optimal" : "Adjust"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Planning */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Seasonal Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { season: "Peak Season (Apr-Jun)", demand: "High", recommendation: "Increase orders by 30%" },
              { season: "Off-Season (Jul-Sep)", demand: "Low", recommendation: "Reduce orders by 20%" },
              { season: "Transition (Oct-Dec)", demand: "Medium", recommendation: "Maintain current levels" },
            ].map((item) => (
              <div key={item.season} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.season}</p>
                    <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                  </div>
                  <Badge variant="outline">{item.demand}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/60 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Increase tomato orders by 15% for peak season (Apr-Jun)",
              "Negotiate volume discounts with Cooperative A for Q2",
              "Consider dual-sourcing for beans to reduce lead time risk",
              "Implement just-in-time ordering for potatoes to reduce storage costs",
            ].map((rec, i) => (
              <div key={i} className="flex gap-3">
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
