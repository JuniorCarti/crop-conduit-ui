/**
 * Demand Forecasting Component (UI Mockup)
 * Predicts demand spikes based on holidays, events, and seasons
 */

import { Calendar, TrendingUp, Users, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";

interface DemandEvent {
  date: string;
  event: string;
  demandIncrease: number;
  commodities: string[];
  reason: string;
  type: "holiday" | "season" | "event";
}

interface DemandForecastingProps {
  commodity?: string;
}

export function DemandForecasting({ commodity }: DemandForecastingProps) {
  // Mock data - will be replaced with real API data
  const mockDemandEvents: DemandEvent[] = [
    {
      date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      event: "School Opening",
      demandIncrease: 35,
      commodities: ["Beans", "Maize", "Irish Potato"],
      reason: "Increased institutional buying for school feeding programs",
      type: "event",
    },
    {
      date: format(addDays(new Date(), 12), "yyyy-MM-dd"),
      event: "Ramadan",
      demandIncrease: 45,
      commodities: ["Tomatoes", "Onions", "Cabbage", "Kale"],
      reason: "Higher vegetable consumption during fasting period",
      type: "holiday",
    },
    {
      date: format(addDays(new Date(), 25), "yyyy-MM-dd"),
      event: "Easter Weekend",
      demandIncrease: 30,
      commodities: ["Irish Potato", "Cabbage", "Carrots"],
      reason: "Family gatherings and traditional meals",
      type: "holiday",
    },
    {
      date: format(addDays(new Date(), 45), "yyyy-MM-dd"),
      event: "Planting Season Peak",
      demandIncrease: 20,
      commodities: ["Maize", "Beans"],
      reason: "Farmers prioritize planting over selling, reducing supply",
      type: "season",
    },
  ];

  const filteredEvents = commodity
    ? mockDemandEvents.filter((event) =>
        event.commodities.some((c) => c.toLowerCase().includes(commodity.toLowerCase()))
      )
    : mockDemandEvents;

  const getEventTypeBadge = (type: string) => {
    const colors = {
      holiday: "bg-success/10 text-success border-success/30",
      season: "bg-info/10 text-info border-info/30",
      event: "bg-warning/10 text-warning border-warning/30",
    };
    return colors[type as keyof typeof colors] || colors.event;
  };

  const getDemandLevel = (increase: number) => {
    if (increase >= 40) return { label: "Very High", color: "text-destructive" };
    if (increase >= 25) return { label: "High", color: "text-warning" };
    return { label: "Moderate", color: "text-info" };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Demand Forecasting
            </CardTitle>
            <CardDescription>
              Upcoming events that will impact {commodity || "crop"} demand
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming demand events for {commodity}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const demandLevel = getDemandLevel(event.demandIncrease);
              const daysUntil = Math.ceil(
                (new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 bg-background p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{event.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM dd, yyyy")} • {daysUntil} days away
                        </p>
                      </div>
                    </div>
                    <Badge className={getEventTypeBadge(event.type)} variant="outline">
                      {event.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className={`h-4 w-4 ${demandLevel.color}`} />
                        <p className="text-xs text-muted-foreground">Demand Increase</p>
                      </div>
                      <p className={`text-lg font-bold ${demandLevel.color}`}>+{event.demandIncrease}%</p>
                      <p className="text-xs text-muted-foreground">{demandLevel.label}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground">Affected Crops</p>
                      </div>
                      <p className="text-sm font-semibold">{event.commodities.length} commodities</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.commodities.slice(0, 2).map((crop) => (
                          <Badge key={crop} variant="secondary" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                        {event.commodities.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.commodities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                    <p className="text-xs font-semibold text-info mb-1">Why this matters:</p>
                    <p className="text-xs text-muted-foreground">{event.reason}</p>
                  </div>

                  {daysUntil <= 7 && (
                    <div className="mt-3 pt-3 border-t border-border/60">
                      <p className="text-xs font-semibold text-warning">⚡ Action Recommended:</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consider harvesting and selling before {format(new Date(event.date), "MMM dd")} to
                        capture higher prices.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-lg bg-muted/40 p-4">
          <p className="text-sm font-semibold mb-2">How to Use Demand Forecasts</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Plan harvest timing to align with high-demand periods</li>
            <li>Adjust planting schedules to meet seasonal demand</li>
            <li>Negotiate better prices during demand spikes</li>
            <li>Coordinate with cooperatives for bulk selling opportunities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
