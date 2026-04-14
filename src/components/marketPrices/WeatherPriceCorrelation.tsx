/**
 * Weather-Price Correlation Component (UI Mockup)
 * Shows how weather events impact crop prices
 */

import { CloudRain, Sun, Wind, Thermometer, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatKsh } from "@/lib/currency";

interface WeatherImpact {
  weatherEvent: string;
  icon: any;
  severity: "Low" | "Medium" | "High";
  priceImpact: number;
  affectedCrops: string[];
  timeframe: string;
  explanation: string;
  recommendation: string;
}

interface WeatherPriceCorrelationProps {
  commodity: string;
  region: string;
}

export function WeatherPriceCorrelation({ commodity, region }: WeatherPriceCorrelationProps) {
  // Mock data - will be replaced with real API data
  const mockWeatherImpacts: WeatherImpact[] = [
    {
      weatherEvent: "Drought Expected",
      icon: Sun,
      severity: "High",
      priceImpact: 35,
      affectedCrops: ["Maize", "Beans", "Irish Potato"],
      timeframe: "Next 30 days",
      explanation: "Extended dry spell will reduce supply by 25-30% in major growing regions",
      recommendation: "Hold inventory if possible - prices expected to rise significantly",
    },
    {
      weatherEvent: "Heavy Rainfall",
      icon: CloudRain,
      severity: "Medium",
      priceImpact: -15,
      affectedCrops: ["Tomatoes", "Onions", "Cabbage"],
      timeframe: "Next 14 days",
      explanation: "Excess rain may cause oversupply and quality issues, pushing prices down",
      recommendation: "Sell quickly before market floods, or invest in storage",
    },
    {
      weatherEvent: "Frost Risk",
      icon: Thermometer,
      severity: "High",
      priceImpact: 40,
      affectedCrops: ["Irish Potato", "Kale", "Cabbage"],
      timeframe: "Next 7 days",
      explanation: "Frost damage in highland regions will create supply shortage",
      recommendation: "Urgent: Harvest immediately or protect crops with covers",
    },
    {
      weatherEvent: "Strong Winds",
      icon: Wind,
      severity: "Low",
      priceImpact: 10,
      affectedCrops: ["Tomatoes", "Beans"],
      timeframe: "Next 5 days",
      explanation: "Wind damage may affect 10-15% of standing crops",
      recommendation: "Secure crops and plan early harvest for vulnerable fields",
    },
  ];

  const relevantImpacts = mockWeatherImpacts.filter((impact) =>
    impact.affectedCrops.some((crop) => crop.toLowerCase().includes(commodity.toLowerCase()))
  );

  const getSeverityBadge = (severity: string) => {
    const colors = {
      High: "bg-destructive/10 text-destructive border-destructive/30",
      Medium: "bg-warning/10 text-warning border-warning/30",
      Low: "bg-info/10 text-info border-info/30",
    };
    return colors[severity as keyof typeof colors] || colors.Low;
  };

  const currentPrice = 75; // Mock current price

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Weather-Price Impact
            </CardTitle>
            <CardDescription>
              How weather events will affect {commodity} prices in {region}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {relevantImpacts.length === 0 ? (
          <Alert>
            <Sun className="h-4 w-4" />
            <AlertTitle>Stable Weather Conditions</AlertTitle>
            <AlertDescription>
              No major weather events expected to impact {commodity} prices in the next 30 days.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Current Price Reference */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground mb-1">Current Market Price</p>
              <p className="text-2xl font-bold">{formatKsh(currentPrice)}/kg</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on latest Market Oracle data for {region}
              </p>
            </div>

            {/* Weather Impacts */}
            {relevantImpacts.map((impact, index) => {
              const Icon = impact.icon;
              const projectedPrice = currentPrice * (1 + impact.priceImpact / 100);
              const priceChange = projectedPrice - currentPrice;

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    impact.severity === "High"
                      ? "border-destructive/30 bg-destructive/5"
                      : impact.severity === "Medium"
                      ? "border-warning/30 bg-warning/5"
                      : "border-border/60 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          impact.severity === "High"
                            ? "bg-destructive/10"
                            : impact.severity === "Medium"
                            ? "bg-warning/10"
                            : "bg-info/10"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            impact.severity === "High"
                              ? "text-destructive"
                              : impact.severity === "Medium"
                              ? "text-warning"
                              : "text-info"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{impact.weatherEvent}</p>
                        <p className="text-xs text-muted-foreground">{impact.timeframe}</p>
                      </div>
                    </div>
                    <Badge className={getSeverityBadge(impact.severity)} variant="outline">
                      {impact.severity} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Price Impact</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${impact.priceImpact > 0 ? "text-success" : "text-destructive"}`}
                        />
                        <p
                          className={`text-lg font-bold ${
                            impact.priceImpact > 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {impact.priceImpact > 0 ? "+" : ""}
                          {impact.priceImpact}%
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Projected Price</p>
                      <p className="text-lg font-bold">{formatKsh(Math.round(projectedPrice))}/kg</p>
                      <p
                        className={`text-xs ${priceChange > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {priceChange > 0 ? "+" : ""}
                        {formatKsh(Math.round(priceChange))}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-semibold mb-1">Why this happens:</p>
                      <p className="text-xs text-muted-foreground">{impact.explanation}</p>
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        impact.severity === "High"
                          ? "bg-destructive/10 border border-destructive/20"
                          : "bg-info/10 border border-info/20"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold mb-1 ${
                          impact.severity === "High" ? "text-destructive" : "text-info"
                        }`}
                      >
                        {impact.severity === "High" ? "⚠️ Urgent Action:" : "💡 Recommendation:"}
                      </p>
                      <p className="text-xs text-muted-foreground">{impact.recommendation}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60">
                    <p className="text-xs text-muted-foreground">Affected crops:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {impact.affectedCrops.map((crop) => (
                        <Badge key={crop} variant="secondary" className="text-xs">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-lg bg-muted/40 p-4">
          <p className="text-sm font-semibold mb-2">Understanding Weather-Price Correlation</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Drought reduces supply → prices rise (good for sellers with inventory)</li>
            <li>Heavy rain increases supply → prices fall (sell quickly or store)</li>
            <li>Frost damages crops → supply shortage → prices spike</li>
            <li>Wind damage is localized → moderate price impact</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
