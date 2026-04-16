import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";

export default function BuyerPurchaseOrderManagement() {
  const [showNewPO, setShowNewPO] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Create, manage, and track purchase orders</p>
        </div>
        <Button onClick={() => setShowNewPO(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total POs</p>
            <p className="mt-2 text-3xl font-bold">156</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Pending Approval</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">8</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total Value</p>
            <p className="mt-2 text-3xl font-bold">KES 4.2M</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Avg Lead Time</p>
            <p className="mt-2 text-3xl font-bold">14 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active POs</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Orders</TabsTrigger>
        </TabsList>

        {/* Active POs */}
        <TabsContent value="active" className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 text-left font-medium">PO Number</th>
                      <th className="px-4 py-2 text-left font-medium">Supplier</th>
                      <th className="px-4 py-2 text-left font-medium">Commodity</th>
                      <th className="px-4 py-2 text-left font-medium">Qty</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">ETA</th>
                      <th className="px-4 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        po: "PO-2024-001",
                        supplier: "Cooperative A",
                        commodity: "Tomatoes",
                        qty: "2,000 kg",
                        value: "KES 106K",
                        status: "confirmed",
                        eta: "Mar 25",
                      },
                      {
                        po: "PO-2024-002",
                        supplier: "Cooperative B",
                        commodity: "Maize",
                        qty: "5,000 kg",
                        value: "KES 250K",
                        status: "in_transit",
                        eta: "Mar 26",
                      },
                      {
                        po: "PO-2024-003",
                        supplier: "Cooperative C",
                        commodity: "Beans",
                        qty: "1,500 kg",
                        value: "KES 75K",
                        status: "delivered",
                        eta: "Mar 22",
                      },
                    ].map((po) => (
                      <tr key={po.po} className="border-b border-border/60">
                        <td className="px-4 py-3 font-medium">{po.po}</td>
                        <td className="px-4 py-3">{po.supplier}</td>
                        <td className="px-4 py-3">{po.commodity}</td>
                        <td className="px-4 py-3">{po.qty}</td>
                        <td className="px-4 py-3">{po.value}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              po.status === "confirmed"
                                ? "default"
                                : po.status === "in_transit"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {po.status === "confirmed"
                              ? "Confirmed"
                              : po.status === "in_transit"
                                ? "In Transit"
                                : "Delivered"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{po.eta}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approval */}
        <TabsContent value="pending" className="space-y-4">
          {[
            {
              po: "PO-2024-004",
              supplier: "Cooperative D",
              commodity: "Potatoes",
              qty: "3,000 kg",
              value: "KES 120K",
              submittedBy: "John Kipchoge",
              submittedDate: "Mar 20, 2024",
              approvers: [
                { name: "Manager A", status: "approved" },
                { name: "Finance Lead", status: "pending" },
              ],
            },
            {
              po: "PO-2024-005",
              supplier: "Supplier E",
              commodity: "Onions",
              qty: "2,500 kg",
              value: "KES 100K",
              submittedBy: "Mary Kiplagat",
              submittedDate: "Mar 21, 2024",
              approvers: [
                { name: "Manager B", status: "pending" },
                { name: "Finance Lead", status: "pending" },
              ],
            },
          ].map((po) => (
            <Card key={po.po} className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{po.po}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.supplier} • {po.commodity} • {po.qty}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>

                  {/* Details */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-semibold">{po.value}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Submitted By</p>
                      <p className="font-semibold">{po.submittedBy}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold">{po.submittedDate}</p>
                    </div>
                  </div>

                  {/* Approval Workflow */}
                  <div>
                    <p className="mb-2 text-sm font-medium">Approval Status</p>
                    <div className="space-y-2">
                      {po.approvers.map((approver) => (
                        <div key={approver.name} className="flex items-center gap-2">
                          {approver.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm">{approver.name}</span>
                          <Badge variant={approver.status === "approved" ? "default" : "secondary"}>
                            {approver.status === "approved" ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Standard PO", desc: "Basic purchase order template" },
              { name: "Bulk Order", desc: "For large volume orders" },
              { name: "Recurring Order", desc: "For regular supplies" },
              { name: "Emergency Order", desc: "Fast-track approval" },
            ].map((template) => (
              <Card key={template.name} className="border-border/60 cursor-pointer hover:border-primary/50">
                <CardContent className="pt-6">
                  <FileText className="mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{template.desc}</p>
                  <Button size="sm" variant="outline" className="mt-4 w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recurring Orders */}
        <TabsContent value="recurring" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recurring Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "Weekly Tomato Supply",
                    supplier: "Cooperative A",
                    qty: "500 kg",
                    frequency: "Weekly",
                    nextOrder: "Mar 25, 2024",
                    status: "active",
                  },
                  {
                    name: "Monthly Maize",
                    supplier: "Cooperative B",
                    qty: "2,000 kg",
                    frequency: "Monthly",
                    nextOrder: "Apr 1, 2024",
                    status: "active",
                  },
                  {
                    name: "Bi-weekly Beans",
                    supplier: "Cooperative C",
                    qty: "750 kg",
                    frequency: "Bi-weekly",
                    nextOrder: "Mar 28, 2024",
                    status: "paused",
                  },
                ].map((order) => (
                  <div key={order.name} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{order.name}</p>
                        <p className="text-sm text-muted-foreground">{order.supplier}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{order.qty}</Badge>
                          <Badge variant="outline">{order.frequency}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Next: {order.nextOrder}</p>
                        <Badge className="mt-1" variant={order.status === "active" ? "default" : "secondary"}>
                          {order.status === "active" ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New PO Dialog */}
      <Dialog open={showNewPO} onOpenChange={setShowNewPO}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Supplier</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coop-a">Cooperative A</SelectItem>
                  <SelectItem value="coop-b">Cooperative B</SelectItem>
                  <SelectItem value="coop-c">Cooperative C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Commodity</Label>
              <Input placeholder="e.g., Tomatoes" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">Quantity</Label>
                <Input placeholder="e.g., 2000" />
              </div>
              <div>
                <Label className="mb-2 block">Unit</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="kg" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="crates">crates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Unit Price</Label>
              <Input placeholder="e.g., 53" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewPO(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewPO(false)}>Create PO</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
