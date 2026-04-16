import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function BuyerSupplierRelationshipManagement() {
  const [searchSupplier, setSearchSupplier] = useState("");
  const [filterSegment, setFilterSegment] = useState("all");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Supplier Relationship Management</h1>
        <p className="text-sm text-muted-foreground">Manage suppliers, track performance, and collaborate</p>
      </div>

      {/* Search & Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block text-sm font-medium">Search Supplier</Label>
              <Input
                placeholder="Supplier name or cooperative"
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Segment</Label>
              <Select value={filterSegment} onValueChange={setFilterSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="preferred">Preferred</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scorecards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scorecards">Performance Scorecards</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        {/* Performance Scorecards */}
        <TabsContent value="scorecards" className="space-y-4">
          {[
            {
              name: "Cooperative A",
              segment: "Strategic",
              onTime: 95,
              quality: 92,
              price: 88,
              responsiveness: 90,
              overall: 91,
              trend: "up",
            },
            {
              name: "Cooperative B",
              segment: "Preferred",
              onTime: 88,
              quality: 85,
              price: 92,
              responsiveness: 87,
              overall: 88,
              trend: "stable",
            },
            {
              name: "Supplier C",
              segment: "Transactional",
              onTime: 78,
              quality: 80,
              price: 90,
              responsiveness: 75,
              overall: 80,
              trend: "down",
            },
          ].map((supplier) => (
            <Card key={supplier.name} className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {supplier.segment}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{supplier.overall}%</p>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      { label: "On-Time", value: supplier.onTime },
                      { label: "Quality", value: supplier.quality },
                      { label: "Price", value: supplier.price },
                      { label: "Responsiveness", value: supplier.responsiveness },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Schedule Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Collaboration */}
        <TabsContent value="collaboration" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supplier Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    supplier: "Cooperative A",
                    lastMessage: "Confirmed delivery for next week",
                    time: "2 hours ago",
                    unread: false,
                  },
                  {
                    supplier: "Cooperative B",
                    lastMessage: "Price quote for bulk order",
                    time: "1 day ago",
                    unread: true,
                  },
                  {
                    supplier: "Supplier C",
                    lastMessage: "Quality inspection scheduled",
                    time: "3 days ago",
                    unread: false,
                  },
                ].map((msg) => (
                  <div
                    key={msg.supplier}
                    className={`rounded-lg border border-border/60 p-3 ${msg.unread ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{msg.supplier}</p>
                        <p className="text-sm text-muted-foreground">{msg.lastMessage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{msg.time}</p>
                        {msg.unread && <Badge className="mt-1">New</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Collaborative Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    supplier: "Cooperative A",
                    crop: "Tomatoes",
                    forecast: "5,000 kg",
                    status: "confirmed",
                  },
                  {
                    supplier: "Cooperative B",
                    crop: "Maize",
                    forecast: "8,000 kg",
                    status: "pending",
                  },
                ].map((item) => (
                  <div key={`${item.supplier}-${item.crop}`} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.supplier}</p>
                        <p className="text-sm text-muted-foreground">{item.crop}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.forecast}</p>
                        <Badge variant={item.status === "confirmed" ? "default" : "secondary"}>
                          {item.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supplier Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "New Cooperative D",
                    status: "in_progress",
                    steps: [
                      { name: "Basic Info", completed: true },
                      { name: "Document Verification", completed: true },
                      { name: "Compliance Check", completed: false },
                      { name: "Financial Assessment", completed: false },
                    ],
                  },
                  {
                    name: "Supplier E",
                    status: "completed",
                    steps: [
                      { name: "Basic Info", completed: true },
                      { name: "Document Verification", completed: true },
                      { name: "Compliance Check", completed: true },
                      { name: "Financial Assessment", completed: true },
                    ],
                  },
                ].map((supplier) => (
                  <div key={supplier.name} className="rounded-lg border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium">{supplier.name}</p>
                      <Badge variant={supplier.status === "completed" ? "default" : "secondary"}>
                        {supplier.status === "completed" ? "Approved" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {supplier.steps.map((step) => (
                        <div key={step.name} className="flex items-center gap-2">
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={step.completed ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                            {step.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development */}
        <TabsContent value="development" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Supplier Development Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    program: "Quality Improvement Initiative",
                    supplier: "Cooperative B",
                    status: "active",
                    progress: 65,
                    goal: "Improve quality score from 85% to 92%",
                  },
                  {
                    program: "Capacity Building",
                    supplier: "Cooperative C",
                    status: "active",
                    progress: 40,
                    goal: "Increase production capacity by 30%",
                  },
                  {
                    program: "Technology Adoption",
                    supplier: "Supplier D",
                    status: "planned",
                    progress: 0,
                    goal: "Implement digital ordering system",
                  },
                ].map((program) => (
                  <div key={program.program} className="rounded-lg border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{program.program}</p>
                        <p className="text-sm text-muted-foreground">{program.supplier}</p>
                      </div>
                      <Badge variant={program.status === "active" ? "default" : "secondary"}>
                        {program.status === "active" ? "Active" : "Planned"}
                      </Badge>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">{program.goal}</p>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${program.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{program.progress}% complete</p>
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
