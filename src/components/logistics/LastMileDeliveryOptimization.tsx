/**
 * Last-Mile Delivery Optimization Component (UI Mockup)
 * Route planning, delivery scheduling, and customer notifications
 */

import { MapPin, Clock, Navigation, CheckCircle2, AlertCircle, Phone, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const deliveryRoutes = [
  {
    id: "ROUTE-001",
    driver: "John Kamau",
    vehicle: "KCA 123A",
    stops: 8,
    completed: 5,
    distance: "45 km",
    eta: "16:30",
    status: "on-schedule",
    efficiency: 92,
  },
  {
    id: "ROUTE-002",
    driver: "Mary Wanjiku",
    vehicle: "KCB 456B",
    stops: 12,
    completed: 8,
    distance: "62 km",
    eta: "18:00",
    status: "delayed",
    efficiency: 78,
  },
  {
    id: "ROUTE-003",
    driver: "Peter Omondi",
    vehicle: "KCC 789C",
    stops: 6,
    completed: 6,
    distance: "38 km",
    eta: "Completed",
    status: "completed",
    efficiency: 95,
  },
];

const upcomingDeliveries = [
  {
    id: "DEL-101",
    customer: "Naivas Supermarket",
    address: "Westlands, Nairobi",
    items: "Tomatoes (200kg), Onions (150kg)",
    timeWindow: "14:00 - 16:00",
    priority: "high",
    status: "next",
  },
  {
    id: "DEL-102",
    customer: "Carrefour Karen",
    address: "Karen, Nairobi",
    items: "Cabbage (300kg)",
    timeWindow: "15:00 - 17:00",
    priority: "medium",
    status: "scheduled",
  },
  {
    id: "DEL-103",
    customer: "Quickmart Kilimani",
    address: "Kilimani, Nairobi",
    items: "Potatoes (250kg), Carrots (100kg)",
    timeWindow: "16:00 - 18:00",
    priority: "medium",
    status: "scheduled",
  },
];

const optimizationMetrics = {
  routesOptimized: 24,
  fuelSaved: 35,
  timeSaved: 120,
  co2Reduced: 280,
};

const deliveryPerformance = {
  onTime: 92,
  delayed: 6,
  failed: 2,
  avgDeliveryTime: 45,
};

export function LastMileDeliveryOptimization() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Last-Mile Delivery Optimization
            </CardTitle>
            <CardDescription>
              Route planning, delivery scheduling, and customer notifications
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optimization Metrics */}
        <div className="bg-gradient-to-br from-primary/10 to-success/10 rounded-xl p-4 border border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Routes Today</p>
              <p className="text-xl font-bold text-foreground">{optimizationMetrics.routesOptimized}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fuel Saved</p>
              <p className="text-xl font-bold text-success">{optimizationMetrics.fuelSaved}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Saved</p>
              <p className="text-xl font-bold text-foreground">{optimizationMetrics.timeSaved} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">CO₂ Reduced</p>
              <p className="text-xl font-bold text-foreground">{optimizationMetrics.co2Reduced} kg</p>
            </div>
          </div>
        </div>

        {/* Active Routes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Delivery Routes</h3>
          <div className="space-y-3">
            {deliveryRoutes.map((route) => (
              <div
                key={route.id}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{route.id}</p>
                    <p className="text-xs text-muted-foreground">{route.driver} • {route.vehicle}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      route.status === "completed"
                        ? "bg-success/10 text-success"
                        : route.status === "on-schedule"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {route.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {route.status === "delayed" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {route.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stops Completed</span>
                    <span className="font-semibold text-foreground">
                      {route.completed} / {route.stops}
                    </span>
                  </div>
                  <Progress value={(route.completed / route.stops) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-sm font-semibold text-foreground">{route.distance}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="text-sm font-semibold text-foreground">{route.eta}</p>
                  </div>
                  <div className="bg-success/10 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                    <p className="text-sm font-semibold text-success">{route.efficiency}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming Deliveries</h3>
          <div className="space-y-2">
            {upcomingDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{delivery.customer}</p>
                      <p className="text-xs text-muted-foreground">{delivery.id}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      delivery.priority === "high"
                        ? "bg-destructive/10 text-destructive text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {delivery.priority}
                  </Badge>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{delivery.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{delivery.timeWindow}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{delivery.items}</p>
                </div>

                {delivery.status === "next" && (
                  <div className="bg-primary/10 rounded-md p-2 text-xs text-primary">
                    📍 Next delivery stop
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Performance */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Delivery Performance (Last 30 Days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-success/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">On Time</p>
              <p className="text-2xl font-bold text-success">{deliveryPerformance.onTime}%</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Delayed</p>
              <p className="text-2xl font-bold text-warning">{deliveryPerformance.delayed}%</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-bold text-destructive">{deliveryPerformance.failed}%</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Avg Time</p>
              <p className="text-2xl font-bold text-foreground">{deliveryPerformance.avgDeliveryTime}m</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Navigation className="h-4 w-4 mr-2" />
            Optimize Routes
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            View Map
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 AI-powered route optimization reduces delivery time by 30% and fuel costs by 35%. Automatic customer notifications sent 30 minutes before delivery.
        </div>
      </CardContent>
    </Card>
  );
}
