/**
 * Trade Finance Solutions Component (UI Mockup)
 * Letters of credit, payment guarantees, and export financing
 */

import { Banknote, Shield, FileText, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const financeOptions = [
  {
    id: 1,
    type: "Letter of Credit",
    provider: "KCB Bank",
    amount: 5000000,
    fee: 2.5,
    processingTime: "5-7 days",
    coverage: 100,
    rating: 4.8,
    features: ["Payment guarantee", "Buyer verification", "Document inspection"],
  },
  {
    id: 2,
    type: "Export Credit Insurance",
    provider: "APA Insurance",
    amount: 3000000,
    fee: 1.8,
    processingTime: "3-5 days",
    coverage: 90,
    rating: 4.6,
    features: ["Non-payment protection", "Political risk cover", "Currency risk"],
  },
  {
    id: 3,
    type: "Pre-Shipment Finance",
    provider: "Equity Bank",
    amount: 2000000,
    fee: 12.0,
    processingTime: "2-3 days",
    coverage: 80,
    rating: 4.7,
    features: ["Working capital", "Input financing", "Harvest advance"],
  },
];

const activeFinancing = [
  {
    id: "LC-2024-001",
    type: "Letter of Credit",
    buyer: "Fresh Imports Ltd (UK)",
    amount: 4500000,
    status: "active",
    issued: "2024-01-10",
    expiry: "2024-03-10",
    progress: 65,
    documentsSubmitted: 8,
    documentsRequired: 12,
  },
  {
    id: "ECI-2024-002",
    type: "Export Credit Insurance",
    buyer: "Al Baraka Trading (UAE)",
    amount: 2800000,
    status: "pending-docs",
    issued: "2024-01-15",
    expiry: "2024-04-15",
    progress: 40,
    documentsSubmitted: 5,
    documentsRequired: 10,
  },
];

const paymentTerms = [
  { term: "Advance Payment", security: "High", cost: "Low", timeline: "Immediate", recommended: true },
  { term: "Letter of Credit", security: "Very High", cost: "Medium", timeline: "5-7 days", recommended: true },
  { term: "Documentary Collection", security: "Medium", cost: "Low", timeline: "10-15 days", recommended: false },
  { term: "Open Account", security: "Low", cost: "Very Low", timeline: "30-90 days", recommended: false },
];

const financeStats = {
  totalFinanced: 12500000,
  activeContracts: 5,
  successRate: 96,
  avgProcessingTime: 4,
};

export function TradeFinanceSolutions() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Trade Finance Solutions
            </CardTitle>
            <CardDescription>
              Letters of credit, payment guarantees, and export financing
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Finance Stats */}
        <div className="bg-gradient-to-br from-success/10 to-primary/10 rounded-xl p-4 border border-success/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Financed</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(financeStats.totalFinanced)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active Contracts</p>
              <p className="text-xl font-bold text-foreground">{financeStats.activeContracts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
              <p className="text-xl font-bold text-success">{financeStats.successRate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Processing</p>
              <p className="text-xl font-bold text-foreground">{financeStats.avgProcessingTime} days</p>
            </div>
          </div>
        </div>

        {/* Finance Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Available Finance Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {financeOptions.map((option) => (
              <div
                key={option.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {option.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-foreground">{option.rating}</span>
                    <span className="text-xs text-warning">★</span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground mb-1">{option.provider}</p>
                <p className="text-xs text-muted-foreground mb-3">Up to {formatKsh(option.amount)}</p>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-semibold text-foreground">{option.fee}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="font-semibold text-foreground">{option.processingTime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-semibold text-success">{option.coverage}%</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-md p-2 mb-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Features:</p>
                  <ul className="space-y-1">
                    {option.features.map((feature) => (
                      <li key={feature} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button size="sm" className="w-full">
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Financing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Financing</h3>
          <div className="space-y-3">
            {activeFinancing.map((finance) => (
              <div
                key={finance.id}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{finance.id}</p>
                    <p className="text-xs text-muted-foreground">{finance.type}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      finance.status === "active"
                        ? "bg-success/10 text-success text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {finance.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {finance.status === "pending-docs" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {finance.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Buyer</span>
                    <span className="font-semibold text-foreground">{finance.buyer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">{formatKsh(finance.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expiry</span>
                    <span className="font-semibold text-foreground">{finance.expiry}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-semibold text-foreground">
                      {finance.documentsSubmitted} / {finance.documentsRequired}
                    </span>
                  </div>
                  <Progress value={finance.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Terms Comparison */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Payment Terms Comparison</h3>
          <div className="space-y-2">
            {paymentTerms.map((term) => (
              <div
                key={term.term}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{term.term}</p>
                      {term.recommended && (
                        <Badge variant="outline" className="bg-success/10 text-success text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Security: {term.security} • Cost: {term.cost} • Timeline: {term.timeline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Request Quote
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Compare Options
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Letters of Credit provide payment security for both buyer and seller. Fees typically range from 1.5-3% of transaction value. Processing time: 5-7 business days.
        </div>
      </CardContent>
    </Card>
  );
}
