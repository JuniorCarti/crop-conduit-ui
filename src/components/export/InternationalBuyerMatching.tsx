/**
 * International Buyer Matching Component (UI Mockup)
 * Demand forecasting, buyer profiles, and automated matching
 */

import { Users, TrendingUp, Globe, Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const matchedBuyers = [
  {
    id: 1,
    name: "Fresh Imports Ltd",
    country: "United Kingdom",
    flag: "🇬🇧",
    rating: 4.8,
    orders: 45,
    matchScore: 95,
    demand: "Avocados (5000kg/month)",
    priceRange: "KSh 120-150/kg",
    certifications: ["GlobalGAP", "Organic"],
    paymentTerms: "30 days",
    verified: true,
  },
  {
    id: 2,
    name: "Al Baraka Trading",
    country: "UAE",
    flag: "🇦🇪",
    rating: 4.6,
    orders: 32,
    matchScore: 88,
    demand: "Mangoes (3000kg/month)",
    priceRange: "KSh 80-100/kg",
    certifications: ["Halal", "HACCP"],
    paymentTerms: "Letter of Credit",
    verified: true,
  },
  {
    id: 3,
    name: "Euro Fresh Produce",
    country: "Netherlands",
    flag: "🇳🇱",
    rating: 4.9,
    orders: 67,
    matchScore: 92,
    demand: "Green Beans (2000kg/week)",
    priceRange: "KSh 200-250/kg",
    certifications: ["GlobalGAP", "Fair Trade"],
    paymentTerms: "45 days",
    verified: true,
  },
];

const demandForecasts = [
  { product: "Avocados", region: "Europe", demand: "High", trend: "up", growth: 25 },
  { product: "Mangoes", region: "Middle East", demand: "Medium", trend: "stable", growth: 5 },
  { product: "Green Beans", region: "Europe", demand: "High", trend: "up", growth: 18 },
  { product: "Passion Fruit", region: "Asia", demand: "Low", trend: "up", growth: 35 },
];

const recentMatches = [
  { buyer: "Fresh Imports Ltd", product: "Avocados", volume: "5000kg", status: "negotiating" },
  { buyer: "Euro Fresh Produce", product: "Green Beans", volume: "2000kg", status: "contract-sent" },
  { buyer: "Al Baraka Trading", product: "Mangoes", volume: "3000kg", status: "completed" },
];

export function InternationalBuyerMatching() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              International Buyer Matching
            </CardTitle>
            <CardDescription>
              AI-powered buyer matching and demand forecasting
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matched Buyers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Top Matched Buyers</h3>
          <div className="space-y-3">
            {matchedBuyers.map((buyer) => (
              <div
                key={buyer.id}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{buyer.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{buyer.name}</p>
                        {buyer.verified && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{buyer.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      <span className="text-sm font-semibold text-foreground">{buyer.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{buyer.orders} orders</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Match Score</span>
                    <span className="font-semibold text-success">{buyer.matchScore}%</span>
                  </div>
                  <Progress value={buyer.matchScore} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Demand</p>
                    <p className="text-xs font-semibold text-foreground">{buyer.demand}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Price Range</p>
                    <p className="text-xs font-semibold text-foreground">{buyer.priceRange}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Payment Terms</p>
                    <p className="text-xs font-semibold text-foreground">{buyer.paymentTerms}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Certifications</p>
                    <p className="text-xs font-semibold text-foreground">{buyer.certifications.join(", ")}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Forecasts */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Global Demand Forecasts</h3>
          <div className="space-y-2">
            {demandForecasts.map((forecast, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{forecast.product}</p>
                    <p className="text-xs text-muted-foreground">{forecast.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      forecast.demand === "High"
                        ? "bg-success/10 text-success text-xs"
                        : forecast.demand === "Medium"
                        ? "bg-warning/10 text-warning text-xs"
                        : "bg-muted text-muted-foreground text-xs"
                    }
                  >
                    {forecast.demand}
                  </Badge>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        className={`h-3 w-3 ${
                          forecast.trend === "up" ? "text-success" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-xs font-semibold text-success">+{forecast.growth}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">YoY growth</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Matches</h3>
          <div className="space-y-2">
            {recentMatches.map((match, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{match.buyer}</p>
                  <p className="text-xs text-muted-foreground">
                    {match.product} • {match.volume}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    match.status === "completed"
                      ? "bg-success/10 text-success text-xs"
                      : match.status === "contract-sent"
                      ? "bg-primary/10 text-primary text-xs"
                      : "bg-warning/10 text-warning text-xs"
                  }
                >
                  {match.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Find More Buyers
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Trends
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 AI matching considers your crop quality, certifications, volume capacity, and buyer requirements to find the best international partners. Average match score above 85% leads to successful contracts.
        </div>
      </CardContent>
    </Card>
  );
}
