/**
 * Digital Wallet Integration Component (UI Mockup)
 * M-Pesa, bank integration, instant payments, and transaction history
 */

import { Wallet, ArrowUpRight, ArrowDownLeft, Smartphone, Building2, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/currency";

const walletBalance = {
  mpesa: 45230,
  bank: 128500,
  agrismart: 23400,
  total: 197130,
};

const recentTransactions = [
  {
    id: "TXN-001",
    type: "credit",
    method: "M-Pesa",
    description: "Payment from Naivas Supermarket",
    amount: 18500,
    date: "2024-01-20 14:32",
    status: "completed",
  },
  {
    id: "TXN-002",
    type: "debit",
    method: "AgriSmart Wallet",
    description: "Input purchase - Seeds & Fertilizer",
    amount: 12000,
    date: "2024-01-19 10:15",
    status: "completed",
  },
  {
    id: "TXN-003",
    type: "credit",
    method: "Bank Transfer",
    description: "Loan disbursement - KCB",
    amount: 50000,
    date: "2024-01-18 09:00",
    status: "completed",
  },
  {
    id: "TXN-004",
    type: "debit",
    method: "M-Pesa",
    description: "Transport payment - Logistics",
    amount: 3500,
    date: "2024-01-17 16:45",
    status: "completed",
  },
  {
    id: "TXN-005",
    type: "credit",
    method: "M-Pesa",
    description: "Marketplace sale - Tomatoes",
    amount: 8200,
    date: "2024-01-16 11:20",
    status: "pending",
  },
];

const linkedAccounts = [
  { name: "M-Pesa", number: "0712 345 678", balance: 45230, icon: Smartphone, color: "text-success" },
  { name: "KCB Bank", number: "1234567890", balance: 128500, icon: Building2, color: "text-primary" },
  { name: "AgriSmart Wallet", number: "ASW-789456", balance: 23400, icon: Wallet, color: "text-accent" },
];

const quickActions = [
  { label: "Send Money", icon: ArrowUpRight, color: "text-primary" },
  { label: "Request Payment", icon: ArrowDownLeft, color: "text-success" },
  { label: "Pay Invoice", icon: Zap, color: "text-warning" },
  { label: "Withdraw", icon: TrendingUp, color: "text-info" },
];

export function DigitalWalletIntegration() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Digital Wallet Integration
            </CardTitle>
            <CardDescription>
              M-Pesa, bank accounts, and instant payments
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-foreground">{formatKsh(walletBalance.total)}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-success/10 text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% this month
            </Badge>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Linked Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {linkedAccounts.map((account) => (
              <div
                key={account.name}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <account.icon className={`h-4 w-4 ${account.color}`} />
                  <p className="text-sm font-semibold text-foreground">{account.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{account.number}</p>
                <p className="text-lg font-bold text-foreground">{formatKsh(account.balance)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <div className="space-y-2">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      txn.type === "credit" ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {txn.type === "credit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {txn.method}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{txn.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      txn.type === "credit" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {txn.type === "credit" ? "+" : "-"}
                    {formatKsh(txn.amount)}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      txn.status === "completed"
                        ? "bg-success/10 text-success text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {txn.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Zap className="h-4 w-4 mr-2" />
            Send Payment
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View All Transactions
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Instant M-Pesa integration allows you to receive marketplace payments directly to your phone. Bank transfers typically take 1-2 business days.
        </div>
      </CardContent>
    </Card>
  );
}
