/**
 * Real-Time Fleet Tracking Component (UI Mockup)
 * GPS tracking, delivery status, route optimization, and driver monitoring
 */

import { Truck, MapPin, Clock, Navigation, AlertTriangle, CheckCircle2, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const activeDeliveries = [
  {
    id: "DEL-001",
    driver: "John Kamau",
    vehicle: "KCA 123A",
    route: "Nakuru → Nairobi",
    cargo: "Tomatoes (500kg)",
    status: "in-transit",
    progress: 65,
    eta: "14:30",
    distance: "35 km remaining",
    speed: 60,
    lastUpdate: "2 mins ago",
  },
  {
    id: "DEL-002",
    driver: "Mary Wanjiku",
    vehicle: "KCB 456B",
    route: "Eldoret → Kisumu",
    cargo: "Maize (1000kg)",
    status: "loading",
    progress: 10,
    eta: "18:00",
    distance: "280 km",
    speed: 0,
    lastUpdate: "5 mins ago",
  },
  {
    id: "DEL-003",
    driver: "Peter Omondi",
    vehicle: "KCC 789C",
    route: "Mombasa → Nairobi",
    cargo: "Mangoes (300kg)",
    status: "delayed",
    progress: 45,
    eta: "16:45",
    distance: "250 km remaining",
    speed: 45,
    lastUpdate: "1 min ago",
  },
];

const fleetSummary = {
  totalVehicles: 12,
  active: 8,
  idle: 3,
  maintenance: 1,
  onTimeDeliveries: 92,
  avgSpeed: 55,
};

const recentAlerts = [
  { type: "delay", message: "DEL-003 delayed by 30 mins - Traffic on Mombasa Rd", time: "10 mins ago" },
  { type: "maintenance", message: "KCD 234D requires service in 500km", time: "1 hour ago" },
  { type: "success", message: "DEL-004 delivered successfully to Carrefour", time: "2 hours ago" },
];

export function RealTimeFleetTracking() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Real-Time Fleet Tracking
            </CardTitle>
            <CardDescription>
              GPS tracking, delivery status, and route optimization
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fleet Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Fleet</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{fleetSummary.totalVehicles}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <p className="text-2xl font-bold text-success">{fleetSummary.active}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-xs text-muted-foreground">Idle</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{fleetSummary.idle}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-info" />
              <p className="text-xs text-muted-foreground">On-Time</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{fleetSummary.onTimeDeliveries}%</p>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Deliveries</h3>
          <div className="space-y-3">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{delivery.id}</p>
                      <p className="text-xs text-muted-foreground">{delivery.driver} • {delivery.vehicle}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      delivery.status === "in-transit"
                        ? "bg-primary/10 text-primary"
                        : delivery.status === "loading"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {delivery.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{delivery.route}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{delivery.cargo}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{delivery.progress}%</span>
                  </div>
                  <Progress value={delivery.progress} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="text-sm font-semibold text-foreground">{delivery.eta}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold text-foreground">{delivery.distance}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Speed</p>
                      <p className="text-sm font-semibold text-foreground">{delivery.speed} km/h</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">Updated {delivery.lastUpdate}</p>
                  <Button size="sm" variant="ghost">
                    <Phone className="h-3 w-3 mr-1" />
                    Call Driver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Alerts</h3>
          <div className="space-y-2">
            {recentAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
              >
                {alert.type === "delay" && <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />}
                {alert.type === "maintenance" && <Clock className="h-4 w-4 text-info mt-0.5" />}
                {alert.type === "success" && <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            View Map
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Navigation className="h-4 w-4 mr-2" />
            Optimize Routes
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 GPS tracking updates every 2 minutes. Route optimization uses real-time traffic data to suggest fastest routes and reduce fuel costs.
        </div>
      </CardContent>
    </Card>
  );
}

// Missing import
import { Package } from "lucide-react";
