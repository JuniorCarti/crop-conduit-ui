import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Download, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function BuyerFinancialManagement() {
  const [filterStatus, setFilterStatus] = useState("all");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <p className="text-sm text-muted-foreground">Manage billing, invoices, payments, and financial analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total Spend YTD</p>
            <p className="mt-2 text-3xl font-bold">KES 8.4M</p>
            <p className="mt-1 text-xs text-green-600">↑ 15% vs last year</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Outstanding Balance</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">KES 450K</p>
            <p className="mt-1 text-xs text-muted-foreground">Due in 15 days</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Avg Payment Days</p>
            <p className="mt-2 text-3xl font-bold">8 days</p>
            <p className="mt-1 text-xs text-green-600">↓ 2 days vs avg</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Early Payment Savings</p>
            <p className="mt-2 text-3xl font-bold">KES 125K</p>
            <p className="mt-1 text-xs text-green-600">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 text-left font-medium">Invoice #</th>
                      <th className="px-4 py-2 text-left font-medium">Supplier</th>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Amount</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Due Date</th>
                      <th className="px-4 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "INV-2024-001",
                        supplier: "Cooperative A",
                        date: "Mar 20, 2024",
                        amount: "KES 106K",
                        status: "paid",
                        dueDate: "Apr 5, 2024",
                      },
                      {
                        id: "INV-2024-002",
                        supplier: "Cooperative B",
                        date: "Mar 18, 2024",
                        amount: "KES 250K",
                        status: "pending",
                        dueDate: "Apr 3, 2024",
                      },
                      {
                        id: "INV-2024-003",
                        supplier: "Cooperative C",
                        date: "Mar 15, 2024",
                        amount: "KES 75K",
                        status: "overdue",
                        dueDate: "Mar 30, 2024",
                      },
                    ].map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border/60">
                        <td className="px-4 py-3 font-medium">{invoice.id}</td>
                        <td className="px-4 py-3">{invoice.supplier}</td>
                        <td className="px-4 py-3">{invoice.date}</td>
                        <td className="px-4 py-3">{invoice.amount}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {invoice.status === "paid"
                              ? "Paid"
                              : invoice.status === "pending"
                                ? "Pending"
                                : "Overdue"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{invoice.dueDate}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Matching */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">3-Way Invoice Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    invoice: "INV-2024-001",
                    po: "PO-2024-001",
                    receipt: "REC-2024-001",
                    status: "matched",
                  },
                  {
                    invoice: "INV-2024-002",
                    po: "PO-2024-002",
                    receipt: "REC-2024-002",
                    status: "variance",
                  },
                ].map((match) => (
                  <div key={match.invoice} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{match.invoice}</p>
                        <p className="text-sm text-muted-foreground">
                          {match.po} • {match.receipt}
                        </p>
                      </div>
                      <Badge variant={match.status === "matched" ? "default" : "secondary"}>
                        {match.status === "matched" ? "Matched" : "Variance"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    ref: "PAY-2024-001",
                    date: "Mar 20, 2024",
                    amount: "KES 106K",
                    method: "M-Pesa",
                    status: "success",
                    receipt: "MPesa123456",
                  },
                  {
                    ref: "PAY-2024-002",
                    date: "Mar 18, 2024",
                    amount: "KES 250K",
                    method: "Bank Transfer",
                    status: "success",
                    receipt: "BT-2024-001",
                  },
                  {
                    ref: "PAY-2024-003",
                    date: "Mar 15, 2024",
                    amount: "KES 75K",
                    method: "Card",
                    status: "pending",
                    receipt: "CARD-2024-001",
                  },
                ].map((payment) => (
                  <div key={payment.ref} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{payment.ref}</p>
                        <p className="text-sm text-muted-foreground">{payment.date}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{payment.method}</Badge>
                          <Badge variant="outline">{payment.receipt}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{payment.amount}</p>
                        <Badge
                          variant={payment.status === "success" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {payment.status === "success" ? "Success" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Scheduling */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Scheduled Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    invoice: "INV-2024-002",
                    amount: "KES 250K",
                    dueDate: "Apr 3, 2024",
                    scheduled: "Apr 2, 2024",
                    discount: "KES 5K (2%)",
                  },
                  {
                    invoice: "INV-2024-003",
                    amount: "KES 75K",
                    dueDate: "Mar 30, 2024",
                    scheduled: "Mar 28, 2024",
                    discount: "KES 1.5K (2%)",
                  },
                ].map((payment) => (
                  <div key={payment.invoice} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payment.invoice}</p>
                        <p className="text-sm text-muted-foreground">
                          Amount: {payment.amount} • Due: {payment.dueDate}
                        </p>
                        <p className="mt-1 text-sm text-green-600">Early payment discount: {payment.discount}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Modify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="costs" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Cost Breakdown by Commodity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { commodity: "Tomatoes", cost: "KES 2.4M", percentage: 28, trend: "up" },
                  { commodity: "Maize", cost: "KES 2.1M", percentage: 25, trend: "stable" },
                  { commodity: "Beans", cost: "KES 1.8M", percentage: 21, trend: "down" },
                  { commodity: "Potatoes", cost: "KES 1.5M", percentage: 18, trend: "up" },
                  { commodity: "Others", cost: "KES 0.6M", percentage: 8, trend: "stable" },
                ].map((item) => (
                  <div key={item.commodity}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.commodity}</span>
                      <span className="text-muted-foreground">{item.cost}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 rounded-full bg-muted">
                        <div
                          className="rounded-full bg-primary py-1"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        {item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget vs Actual */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Budget vs Actual Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { month: "January", budget: "KES 2.0M", actual: "KES 1.9M", variance: "-5%" },
                  { month: "February", budget: "KES 2.2M", actual: "KES 2.3M", variance: "+5%" },
                  { month: "March", budget: "KES 2.1M", actual: "KES 2.2M", variance: "+5%" },
                ].map((item) => (
                  <div key={item.month} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.month}</p>
                        <p className="text-sm text-muted-foreground">
                          Budget: {item.budget} • Actual: {item.actual}
                        </p>
                      </div>
                      <Badge variant={item.variance.startsWith("-") ? "default" : "secondary"}>
                        {item.variance}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Savings Tracking */}
          <Card className="border-border/60 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base">Cost Reduction Initiatives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    initiative: "Volume Discounts",
                    target: "KES 200K",
                    achieved: "KES 125K",
                    progress: 62,
                  },
                  {
                    initiative: "Early Payment Discounts",
                    target: "KES 150K",
                    achieved: "KES 125K",
                    progress: 83,
                  },
                  {
                    initiative: "Supplier Consolidation",
                    target: "KES 100K",
                    achieved: "KES 45K",
                    progress: 45,
                  },
                ].map((init) => (
                  <div key={init.initiative} className="rounded-lg border border-green-200 bg-white p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{init.initiative}</span>
                      <span className="text-green-600">{init.achieved}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${init.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="methods" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    type: "M-Pesa",
                    label: "+254 712 345 678",
                    isDefault: true,
                    status: "active",
                  },
                  {
                    type: "Bank Account",
                    label: "KCB - 1234567890",
                    isDefault: false,
                    status: "active",
                  },
                  {
                    type: "Credit Card",
                    label: "Visa ending in 4242",
                    isDefault: false,
                    status: "inactive",
                  },
                ].map((method) => (
                  <div key={method.label} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{method.type}</p>
                          <p className="text-sm text-muted-foreground">{method.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && <Badge>Default</Badge>}
                        <Badge variant={method.status === "active" ? "default" : "secondary"}>
                          {method.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Payment Method */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Add Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Payment Method Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Add Method</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
