/**
 * Savings & Investment Pools Component (UI Mockup)
 * Group savings, cooperative investment, and financial goal tracking
 */

import { PiggyBank, Users, TrendingUp, Target, Award, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const savingsAccount = {
  balance: 245000,
  monthlyContribution: 15000,
  interestRate: 6.5,
  interestEarned: 8950,
  goalProgress: 68,
  goalAmount: 360000,
};

const savingsGoals = [
  {
    id: 1,
    name: "Greenhouse Construction",
    target: 500000,
    saved: 245000,
    deadline: "2024-06-30",
    monthlyTarget: 42500,
    status: "on-track",
  },
  {
    id: 2,
    name: "Tractor Down Payment",
    target: 800000,
    saved: 180000,
    deadline: "2024-12-31",
    monthlyTarget: 62000,
    status: "behind",
  },
  {
    id: 3,
    name: "Emergency Fund",
    target: 200000,
    saved: 200000,
    deadline: "2024-01-01",
    monthlyTarget: 0,
    status: "completed",
  },
];

const investmentPools = [
  {
    id: 1,
    name: "Nakuru Farmers Cooperative",
    members: 45,
    poolSize: 2500000,
    yourShare: 55000,
    returns: 12.5,
    term: "12 months",
    risk: "Low",
    nextPayout: "2024-03-15",
  },
  {
    id: 2,
    name: "Agri-Tech Investment Fund",
    members: 120,
    poolSize: 8500000,
    yourShare: 100000,
    returns: 18.2,
    term: "24 months",
    risk: "Medium",
    nextPayout: "2024-06-30",
  },
  {
    id: 3,
    name: "Export Market Pool",
    members: 28,
    poolSize: 1800000,
    yourShare: 65000,
    returns: 22.0,
    term: "18 months",
    risk: "High",
    nextPayout: "2024-09-15",
  },
];

const recentActivity = [
  { date: "2024-01-20", type: "deposit", amount: 15000, description: "Monthly contribution" },
  { date: "2024-01-15", type: "interest", amount: 1250, description: "Interest earned" },
  { date: "2024-01-10", type: "withdrawal", amount: 5000, description: "Emergency withdrawal" },
  { date: "2024-01-05", type: "dividend", amount: 8500, description: "Cooperative dividend" },
];

export function SavingsInvestmentPools() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Savings & Investment Pools
            </CardTitle>
            <CardDescription>
              Group savings, cooperative investment, and financial goals
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Savings Overview */}
        <div className="bg-gradient-to-br from-success/10 to-primary/10 rounded-xl p-4 border border-success/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <p className="text-3xl font-bold text-foreground">{formatKsh(savingsAccount.balance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Interest Earned</p>
              <p className="text-lg font-bold text-success">{formatKsh(savingsAccount.interestEarned)}</p>
              <p className="text-xs text-muted-foreground">{savingsAccount.interestRate}% p.a.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatKsh(savingsAccount.monthlyContribution)}/month
            </Badge>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Savings Goals</h3>
          <div className="space-y-2">
            {savingsGoals.map((goal) => (
              <div
                key={goal.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{goal.name}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      goal.status === "completed"
                        ? "bg-success/10 text-success text-xs"
                        : goal.status === "on-track"
                        ? "bg-primary/10 text-primary text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {goal.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {formatKsh(goal.saved)} / {formatKsh(goal.target)}
                    </span>
                  </div>
                  <Progress value={(goal.saved / goal.target) * 100} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Deadline: {goal.deadline}</span>
                    {goal.monthlyTarget > 0 && (
                      <span className="font-semibold text-foreground">
                        {formatKsh(goal.monthlyTarget)}/month needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Pools */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Investment Pools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {investmentPools.map((pool) => (
              <div
                key={pool.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={
                      pool.risk === "Low"
                        ? "bg-success/10 text-success text-xs"
                        : pool.risk === "Medium"
                        ? "bg-warning/10 text-warning text-xs"
                        : "bg-destructive/10 text-destructive text-xs"
                    }
                  >
                    {pool.risk} Risk
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{pool.members}</span>
                  </div>
                </div>
                <p className="font-semibold text-foreground text-sm mb-1">{pool.name}</p>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pool Size</span>
                    <span className="font-semibold text-foreground">{formatKsh(pool.poolSize)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Your Share</span>
                    <span className="font-semibold text-foreground">{formatKsh(pool.yourShare)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Returns</span>
                    <span className="font-semibold text-success">{pool.returns}% p.a.</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-semibold text-foreground">{pool.term}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground">
                  Next payout: {pool.nextPayout}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "deposit" || activity.type === "interest" || activity.type === "dividend"
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    {activity.type === "deposit" && <DollarSign className="h-3 w-3 text-success" />}
                    {activity.type === "interest" && <TrendingUp className="h-3 w-3 text-success" />}
                    {activity.type === "dividend" && <Award className="h-3 w-3 text-success" />}
                    {activity.type === "withdrawal" && <DollarSign className="h-3 w-3 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <p
                  className={`text-sm font-bold ${
                    activity.type === "withdrawal" ? "text-destructive" : "text-success"
                  }`}
                >
                  {activity.type === "withdrawal" ? "-" : "+"}
                  {formatKsh(activity.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <PiggyBank className="h-4 w-4 mr-2" />
            Make Deposit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Join Pool
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Group savings pools offer higher interest rates (6-8%) than traditional banks. Investment pools provide access to cooperative ventures with returns of 12-22% annually.
        </div>
      </CardContent>
    </Card>
  );
}
