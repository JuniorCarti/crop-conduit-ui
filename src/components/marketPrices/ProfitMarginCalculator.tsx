/**
 * Profit Margin Calculator Component
 * Calculate profit margins with input costs and break-even analysis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CostBreakdown {
  seeds: number;
  fertilizer: number;
  pesticides: number;
  labor: number;
  water: number;
  transport: number;
  other: number;
}

export function ProfitMarginCalculator() {
  const [commodity, setCommodity] = useState("Tomatoes");
  const [quantity, setQuantity] = useState("100");
  const [expectedPrice, setExpectedPrice] = useState("95");
  
  const [costs, setCosts] = useState<CostBreakdown>({
    seeds: 500,
    fertilizer: 1200,
    pesticides: 800,
    labor: 2000,
    water: 600,
    transport: 800,
    other: 300,
  });

  const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const totalRevenue = parseFloat(quantity) * parseFloat(expectedPrice);
  const grossProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const roi = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;
  const breakEvenPrice = parseFloat(quantity) > 0 ? totalCosts / parseFloat(quantity) : 0;
  const costPerKg = parseFloat(quantity) > 0 ? totalCosts / parseFloat(quantity) : 0;

  const updateCost = (key: keyof CostBreakdown, value: string) => {
    setCosts({ ...costs, [key]: parseFloat(value) || 0 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Profit Margin Calculator
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Calculate your expected profit and break-even price</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Commodity</Label>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                <SelectItem value="Onions">Onions</SelectItem>
                <SelectItem value="Irish Potato">Irish Potato</SelectItem>
                <SelectItem value="Kale">Kale</SelectItem>
                <SelectItem value="Cabbage">Cabbage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity (kg)</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Price (KSh/kg)</Label>
            <Input
              type="number"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              placeholder="95"
            />
          </div>
        </div>

        {/* Cost Inputs */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4">Input Costs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(costs).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => updateCost(key as keyof CostBreakdown, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Costs</span>
              <span className="text-2xl font-bold text-red-600">{formatKsh(totalCosts)}</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Expected Revenue</h4>
            </div>
            <p className="text-3xl font-bold text-blue-600">{formatKsh(totalRevenue)}</p>
            <p className="text-sm text-blue-700 mt-1">
              {quantity} kg × {formatKsh(parseFloat(expectedPrice))}
            </p>
          </div>

          {/* Gross Profit */}
          <div className={`border rounded-lg p-4 ${
            grossProfit >= 0 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-5 w-5 ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
              <h4 className={`font-semibold ${grossProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                Gross Profit
              </h4>
            </div>
            <p className={`text-3xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatKsh(grossProfit)}
            </p>
            <p className={`text-sm mt-1 ${grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
              Revenue - Total Costs
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Profit Margin</p>
            <p className={`text-2xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">ROI</p>
            <p className={`text-2xl font-bold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Break-Even Price</p>
            <p className="text-2xl font-bold text-orange-600">{formatKsh(breakEvenPrice)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Cost per Kg</p>
            <p className="text-2xl font-bold">{formatKsh(costPerKg)}</p>
          </div>
        </div>

        {/* Analysis */}
        <div className={`rounded-lg p-4 ${
          grossProfit >= totalCosts * 0.3 
            ? "bg-green-50 border border-green-200"
            : grossProfit >= 0
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}>
          <h4 className="font-semibold mb-2">📊 Analysis</h4>
          {grossProfit >= totalCosts * 0.3 ? (
            <p className="text-sm text-green-700">
              ✅ <strong>Excellent profit margin!</strong> Your ROI of {roi.toFixed(1)}% is above the 30% target.
              This is a profitable venture.
            </p>
          ) : grossProfit >= 0 ? (
            <p className="text-sm text-yellow-700">
              ⚠️ <strong>Moderate profit margin.</strong> Your ROI of {roi.toFixed(1)}% is positive but could be improved.
              Consider reducing costs or waiting for better prices.
            </p>
          ) : (
            <p className="text-sm text-red-700">
              ❌ <strong>Loss expected!</strong> Your costs exceed revenue. You need to sell at minimum{" "}
              {formatKsh(breakEvenPrice)}/kg to break even. Wait for better prices or reduce costs.
            </p>
          )}
        </div>

        {/* Break-Even Analysis */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Break-Even Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-semibold">{formatKsh(parseFloat(expectedPrice))}/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Break-Even Price:</span>
              <span className="font-semibold text-orange-600">{formatKsh(breakEvenPrice)}/kg</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Price Buffer:</span>
              <span className={`font-semibold ${
                parseFloat(expectedPrice) > breakEvenPrice ? "text-green-600" : "text-red-600"
              }`}>
                {formatKsh(parseFloat(expectedPrice) - breakEvenPrice)}/kg
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            Save Calculation
          </Button>
          <Button variant="outline" className="flex-1">
            Compare Scenarios
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">💡 Pro Tip</h4>
              <p className="text-sm text-blue-700">
                Aim for at least 30% ROI to account for risks and unexpected costs. Track your actual costs
                vs estimates to improve future calculations.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
