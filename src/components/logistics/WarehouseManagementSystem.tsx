/**
 * Warehouse Management System Component (UI Mockup)
 * Inventory tracking, storage optimization, and warehouse operations
 */

import { Warehouse, Package, TrendingUp, AlertTriangle, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const warehouseLocations = [
  {
    id: "WH-001",
    name: "Nakuru Central Warehouse",
    capacity: 50000,
    occupied: 32000,
    available: 18000,
    temperature: "Ambient",
    products: 12,
    value: 2400000,
  },
  {
    id: "WH-002",
    name: "Nairobi Cold Storage",
    capacity: 30000,
    occupied: 28500,
    available: 1500,
    temperature: "4°C",
    products: 8,
    value: 3200000,
  },
  {
    id: "WH-003",
    name: "Eldoret Grain Store",
    capacity: 80000,
    occupied: 45000,
    available: 35000,
    temperature: "Ambient",
    products: 6,
    value: 1800000,
  },
];

const inventoryItems = [
  {
    product: "Tomatoes",
    quantity: 5000,
    unit: "kg",
    warehouse: "WH-002",
    value: 375000,
    expiryDays: 5,
    status: "good",
  },
  {
    product: "Maize",
    quantity: 25000,
    unit: "kg",
    warehouse: "WH-003",
    value: 1250000,
    expiryDays: 90,
    status: "good",
  },
  {
    product: "Onions",
    quantity: 3000,
    unit: "kg",
    warehouse: "WH-001",
    value: 180000,
    expiryDays: 2,
    status: "urgent",
  },
  {
    product: "Potatoes",
    quantity: 8000,
    unit: "kg",
    warehouse: "WH-001",
    value: 400000,
    expiryDays: 15,
    status: "good",
  },
];

const recentActivity = [
  { type: "in", product: "Tomatoes", quantity: 2000, warehouse: "WH-002", time: "2 hours ago" },
  { type: "out", product: "Maize", quantity: 5000, warehouse: "WH-003", time: "4 hours ago" },
  { type: "in", product: "Onions", quantity: 1500, warehouse: "WH-001", time: "6 hours ago" },
];

const storageStats = {
  totalCapacity: 160000,
  totalOccupied: 105500,
  totalValue: 7400000,
  utilizationRate: 66,
};

export function WarehouseManagementSystem() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Warehouse Management System
            </CardTitle>
            <CardDescription>
              Inventory tracking, storage optimization, and operations
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Overview */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Capacity</p>
              <p className="text-xl font-bold text-foreground">{(storageStats.totalCapacity / 1000).toFixed(0)}t</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Occupied</p>
              <p className="text-xl font-bold text-foreground">{(storageStats.totalOccupied / 1000).toFixed(0)}t</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(storageStats.totalValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Utilization</p>
              <p className="text-xl font-bold text-primary">{storageStats.utilizationRate}%</p>
            </div>
          </div>
        </div>

        {/* Warehouse Locations */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Warehouse Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {warehouseLocations.map((warehouse) => (
              <div
                key={warehouse.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{warehouse.id}</p>
                  <Badge variant="secondary" className="text-xs">
                    {warehouse.temperature}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{warehouse.name}</p>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold text-foreground">
                      {(warehouse.occupied / 1000).toFixed(0)}t / {(warehouse.capacity / 1000).toFixed(0)}t
                    </span>
                  </div>
                  <Progress value={(warehouse.occupied / warehouse.capacity) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="text-sm font-semibold text-foreground">{warehouse.products}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-sm font-semibold text-foreground">{formatKsh(warehouse.value / 1000)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Current Inventory</h3>
          <div className="space-y-2">
            {inventoryItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.product}</p>
                      <p className="text-xs text-muted-foreground">{item.warehouse}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "urgent"
                        ? "bg-destructive/10 text-destructive text-xs"
                        : "bg-success/10 text-success text-xs"
                    }
                  >
                    {item.status === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {item.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="text-sm font-semibold text-foreground">
                      {item.quantity.toLocaleString()} {item.unit}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-sm font-semibold text-foreground">{formatKsh(item.value)}</p>
                  </div>
                  <div className={`rounded-md p-2 ${item.expiryDays <= 5 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                    <p className="text-xs text-muted-foreground">Expiry</p>
                    <p className={`text-sm font-semibold ${item.expiryDays <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                      {item.expiryDays} days
                    </p>
                  </div>
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
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "in" ? "bg-success/10" : "bg-primary/10"
                    }`}
                  >
                    {activity.type === "in" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <Package className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activity.type === "in" ? "Received" : "Dispatched"}: {activity.product}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.quantity.toLocaleString()} kg • {activity.warehouse}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Package className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Warehouse management tracks inventory in real-time with automatic expiry alerts. Storage fees: KSh 5/kg/month for ambient, KSh 12/kg/month for cold storage.
        </div>
      </CardContent>
    </Card>
  );
}
