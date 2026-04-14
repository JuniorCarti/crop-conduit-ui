/**
 * Produce Exchange Platform Component
 * Stock exchange-style trading for agricultural commodities
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface ExchangeListing {
  commodity: string;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  change24h: number;
  volume24h: number;
  buyers: number;
  sellers: number;
  trend: "up" | "down" | "stable";
}

const MOCK_EXCHANGE: ExchangeListing[] = [
  {
    commodity: "Tomatoes",
    bidPrice: 93,
    askPrice: 97,
    lastPrice: 95,
    change24h: +5.2,
    volume24h: 15000,
    buyers: 45,
    sellers: 38,
    trend: "up",
  },
  {
    commodity: "Onions",
    bidPrice: 78,
    askPrice: 82,
    lastPrice: 80,
    change24h: -2.1,
    volume24h: 12000,
    buyers: 32,
    sellers: 41,
    trend: "down",
  },
  {
    commodity: "Irish Potato",
    bidPrice: 63,
    askPrice: 67,
    lastPrice: 65,
    change24h: +0.5,
    volume24h: 18000,
    buyers: 28,
    sellers: 30,
    trend: "stable",
  },
];

export function ProduceExchangePlatform() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Produce Exchange Platform
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">UI Mockup</Badge>
        </CardTitle>
        <CardDescription>Real-time agricultural commodity trading like a stock exchange</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2">📊 How the Exchange Works</h5>
          <p className="text-sm text-blue-700">
            Buyers post <strong>bid prices</strong> (what they'll pay). Sellers post <strong>ask prices</strong> (what they want).
            When bid meets ask, trade executes instantly. Transparent, fair, and efficient.
          </p>
        </div>

        <div className="space-y-3">
          <h5 className="font-semibold">Live Market Prices</h5>
          
          {MOCK_EXCHANGE.map((item) => (
            <div key={item.commodity} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h6 className="font-bold text-lg">{item.commodity}</h6>
                  <div className="flex items-center gap-2 mt-1">
                    {item.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : item.trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <span className="text-gray-600">→</span>
                    )}
                    <span className={`text-sm font-semibold ${
                      item.change24h > 0 ? "text-green-600" : item.change24h < 0 ? "text-red-600" : "text-gray-600"
                    }`}>
                      {item.change24h > 0 ? "+" : ""}{item.change24h}% (24h)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Last Price</p>
                  <p className="text-2xl font-bold">{formatKsh(item.lastPrice)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-xs text-red-700 mb-1">Bid (Buy Orders)</p>
                  <p className="text-xl font-bold text-red-600">{formatKsh(item.bidPrice)}</p>
                  <p className="text-xs text-muted-foreground">{item.buyers} buyers</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs text-green-700 mb-1">Ask (Sell Orders)</p>
                  <p className="text-xl font-bold text-green-600">{formatKsh(item.askPrice)}</p>
                  <p className="text-xs text-muted-foreground">{item.sellers} sellers</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-2 mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">24h Volume</span>
                <span className="font-semibold">{item.volume24h.toLocaleString()} kg</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                  Place Buy Order
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Place Sell Order
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-3">✨ Exchange Benefits</h5>
          <ul className="space-y-2 text-sm text-purple-700">
            <li>• <strong>Instant Matching:</strong> Orders execute automatically when prices match</li>
            <li>• <strong>Price Discovery:</strong> Real-time market prices based on supply/demand</li>
            <li>• <strong>Transparency:</strong> See all bids and asks in real-time</li>
            <li>• <strong>Fair Trading:</strong> No middlemen, direct farmer-to-buyer</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
