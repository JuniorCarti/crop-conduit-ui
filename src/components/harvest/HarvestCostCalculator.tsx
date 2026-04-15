import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import type { HarvestSchedule } from "@/types/harvest";

interface CostItem {
  id: string;
  label: string;
  amount: number;
  category: "labour" | "transport" | "packaging" | "inputs" | "other";
}

const CATEGORY_COLOR: Record<CostItem["category"], string> = {
  labour:    "bg-primary/10 text-primary",
  transport: "bg-warning/10 text-warning",
  packaging: "bg-info/10 text-info",
  inputs:    "bg-success/10 text-success",
  other:     "bg-muted/60 text-muted-foreground",
};

const DEFAULT_COSTS: CostItem[] = [
  { id: "1", label: "Harvest labour (10 workers × 2 days)", amount: 8000,  category: "labour"    },
  { id: "2", label: "Supervisor",                           amount: 2000,  category: "labour"    },
  { id: "3", label: "Transport to market",                  amount: 3500,  category: "transport" },
  { id: "4", label: "Packaging (crates + bags)",            amount: 1200,  category: "packaging" },
  { id: "5", label: "Pesticide (pre-harvest)",              amount: 800,   category: "inputs"    },
];

export function HarvestCostCalculator({ schedule }: { schedule: HarvestSchedule | null }) {
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [revenue, setRevenue] = useState("27500");
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<CostItem["category"]>("other");

  const totalCost = costs.reduce((s, c) => s + c.amount, 0);
  const revenueNum = parseFloat(revenue) || 0;
  const profit = revenueNum - totalCost;
  const margin = revenueNum > 0 ? Math.round((profit / revenueNum) * 100) : 0;
  const costPerKg = schedule?.expectedYield && schedule.expectedYield > 0
    ? Math.round((totalCost / schedule.expectedYield) * 10) / 10
    : null;
  const revenuePerKg = schedule?.expectedYield && schedule.expectedYield > 0
    ? Math.round((revenueNum / schedule.expectedYield) * 10) / 10
    : null;

  const profitStatus = profit > 0 ? "profit" : profit === 0 ? "breakeven" : "loss";

  const addCost = () => {
    if (!newLabel.trim() || !newAmount) return;
    setCosts((p) => [...p, { id: `c${Date.now()}`, label: newLabel.trim(), amount: parseFloat(newAmount) || 0, category: newCategory }]);
    setNewLabel(""); setNewAmount("");
  };

  const byCat = (["labour","transport","packaging","inputs","other"] as CostItem["category"][]).map((cat) => ({
    cat,
    total: costs.filter((c) => c.category === cat).reduce((s, c) => s + c.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Calculator className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Harvest Cost Calculator</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs",
              profitStatus === "profit" ? "bg-success/10 text-success border-success/30" :
              profitStatus === "loss"   ? "bg-destructive/10 text-destructive border-destructive/30" :
              "bg-muted/60 text-muted-foreground border-border"
            )}>
              {profitStatus === "profit" ? `+${margin}% margin` : profitStatus === "loss" ? "Loss" : "Break-even"}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule ? `${schedule.cropName} — ${schedule.field} (${schedule.expectedYield} ${schedule.yieldUnit})` : "Labour + transport + packaging vs revenue"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* P&L summary */}
        <div className={cn("rounded-xl border p-4 space-y-3",
          profitStatus === "profit" ? "border-success/40 bg-success/5" :
          profitStatus === "loss"   ? "border-destructive/40 bg-destructive/5" :
          "border-border/60 bg-muted/20"
        )}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Total revenue</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(revenueNum)}</p>
              {revenuePerKg && <p className="text-[10px] text-muted-foreground">{formatKsh(revenuePerKg)}/kg</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total cost</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(totalCost)}</p>
              {costPerKg && <p className="text-[10px] text-muted-foreground">{formatKsh(costPerKg)}/kg</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border/40 pt-3">
            {profit >= 0
              ? <TrendingUp className="h-4 w-4 text-success" />
              : <TrendingDown className="h-4 w-4 text-destructive" />
            }
            <span className={cn("text-base font-bold",
              profit > 0 ? "text-success" : profit < 0 ? "text-destructive" : "text-foreground"
            )}>
              {profit >= 0 ? "+" : ""}{formatKsh(profit)} net {profitStatus}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{margin}% margin</span>
          </div>
        </div>

        {/* Revenue input */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Total revenue (KES)</Label>
          <Input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="h-8 text-sm"
            placeholder="Enter actual or expected revenue"
          />
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost breakdown</p>
            <p className="text-xs font-semibold text-foreground">{formatKsh(totalCost)} total</p>
          </div>

          {/* Category bars */}
          {byCat.length > 0 && (
            <div className="space-y-1.5">
              {byCat.map((c) => (
                <div key={c.cat} className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 capitalize shrink-0 w-20 text-center", CATEGORY_COLOR[c.cat])}>
                    {c.cat}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min((c.total / totalCost) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">{formatKsh(c.total)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Line items */}
          {costs.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className={cn("text-[9px] rounded-full px-1.5 py-0.5 capitalize shrink-0", CATEGORY_COLOR[c.category])}>{c.category}</span>
              <span className="text-xs text-foreground flex-1 truncate">{c.label}</span>
              <Input
                type="number"
                value={c.amount}
                onChange={(e) => setCosts((p) => p.map((x) => x.id === c.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))}
                className="h-7 w-24 text-xs text-right"
              />
              <button type="button" onClick={() => setCosts((p) => p.filter((x) => x.id !== c.id))} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add cost */}
          <div className="flex items-center gap-2 pt-1">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CostItem["category"])}
              className="h-7 rounded-lg border border-input bg-background px-2 text-xs shrink-0"
            >
              {(["labour","transport","packaging","inputs","other"] as CostItem["category"][]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input placeholder="Cost label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-7 text-xs flex-1" />
            <Input type="number" placeholder="KES" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="h-7 w-20 text-xs" />
            <Button type="button" size="sm" variant="outline" onClick={addCost} className="h-7 text-xs px-2 shrink-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
