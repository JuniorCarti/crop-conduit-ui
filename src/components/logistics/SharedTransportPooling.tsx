/**
 * Shared Transport Pooling Component (UI Mockup)
 * Cost splitting, route matching, and collaborative logistics
 */

import { Users, MapPin, DollarSign, Calendar, TrendingDown, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const availablePools = [
  {
    id: "POOL-001",
    route: "Nakuru → Nairobi",
    date: "2024-01-25",
    time: "06:00 AM",
    capacity: 2000,
    filled: 1200,
    participants: 4,
    costPerKg: 15,
    savings: 40,
    status: "open",
    organizer: "John Kamau",
  },
  {
    id: "POOL-002",
    route: "Eldoret → Mombasa",
    date: "2024-01-26",
    time: "05:00 AM",
    capacity: 3000,
    filled: 2800,
    participants: 7,
    costPerKg: 25,
    savings: 35,
    status: "filling-fast",
    organizer: "Mary Wanjiku",
  },
  {
    id: "POOL-003",
    route: "Kisumu → Nairobi",
    date: "2024-01-27",
    time: "07:00 AM",
    capacity: 1500,
    filled: 1500,
    participants: 5,
    costPerKg: 18,
    savings: 38,
    status: "full",
    organizer: "Peter Omondi",
  },
];

const myActivePools = [
  {
    id: "POOL-001",
    route: "Nakuru → Nairobi",
    myLoad: 300,
    myCost: 4500,
    participants: 4,
    status: "confirmed",
    departureDate: "2024-01-25",
    departureTime: "06:00 AM",
  },
  {
    id: "POOL-004",
    route: "Nairobi → Mombasa",
    myLoad: 500,
    myCost: 12500,
    participants: 6,
    status: "in-transit",
    departureDate: "2024-01-23",
    departureTime: "05:00 AM",
  },
];

const savingsStats = {
  totalSaved: 45000,
  poolsJoined: 12,
  avgSavings: 38,
  co2Reduced: 450,
};

export function SharedTransportPooling() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Shared Transport Pooling
            </CardTitle>
            <CardDescription>
              Cost splitting, route matching, and collaborative logistics
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Savings Summary */}
        <div className="bg-gradient-to-br from-success/10 to-primary/10 rounded-xl p-4 border border-success/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
              <p className="text-xl font-bold text-foreground">{formatKsh(savingsStats.totalSaved)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pools Joined</p>
              <p className="text-xl font-bold text-foreground">{savingsStats.poolsJoined}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Savings</p>
              <p className="text-xl font-bold text-success">{savingsStats.avgSavings}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">CO₂ Reduced</p>
              <p className="text-xl font-bold text-foreground">{savingsStats.co2Reduced} kg</p>
            </div>
          </div>
        </div>

        {/* Available Pools */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Available Transport Pools</h3>
          <div className="space-y-3">
            {availablePools.map((pool) => (
              <div
                key={pool.id}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pool.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{pool.route}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      pool.status === "open"
                        ? "bg-success/10 text-success"
                        : pool.status === "filling-fast"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {pool.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{pool.date} at {pool.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{pool.participants} farmers</span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold text-foreground">
                      {pool.filled} / {pool.capacity} kg
                    </span>
                  </div>
                  <Progress value={(pool.filled / pool.capacity) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Cost/kg</p>
                    <p className="text-sm font-semibold text-foreground">{formatKsh(pool.costPerKg)}</p>
                  </div>
                  <div className="bg-success/10 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Savings</p>
                    <p className="text-sm font-semibold text-success">{pool.savings}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Organizer</p>
                    <p className="text-xs font-semibold text-foreground truncate">{pool.organizer}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  disabled={pool.status === "full"}
                >
                  {pool.status === "full" ? "Pool Full" : "Join Pool"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* My Active Pools */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">My Active Pools</h3>
          <div className="space-y-2">
            {myActivePools.map((pool) => (
              <div
                key={pool.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pool.id}</p>
                    <p className="text-xs text-muted-foreground">{pool.route}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      pool.status === "confirmed"
                        ? "bg-success/10 text-success text-xs"
                        : "bg-primary/10 text-primary text-xs"
                    }
                  >
                    {pool.status === "confirmed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {pool.status === "in-transit" && <Clock className="h-3 w-3 mr-1" />}
                    {pool.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">My Load</p>
                    <p className="text-sm font-semibold text-foreground">{pool.myLoad} kg</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">My Cost</p>
                    <p className="text-sm font-semibold text-foreground">{formatKsh(pool.myCost)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Farmers</p>
                    <p className="text-sm font-semibold text-foreground">{pool.participants}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Departure: {pool.departureDate} at {pool.departureTime}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Create Pool
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            Find Routes
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Transport pooling reduces costs by 30-45% by sharing truck space with other farmers on the same route. Automatic matching based on pickup location and delivery destination.
        </div>
      </CardContent>
    </Card>
  );
}
