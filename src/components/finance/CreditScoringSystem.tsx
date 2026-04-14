/**
 * Credit Scoring System Component (UI Mockup)
 * Farmer credit profiles, lending recommendations, and creditworthiness tracking
 */

import { TrendingUp, Award, AlertTriangle, CheckCircle2, BarChart3, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const creditProfile = {
  score: 742,
  rating: "Good",
  maxLoanAmount: 850000,
  interestRate: 9.5,
  lastUpdated: "2024-01-20",
};

const scoreFactors = [
  { factor: "Payment History", score: 85, weight: 35, status: "good" },
  { factor: "Farm Revenue", score: 78, weight: 25, status: "good" },
  { factor: "Debt-to-Income Ratio", score: 92, weight: 20, status: "excellent" },
  { factor: "Farm Age & Stability", score: 65, weight: 10, status: "fair" },
  { factor: "Crop Diversity", score: 70, weight: 10, status: "good" },
];

const creditHistory = [
  { month: "Jan 2024", score: 742, change: +12 },
  { month: "Dec 2023", score: 730, change: +8 },
  { month: "Nov 2023", score: 722, change: -5 },
  { month: "Oct 2023", score: 727, change: +15 },
  { month: "Sep 2023", score: 712, change: +10 },
];

const lendingRecommendations = [
  {
    lender: "KCB Bank",
    maxAmount: 850000,
    interestRate: 9.5,
    term: "12-36 months",
    approval: 92,
    reason: "Strong payment history",
  },
  {
    lender: "Equity Bank",
    maxAmount: 750000,
    interestRate: 10.2,
    term: "6-24 months",
    approval: 85,
    reason: "Good revenue track record",
  },
  {
    lender: "ACRE Africa",
    maxAmount: 500000,
    interestRate: 8.5,
    term: "12-18 months",
    approval: 95,
    reason: "Agricultural specialist",
  },
];

const improvementTips = [
  { tip: "Maintain on-time payments", impact: "High", icon: CheckCircle2, color: "text-success" },
  { tip: "Diversify crop portfolio", impact: "Medium", icon: TrendingUp, color: "text-primary" },
  { tip: "Reduce existing debt", impact: "High", icon: AlertTriangle, color: "text-warning" },
  { tip: "Increase farm revenue", impact: "Medium", icon: BarChart3, color: "text-info" },
];

export function CreditScoringSystem() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Credit Scoring System
            </CardTitle>
            <CardDescription>
              Your creditworthiness profile and lending recommendations
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Score Overview */}
        <div className="bg-gradient-to-br from-primary/10 to-success/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Your Credit Score</p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold text-foreground">{creditProfile.score}</p>
                <Badge variant="outline" className="bg-success/10 text-success">
                  {creditProfile.rating}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Max Loan Amount</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(creditProfile.maxLoanAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">@ {creditProfile.interestRate}% interest</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={(creditProfile.score / 850) * 100} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground">850</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Last updated: {creditProfile.lastUpdated}</p>
        </div>

        {/* Score Factors Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Score Factors</h3>
          <div className="space-y-2">
            {scoreFactors.map((factor) => (
              <div key={factor.factor} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{factor.factor}</p>
                    <Badge
                      variant="outline"
                      className={
                        factor.status === "excellent"
                          ? "bg-success/10 text-success text-xs"
                          : factor.status === "good"
                          ? "bg-primary/10 text-primary text-xs"
                          : "bg-warning/10 text-warning text-xs"
                      }
                    >
                      {factor.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{factor.score}/100</p>
                    <p className="text-xs text-muted-foreground">{factor.weight}% weight</p>
                  </div>
                </div>
                <Progress value={factor.score} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Credit History Trend */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Credit History (Last 5 Months)</h3>
          <div className="space-y-2">
            {creditHistory.map((entry) => (
              <div
                key={entry.month}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-2"
              >
                <p className="text-sm text-foreground">{entry.month}</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-foreground">{entry.score}</p>
                  <Badge
                    variant="outline"
                    className={
                      entry.change > 0
                        ? "bg-success/10 text-success text-xs"
                        : "bg-destructive/10 text-destructive text-xs"
                    }
                  >
                    {entry.change > 0 ? "+" : ""}
                    {entry.change}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lending Recommendations */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Lending Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lendingRecommendations.map((rec) => (
              <div
                key={rec.lender}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{rec.lender}</p>
                  <Badge variant="outline" className="bg-success/10 text-success text-xs">
                    {rec.approval}% approval
                  </Badge>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Max Amount</span>
                    <span className="font-semibold text-foreground">{formatKsh(rec.maxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Interest Rate</span>
                    <span className="font-semibold text-foreground">{rec.interestRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-semibold text-foreground">{rec.term}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground mb-2">
                  ✓ {rec.reason}
                </div>
                <Button size="sm" className="w-full">
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">How to Improve Your Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {improvementTips.map((tip) => (
              <div
                key={tip.tip}
                className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
              >
                <tip.icon className={`h-5 w-5 ${tip.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{tip.tip}</p>
                  <p className="text-xs text-muted-foreground">Impact: {tip.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Request Credit Report
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Full Analysis
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Your credit score is calculated using farm revenue, payment history, debt levels, and operational stability. Scores update monthly.
        </div>
      </CardContent>
    </Card>
  );
}
