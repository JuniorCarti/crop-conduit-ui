/**
 * Cold Chain Monitoring Component (UI Mockup)
 * Temperature tracking, quality alerts, and refrigeration monitoring
 */

import { Thermometer, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Snowflake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const coldChainUnits = [
  {
    id: "CC-001",
    vehicle: "KCA 123A",
    cargo: "Tomatoes (500kg)",
    currentTemp: 4.2,
    targetTemp: 4,
    humidity: 85,
    status: "optimal",
    duration: "3h 20m",
    alerts: 0,
  },
  {
    id: "CC-002",
    vehicle: "KCB 456B",
    cargo: "Milk (1000L)",
    currentTemp: 6.8,
    targetTemp: 4,
    humidity: 90,
    status: "warning",
    duration: "1h 45m",
    alerts: 1,
  },
  {
    id: "CC-003",
    vehicle: "KCC 789C",
    cargo: "Mangoes (300kg)",
    currentTemp: 12.5,
    targetTemp: 13,
    humidity: 88,
    status: "optimal",
    duration: "5h 10m",
    alerts: 0,
  },
];

const temperatureHistory = [
  { time: "08:00", temp: 4.0 },
  { time: "09:00", temp: 4.2 },
  { time: "10:00", temp: 4.5 },
  { time: "11:00", temp: 4.3 },
  { time: "12:00", temp: 4.2 },
];

const qualityAlerts = [
  {
    unit: "CC-002",
    message: "Temperature above threshold (6.8°C) for 15 minutes",
    severity: "warning",
    time: "10 mins ago",
    action: "Adjust cooling system",
  },
  {
    unit: "CC-004",
    message: "Humidity dropped to 75% - Risk of produce dehydration",
    severity: "info",
    time: "1 hour ago",
    action: "Check humidity control",
  },
];

export function ColdChainMonitoring() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-primary" />
              Cold Chain Monitoring
            </CardTitle>
            <CardDescription>
              Temperature tracking, quality alerts, and refrigeration monitoring
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Cold Chain Units */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Cold Chain Units</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coldChainUnits.map((unit) => (
              <div
                key={unit.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{unit.id}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      unit.status === "optimal"
                        ? "bg-success/10 text-success text-xs"
                        : unit.status === "warning"
                        ? "bg-warning/10 text-warning text-xs"
                        : "bg-destructive/10 text-destructive text-xs"
                    }
                  >
                    {unit.status === "optimal" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {unit.status === "warning" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {unit.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3">{unit.vehicle} • {unit.cargo}</p>

                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Current Temperature</p>
                      {unit.currentTemp > unit.targetTemp ? (
                        <TrendingUp className="h-3 w-3 text-destructive" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-success" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">{unit.currentTemp}°C</p>
                    <p className="text-xs text-muted-foreground">Target: {unit.targetTemp}°C</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Humidity</p>
                      <p className="text-sm font-semibold text-foreground">{unit.humidity}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-semibold text-foreground">{unit.duration}</p>
                    </div>
                  </div>

                  {unit.alerts > 0 && (
                    <div className="bg-warning/10 rounded-md p-2 text-xs text-warning">
                      ⚠️ {unit.alerts} active alert{unit.alerts > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temperature Trend */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Temperature Trend (CC-001)</h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-end justify-between gap-2 h-32">
              {temperatureHistory.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/20 rounded-t-md relative"
                    style={{ height: `${(point.temp / 6) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground">
                      {point.temp}°
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{point.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Alerts */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Quality Alerts</h3>
          <div className="space-y-2">
            {qualityAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 ${
                      alert.severity === "warning" ? "text-warning" : "text-info"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">{alert.unit}</p>
                      <Badge
                        variant="outline"
                        className={
                          alert.severity === "warning"
                            ? "bg-warning/10 text-warning text-xs"
                            : "bg-info/10 text-info text-xs"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                      <Button size="sm" variant="outline">
                        {alert.action}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Thermometer className="h-4 w-4 mr-2" />
            View All Units
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Cold chain sensors monitor temperature and humidity every 5 minutes. Automatic alerts sent via SMS when thresholds are exceeded to prevent spoilage.
        </div>
      </CardContent>
    </Card>
  );
}
