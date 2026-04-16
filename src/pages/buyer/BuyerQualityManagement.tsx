import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, TrendingUp, FileText, Plus } from "lucide-react";

export default function BuyerQualityManagement() {
  const [showNewNCR, setShowNewNCR] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Management</h1>
          <p className="text-sm text-muted-foreground">Track quality metrics, inspections, and defects</p>
        </div>
        <Button onClick={() => setShowNewNCR(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Report Defect
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Avg Quality Score</p>
            <p className="mt-2 text-3xl font-bold">87%</p>
            <p className="mt-1 text-xs text-green-600">↑ 2% vs last month</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Defect Rate</p>
            <p className="mt-2 text-3xl font-bold">3.2%</p>
            <p className="mt-1 text-xs text-green-600">↓ 0.5% vs last month</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Open NCRs</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">5</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Inspections This Month</p>
            <p className="mt-2 text-3xl font-bold">24</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scorecards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scorecards">Quality Scorecards</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">Defects & NCR</TabsTrigger>
          <TabsTrigger value="capa">CAPA</TabsTrigger>
        </TabsList>

        {/* Quality Scorecards */}
        <TabsContent value="scorecards" className="space-y-4">
          {[
            {
              supplier: "Cooperative A",
              score: 92,
              trend: "up",
              metrics: [
                { name: "Freshness", value: 95 },
                { name: "Size Uniformity", value: 90 },
                { name: "Color", value: 92 },
                { name: "Damage Rate", value: 88 },
              ],
            },
            {
              supplier: "Cooperative B",
              score: 85,
              trend: "stable",
              metrics: [
                { name: "Freshness", value: 88 },
                { name: "Size Uniformity", value: 82 },
                { name: "Color", value: 85 },
                { name: "Damage Rate", value: 85 },
              ],
            },
            {
              supplier: "Cooperative C",
              score: 78,
              trend: "down",
              metrics: [
                { name: "Freshness", value: 75 },
                { name: "Size Uniformity", value: 78 },
                { name: "Color", value: 80 },
                { name: "Damage Rate", value: 78 },
              ],
            },
          ].map((supplier) => (
            <Card key={supplier.supplier} className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{supplier.supplier}</p>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{supplier.score}%</p>
                      <Badge variant={supplier.trend === "up" ? "default" : supplier.trend === "down" ? "destructive" : "secondary"}>
                        {supplier.trend === "up" ? "↑ Improving" : supplier.trend === "down" ? "↓ Declining" : "→ Stable"}
                      </Badge>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    {supplier.metrics.map((metric) => (
                      <div key={metric.name} className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground">{metric.name}</p>
                        <p className="mt-1 text-lg font-semibold">{metric.value}%</p>
                        <div className="mt-2 h-1 w-full rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Inspections */}
        <TabsContent value="inspections" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: "INS-2024-001",
                    supplier: "Cooperative A",
                    commodity: "Tomatoes",
                    date: "Mar 21, 2024",
                    result: "passed",
                    score: 92,
                  },
                  {
                    id: "INS-2024-002",
                    supplier: "Cooperative B",
                    commodity: "Maize",
                    date: "Mar 20, 2024",
                    result: "passed",
                    score: 85,
                  },
                  {
                    id: "INS-2024-003",
                    supplier: "Cooperative C",
                    commodity: "Beans",
                    date: "Mar 19, 2024",
                    result: "failed",
                    score: 72,
                  },
                ].map((inspection) => (
                  <div key={inspection.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{inspection.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {inspection.supplier} • {inspection.commodity}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{inspection.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{inspection.score}%</p>
                        <Badge
                          variant={inspection.result === "passed" ? "default" : "destructive"}
                          className="mt-1"
                        >
                          {inspection.result === "passed" ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defects & NCR */}
        <TabsContent value="defects" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Non-Conformance Reports (NCR)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: "NCR-2024-001",
                    supplier: "Cooperative B",
                    issue: "Damaged packaging",
                    severity: "high",
                    status: "open",
                    date: "Mar 21, 2024",
                  },
                  {
                    id: "NCR-2024-002",
                    supplier: "Cooperative C",
                    issue: "Below standard size",
                    severity: "medium",
                    status: "open",
                    date: "Mar 20, 2024",
                  },
                  {
                    id: "NCR-2024-003",
                    supplier: "Cooperative A",
                    issue: "Delayed delivery",
                    severity: "low",
                    status: "resolved",
                    date: "Mar 15, 2024",
                  },
                ].map((ncr) => (
                  <div key={ncr.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{ncr.id}</p>
                        <p className="text-sm text-muted-foreground">{ncr.supplier}</p>
                        <p className="mt-1 text-sm">{ncr.issue}</p>
                        <p className="text-xs text-muted-foreground">{ncr.date}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant={
                            ncr.severity === "high"
                              ? "destructive"
                              : ncr.severity === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {ncr.severity === "high" ? "High" : ncr.severity === "medium" ? "Medium" : "Low"}
                        </Badge>
                        <Badge variant={ncr.status === "open" ? "secondary" : "default"}>
                          {ncr.status === "open" ? "Open" : "Resolved"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAPA */}
        <TabsContent value="capa" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Corrective & Preventive Actions (CAPA)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: "CAPA-2024-001",
                    ncr: "NCR-2024-001",
                    action: "Implement new packaging standards",
                    owner: "Cooperative B",
                    dueDate: "Apr 5, 2024",
                    status: "in_progress",
                    progress: 60,
                  },
                  {
                    id: "CAPA-2024-002",
                    ncr: "NCR-2024-002",
                    action: "Upgrade sorting equipment",
                    owner: "Cooperative C",
                    dueDate: "Apr 15, 2024",
                    status: "planned",
                    progress: 0,
                  },
                ].map((capa) => (
                  <div key={capa.id} className="rounded-lg border border-border/60 p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium">{capa.id}</p>
                        <p className="text-sm text-muted-foreground">{capa.action}</p>
                      </div>
                      <Badge variant={capa.status === "in_progress" ? "default" : "secondary"}>
                        {capa.status === "in_progress" ? "In Progress" : "Planned"}
                      </Badge>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Owner: {capa.owner}</span>
                      <span className="text-muted-foreground">Due: {capa.dueDate}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${capa.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
