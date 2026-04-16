import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Truck, Package, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function BuyerLogisticsTracking() {
  const [searchShipment, setSearchShipment] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Logistics & Delivery</h1>
        <p className="text-sm text-muted-foreground">Track shipments and manage deliveries in real-time</p>
      </div>

      {/* Search & Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block text-sm font-medium">Search Shipment</Label>
              <Input
                placeholder="Order ID or tracking number"
                value={searchShipment}
                onChange={(e) => setSearchShipment(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Active Shipments</p>
            <p className="mt-2 text-3xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">On-Time Delivery</p>
            <p className="mt-2 text-3xl font-bold">94%</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Delayed</p>
            <p className="mt-2 text-3xl font-bold text-red-600">2</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">Avg Transit Time</p>
            <p className="mt-2 text-3xl font-bold">3.2 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Shipments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="routes">Route Optimization</TabsTrigger>
        </TabsList>

        {/* Active Shipments */}
        <TabsContent value="active" className="space-y-4">
          {[
            {
              id: "ORD-2024-001",
              crop: "Tomatoes",
              qty: "2,000 kg",
              supplier: "Cooperative A",
              status: "in_transit",
              origin: "Nakuru",
              destination: "Nairobi",
              eta: "Today, 6 PM",
              progress: 65,
              driver: "John Kipchoge",
              phone: "+254 712 345 678",
            },
            {
              id: "ORD-2024-002",
              crop: "Maize",
              qty: "5,000 kg",
              supplier: "Cooperative B",
              status: "scheduled",
              origin: "Eldoret",
              destination: "Nairobi",
              eta: "Tomorrow, 10 AM",
              progress: 0,
              driver: "Mary Kiplagat",
              phone: "+254 712 987 654",
            },
            {
              id: "ORD-2024-003",
              crop: "Beans",
              qty: "1,500 kg",
              supplier: "Cooperative C",
              status: "delayed",
              origin: "Kisii",
              destination: "Nairobi",
              eta: "Tomorrow, 2 PM",
              progress: 45,
              driver: "Peter Mwangi",
              phone: "+254 712 555 666",
            },
          ].map((shipment) => (
            <Card key={shipment.id} className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{shipment.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.crop} • {shipment.qty} • {shipment.supplier}
                      </p>
                    </div>
                    <Badge
                      variant={
                        shipment.status === "in_transit"
                          ? "default"
                          : shipment.status === "delayed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {shipment.status === "in_transit"
                        ? "In Transit"
                        : shipment.status === "scheduled"
                          ? "Scheduled"
                          : "Delayed"}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 rounded-lg bg-muted p-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{shipment.origin}</p>
                      <p className="text-xs text-muted-foreground">Origin</p>
                    </div>
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium">{shipment.destination}</p>
                      <p className="text-xs text-muted-foreground">Destination</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{shipment.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${shipment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver & ETA */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Driver</p>
                      <p className="font-medium">{shipment.driver}</p>
                      <p className="text-xs text-muted-foreground">{shipment.phone}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-medium">{shipment.eta}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Track
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Delivery History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: "ORD-2024-000",
                    crop: "Potatoes",
                    status: "delivered",
                    date: "Mar 20, 2024",
                    days: 2,
                  },
                  {
                    id: "ORD-2024-001",
                    crop: "Tomatoes",
                    status: "delivered",
                    date: "Mar 18, 2024",
                    days: 3,
                  },
                  {
                    id: "ORD-2024-002",
                    crop: "Beans",
                    status: "delivered",
                    date: "Mar 15, 2024",
                    days: 2,
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{item.id}</p>
                        <p className="text-sm text-muted-foreground">{item.crop}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.days} days transit</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route Optimization */}
        <TabsContent value="routes" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Route Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    route: "Nakuru → Nairobi",
                    distance: "162 km",
                    time: "3.5 hours",
                    cost: "KES 8,500",
                    optimized: true,
                  },
                  {
                    route: "Eldoret → Nairobi",
                    distance: "324 km",
                    time: "6 hours",
                    cost: "KES 15,200",
                    optimized: false,
                  },
                  {
                    route: "Kisii → Nairobi",
                    distance: "245 km",
                    time: "5 hours",
                    cost: "KES 12,800",
                    optimized: true,
                  },
                ].map((route) => (
                  <div key={route.route} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{route.route}</p>
                        <p className="text-sm text-muted-foreground">
                          {route.distance} • {route.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{route.cost}</p>
                        {route.optimized && (
                          <Badge className="mt-1 bg-green-600">Optimized</Badge>
                        )}
                      </div>
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
