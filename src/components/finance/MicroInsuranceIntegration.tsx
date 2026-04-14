/**
 * Micro-Insurance Integration Component (UI Mockup)
 * Crop insurance, weather-indexed insurance, and claims management
 */

import { Shield, Cloud, Droplets, Wind, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const insurancePlans = [
  {
    id: 1,
    name: "Weather-Indexed Insurance",
    provider: "APA Insurance",
    coverage: 500000,
    premium: 15000,
    type: "weather",
    triggers: ["Drought", "Excess Rainfall", "Frost"],
    status: "active",
    claimsPaid: 2,
    totalPayout: 180000,
  },
  {
    id: 2,
    name: "Crop Yield Protection",
    provider: "Britam",
    coverage: 750000,
    premium: 22500,
    type: "yield",
    triggers: ["Pest Damage", "Disease", "Hail"],
    status: "active",
    claimsPaid: 0,
    totalPayout: 0,
  },
  {
    id: 3,
    name: "Multi-Peril Crop Insurance",
    provider: "ACRE Africa",
    coverage: 1000000,
    premium: 35000,
    type: "multi-peril",
    triggers: ["All Weather Events", "Pests", "Fire"],
    status: "pending",
    claimsPaid: 0,
    totalPayout: 0,
  },
];

const activeClaims = [
  {
    id: "CLM-2024-001",
    plan: "Weather-Indexed Insurance",
    trigger: "Drought - 45 days no rain",
    filedDate: "2024-01-15",
    status: "approved",
    amount: 120000,
    payoutDate: "2024-01-22",
  },
  {
    id: "CLM-2024-002",
    plan: "Weather-Indexed Insurance",
    trigger: "Excess Rainfall - 200mm in 3 days",
    filedDate: "2024-02-10",
    status: "processing",
    amount: 85000,
    payoutDate: null,
  },
];

const weatherTriggers = [
  { event: "Drought Risk", probability: 35, daysToTrigger: 12, insured: true },
  { event: "Heavy Rainfall", probability: 18, daysToTrigger: 5, insured: true },
  { event: "Frost Risk", probability: 8, daysToTrigger: 20, insured: false },
  { event: "Hail Storm", probability: 5, daysToTrigger: null, insured: true },
];

export function MicroInsuranceIntegration() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Micro-Insurance Integration
            </CardTitle>
            <CardDescription>
              Weather-indexed & crop insurance with automated claims
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Insurance Plans */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Insurance Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insurancePlans.map((plan) => (
              <div
                key={plan.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={
                      plan.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {plan.status}
                  </Badge>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.provider}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-semibold text-foreground">{formatKsh(plan.coverage)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Premium</span>
                    <span className="font-semibold text-foreground">{formatKsh(plan.premium)}/year</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Claims Paid</span>
                    <span className="font-semibold text-success">{plan.claimsPaid} ({formatKsh(plan.totalPayout)})</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {plan.triggers.slice(0, 2).map((trigger) => (
                    <Badge key={trigger} variant="secondary" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                  {plan.triggers.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{plan.triggers.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Trigger Monitoring */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Weather Trigger Monitoring
          </h3>
          <div className="space-y-2">
            {weatherTriggers.map((trigger) => (
              <div
                key={trigger.event}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{trigger.event}</p>
                    {trigger.insured ? (
                      <Badge variant="outline" className="bg-success/10 text-success text-xs">
                        Insured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                        Not Covered
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Probability</span>
                        <span className="font-semibold">{trigger.probability}%</span>
                      </div>
                      <Progress value={trigger.probability} className="h-1.5" />
                    </div>
                    {trigger.daysToTrigger && (
                      <div className="text-xs text-muted-foreground">
                        ~{trigger.daysToTrigger} days to trigger
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Claims */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Active Claims
          </h3>
          <div className="space-y-2">
            {activeClaims.map((claim) => (
              <div
                key={claim.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{claim.id}</p>
                  <Badge
                    variant="outline"
                    className={
                      claim.status === "approved"
                        ? "bg-success/10 text-success"
                        : claim.status === "processing"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {claim.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {claim.status === "processing" && <Clock className="h-3 w-3 mr-1" />}
                    {claim.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{claim.plan}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-warning" />
                  <span className="text-foreground">{claim.trigger}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Claim Amount</p>
                    <p className="text-lg font-bold text-foreground">{formatKsh(claim.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Filed</p>
                    <p className="text-xs font-semibold text-foreground">{claim.filedDate}</p>
                  </div>
                </div>
                {claim.payoutDate && (
                  <div className="mt-2 bg-success/10 rounded-md p-2 text-xs text-success">
                    ✓ Paid out on {claim.payoutDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Get New Quote
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            File Claim
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Weather-indexed insurance uses satellite data to automatically trigger payouts when conditions match policy terms. No manual claims needed for weather events.
        </div>
      </CardContent>
    </Card>
  );
}
