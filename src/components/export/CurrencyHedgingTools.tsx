/**
 * Currency Hedging Tools Component (UI Mockup)
 * Exchange rate tracking, hedging strategies, and forex risk management
 */

import { DollarSign, TrendingUp, TrendingDown, Shield, AlertTriangle, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const exchangeRates = [
  { currency: "USD", rate: 150.25, change: -0.8, trend: "down", exposure: 450000 },
  { currency: "GBP", rate: 195.80, change: +1.2, trend: "up", exposure: 320000 },
  { currency: "EUR", rate: 165.40, change: +0.5, trend: "up", exposure: 280000 },
  { currency: "AED", rate: 40.90, change: -0.3, trend: "down", exposure: 180000 },
];

const hedgingPositions = [
  {
    id: "HEDGE-001",
    currency: "USD",
    type: "Forward Contract",
    amount: 50000,
    lockedRate: 148.50,
    currentRate: 150.25,
    maturity: "2024-03-15",
    status: "active",
    pnl: 87500,
  },
  {
    id: "HEDGE-002",
    currency: "GBP",
    type: "Currency Option",
    amount: 30000,
    lockedRate: 192.00,
    currentRate: 195.80,
    maturity: "2024-04-20",
    status: "active",
    pnl: 114000,
  },
  {
    id: "HEDGE-003",
    currency: "EUR",
    type: "Forward Contract",
    amount: 40000,
    lockedRate: 166.00,
    currentRate: 165.40,
    maturity: "2024-02-28",
    status: "expiring-soon",
    pnl: -24000,
  },
];

const riskMetrics = {
  totalExposure: 1230000,
  hedgedAmount: 780000,
  hedgeRatio: 63,
  potentialLoss: 98000,
  protectedValue: 680000,
};

const rateHistory = [
  { date: "Jan 15", usd: 149.5, gbp: 194.2, eur: 164.8 },
  { date: "Jan 16", usd: 150.0, gbp: 195.0, eur: 165.0 },
  { date: "Jan 17", usd: 149.8, gbp: 195.5, eur: 165.2 },
  { date: "Jan 18", usd: 150.5, gbp: 195.8, eur: 165.4 },
  { date: "Jan 19", usd: 150.25, gbp: 195.8, eur: 165.4 },
];

export function CurrencyHedgingTools() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Currency Hedging Tools
            </CardTitle>
            <CardDescription>
              Exchange rate tracking, hedging strategies, and forex risk management
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Overview */}
        <div className="bg-gradient-to-br from-primary/10 to-warning/10 rounded-xl p-4 border border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Exposure</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(riskMetrics.totalExposure)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hedged Amount</p>
              <p className="text-xl font-bold text-success">{formatKsh(riskMetrics.hedgedAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hedge Ratio</p>
              <p className="text-xl font-bold text-primary">{riskMetrics.hedgeRatio}%</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Protection Coverage</span>
              <span className="font-semibold">{riskMetrics.hedgeRatio}%</span>
            </div>
            <Progress value={riskMetrics.hedgeRatio} className="h-2" />
          </div>
        </div>

        {/* Live Exchange Rates */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Live Exchange Rates (KSh)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exchangeRates.map((rate) => (
              <div
                key={rate.currency}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{rate.currency}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      rate.trend === "up"
                        ? "bg-success/10 text-success text-xs"
                        : "bg-destructive/10 text-destructive text-xs"
                    }
                  >
                    {rate.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {rate.change > 0 ? "+" : ""}
                    {rate.change}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{rate.rate.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">per 1 {rate.currency}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Your Exposure</p>
                    <p className="text-sm font-semibold text-foreground">{formatKsh(rate.exposure)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Hedging Positions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Hedging Positions</h3>
          <div className="space-y-2">
            {hedgingPositions.map((position) => (
              <div
                key={position.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{position.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {position.type} • {position.currency}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      position.status === "active"
                        ? "bg-success/10 text-success text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {position.status === "expiring-soon" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {position.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-semibold text-foreground">
                      {position.currency} {position.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Locked Rate</p>
                    <p className="text-sm font-semibold text-foreground">{position.lockedRate}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Current Rate</p>
                    <p className="text-sm font-semibold text-foreground">{position.currentRate}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Maturity</p>
                    <p className="text-xs font-semibold text-foreground">{position.maturity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">P&L</p>
                    <p
                      className={`text-sm font-bold ${
                        position.pnl >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {position.pnl >= 0 ? "+" : ""}
                      {formatKsh(position.pnl)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate History Chart */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">5-Day Rate History</h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-end justify-between gap-2 h-32">
              {rateHistory.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full space-y-1">
                    <div
                      className="w-full bg-primary/20 rounded-t-md"
                      style={{ height: `${(point.usd / 155) * 100}%` }}
                    />
                    <div
                      className="w-full bg-success/20 rounded-t-md"
                      style={{ height: `${(point.gbp / 200) * 100}%` }}
                    />
                    <div
                      className="w-full bg-warning/20 rounded-t-md"
                      style={{ height: `${(point.eur / 170) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{point.date}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary/20 rounded" />
                <span className="text-muted-foreground">USD</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-success/20 rounded" />
                <span className="text-muted-foreground">GBP</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-warning/20 rounded" />
                <span className="text-muted-foreground">EUR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Create Hedge
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <LineChart className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Currency hedging protects your export earnings from exchange rate fluctuations. Forward contracts lock in rates for 30-180 days. Recommended hedge ratio: 60-80% of exposure.
        </div>
      </CardContent>
    </Card>
  );
}
