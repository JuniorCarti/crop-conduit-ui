import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  currentMarketPrice?: number | null;
  crop?: string;
}

interface CostItem {
  label: string;
  amount: number;
}

const DEFAULT_COSTS: CostItem[] = [
  { label: "Seeds / Seedlings",  amount: 2500  },
  { label: "Fertilizer",         amount: 4000  },
  { label: "Pesticides",         amount: 1500  },
  { label: "Labour",             amount: 6000  },
  { label: "Transport",          amount: 1200  },
  { label: "Other",              amount: 800   },
];

export function BreakEvenCalculator({ currentMarketPrice, crop = "tomatoes" }: Props) {
  const [yieldKg, setYieldKg] = useState("500");
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const totalCost = costs.reduce((s, c) => s + c.amount, 0);
  const yieldNum = parseFloat(yieldKg) || 1;
  const breakEven = Math.ceil(totalCost / yieldNum);
  const marketPrice = currentMarketPrice ?? 45;
  const profitPerKg = marketPrice - breakEven;
  const totalProfit = profitPerKg * yieldNum;
  const margin = Math.round((profitPerKg / marketPrice) * 100);

  const profitStatus = profitPerKg > 0 ? "profit" : profitPerKg === 0 ? "breakeven" : "loss";

  const updateCost = (index: number, value: string) => {
    setCosts((prev) => prev.map((c, i) => i === index ? { ...c, amount: parseFloat(value) || 0 } : c));
  };

  const addCost = () => {
    if (!newLabel.trim() || !newAmount) return;
    setCosts((prev) => [...prev, { label: newLabel.trim(), amount: parseFloat(newAmount) || 0 }]);
    setNewLabel("");
    setNewAmount("");
  };

  const removeCost = (index: number) => {
    setCosts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Calculator className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Break-Even Calculator</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">{crop}</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Calculate the minimum price needed to cover your input costs
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Result banner */}
        <div className={cn(
          "rounded-xl border p-4 space-y-1",
          profitStatus === "profit"    ? "border-success/40 bg-success/5"     :
          profitStatus === "breakeven" ? "border-warning/40 bg-warning/5"     :
                                         "border-destructive/40 bg-destructive/5"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Break-even price</p>
              <p className="text-2xl font-bold text-foreground">KES {breakEven}/kg</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Market price</p>
              <p className="text-2xl font-bold text-foreground">KES {marketPrice}/kg</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {profitStatus === "profit" ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : profitStatus === "loss" ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-warning" />
            )}
            <span className={cn("text-sm font-semibold",
              profitStatus === "profit" ? "text-success" : profitStatus === "loss" ? "text-destructive" : "text-warning"
            )}>
              {profitStatus === "profit"
                ? `KES ${profitPerKg.toFixed(0)}/kg profit · ${margin}% margin · Total KES ${totalProfit.toLocaleString()}`
                : profitStatus === "loss"
                ? `KES ${Math.abs(profitPerKg).toFixed(0)}/kg loss — price too low`
                : "At break-even — no profit or loss"}
            </span>
          </div>
        </div>

        {/* Expected yield */}
        <div className="space-y-1.5">
          <Label htmlFor="yield-kg" className="text-xs font-medium">Expected yield (kg)</Label>
          <Input
            id="yield-kg"
            type="number"
            value={yieldKg}
            onChange={(e) => setYieldKg(e.target.value)}
            className="h-8 text-sm"
            min="1"
          />
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input costs (KES)</p>
          {costs.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-foreground flex-1 truncate">{c.label}</span>
              <Input
                type="number"
                value={c.amount}
                onChange={(e) => updateCost(i, e.target.value)}
                className="h-7 w-28 text-xs text-right"
              />
              <button
                type="button"
                onClick={() => removeCost(i)}
                className="text-muted-foreground hover:text-destructive text-xs px-1"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add cost row */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Cost label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-7 w-28 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={addCost} className="h-7 text-xs px-2">
              Add
            </Button>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Total input cost</span>
          <span className="text-sm font-bold text-foreground">KES {totalCost.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
