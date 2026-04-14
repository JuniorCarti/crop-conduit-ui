/**
 * Forward Contracts & Futures Component
 * Lock in prices 30-90 days ahead for risk management
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Calendar, Lock, AlertCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ForwardContract {
  id: string;
  buyer: {
    name: string;
    type: "Restaurant" | "Wholesaler" | "Exporter" | "Retailer";
    rating: number;
  };
  commodity: string;
  quantity: number;
  lockedPrice: number;
  currentMarketPrice: number;
  priceDifference: number;
  deliveryDate: string;
  daysUntilDelivery: number;
  contractDate: string;
  status: "Active" | "Pending" | "Completed";
  paymentTerms: "50% Advance" | "Full Advance" | "On Delivery";
}

interface FuturesOpportunity {
  commodity: string;
  currentPrice: number;
  futurePrice30Days: number;
  futurePrice60Days: number;
  futurePrice90Days: number;
  recommendation: "Lock Now" | "Wait" | "Risky";
  reasoning: string;
}

const MOCK_CONTRACTS: ForwardContract[] = [
  {
    id: "1",
    buyer: {
      name: "Nairobi Fresh Foods Ltd",
      type: "Restaurant",
      rating: 4.8,
    },
    commodity: "Tomatoes",
    quantity: 200,
    lockedPrice: 95,
    currentMarketPrice: 110,
    priceDifference: +15,
    deliveryDate: "Feb 15, 2024",
    daysUntilDelivery: 30,
    contractDate: "Jan 15, 2024",
    status: "Active",
    paymentTerms: "50% Advance",
  },
  {
    id: "2",
    buyer: {
      name: "Wakulima Wholesalers",
      type: "Wholesaler",
      rating: 4.6,
    },
    commodity: "Onions",
    quantity: 300,
    lockedPrice: 80,
    currentMarketPrice: 75,
    priceDifference: -5,
    deliveryDate: "Mar 1, 2024",
    daysUntilDelivery: 45,
    contractDate: "Jan 10, 2024",
    status: "Active",
    paymentTerms: "Full Advance",
  },
];

const MOCK_OPPORTUNITIES: FuturesOpportunity[] = [
  {
    commodity: "Tomatoes",
    currentPrice: 95,
    futurePrice30Days: 110,
    futurePrice60Days: 105,
    futurePrice90Days: 90,
    recommendation: "Lock Now",
    reasoning: "Prices expected to drop in 90 days due to oversupply. Lock in current price.",
  },
  {
    commodity: "Onions",
    currentPrice: 80,
    futurePrice30Days: 85,
    futurePrice60Days: 92,
    futurePrice90Days: 98,
    recommendation: "Wait",
    reasoning: "Prices rising steadily. Wait for better offers or sell spot market.",
  },
];

export function ForwardContractsFutures() {
  const getRecommendationColor = (rec: string) => {
    if (rec === "Lock Now") return "bg-green-100 text-green-700 border-green-300";
    if (rec === "Wait") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Forward Contracts & Futures
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Lock in prices ahead of time to hedge against market volatility</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-5">
          <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Why Use Forward Contracts?
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3">
              <p className="font-semibold mb-1">🔒 Price Protection</p>
              <p className="text-xs text-muted-foreground">Lock in today's price, avoid future drops</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="font-semibold mb-1">💰 Guaranteed Income</p>
              <p className="text-xs text-muted-foreground">Know your revenue before harvest</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="font-semibold mb-1">🤝 Buyer Commitment</p>
              <p className="text-xs text-muted-foreground">Buyers can't back out of deal</p>
            </div>
          </div>
        </div>

        {/* Futures Opportunities */}
        <div className="space-y-4">
          <h5 className="font-semibold">Futures Price Analysis</h5>
          
          {MOCK_OPPORTUNITIES.map((opp) => (
            <div
              key={opp.commodity}
              className="border-2 border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h6 className="font-bold text-lg">{opp.commodity}</h6>
                  <p className="text-sm text-muted-foreground">Current Market Price: {formatKsh(opp.currentPrice)}</p>
                </div>
                <Badge className={getRecommendationColor(opp.recommendation)}>
                  {opp.recommendation}
                </Badge>
              </div>

              {/* Price Timeline */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Today</p>
                  <p className="text-xl font-bold">{formatKsh(opp.currentPrice)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  opp.futurePrice30Days > opp.currentPrice ? "bg-green-50" : "bg-red-50"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">30 Days</p>
                  <p className={`text-xl font-bold ${
                    opp.futurePrice30Days > opp.currentPrice ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatKsh(opp.futurePrice30Days)}
                  </p>
                  <p className="text-xs">
                    {opp.futurePrice30Days > opp.currentPrice ? "+" : ""}
                    {Math.round(((opp.futurePrice30Days - opp.currentPrice) / opp.currentPrice) * 100)}%
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  opp.futurePrice60Days > opp.currentPrice ? "bg-green-50" : "bg-red-50"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">60 Days</p>
                  <p className={`text-xl font-bold ${
                    opp.futurePrice60Days > opp.currentPrice ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatKsh(opp.futurePrice60Days)}
                  </p>
                  <p className="text-xs">
                    {opp.futurePrice60Days > opp.currentPrice ? "+" : ""}
                    {Math.round(((opp.futurePrice60Days - opp.currentPrice) / opp.currentPrice) * 100)}%
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  opp.futurePrice90Days > opp.currentPrice ? "bg-green-50" : "bg-red-50"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">90 Days</p>
                  <p className={`text-xl font-bold ${
                    opp.futurePrice90Days > opp.currentPrice ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatKsh(opp.futurePrice90Days)}
                  </p>
                  <p className="text-xs">
                    {opp.futurePrice90Days > opp.currentPrice ? "+" : ""}
                    {Math.round(((opp.futurePrice90Days - opp.currentPrice) / opp.currentPrice) * 100)}%
                  </p>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-900 mb-1">💡 AI Recommendation</p>
                <p className="text-sm text-blue-700">{opp.reasoning}</p>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Lock className="h-4 w-4 mr-2" />
                Lock Price at {formatKsh(opp.currentPrice)}
              </Button>
            </div>
          ))}
        </div>

        {/* Active Contracts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold">Your Active Contracts</h5>
            <Badge variant="outline">{MOCK_CONTRACTS.length} contracts</Badge>
          </div>

          {MOCK_CONTRACTS.map((contract) => (
            <div
              key={contract.id}
              className={`border-2 rounded-lg p-5 ${
                contract.priceDifference > 0
                  ? "border-green-200 bg-green-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h6 className="font-bold text-lg">{contract.commodity}</h6>
                  <p className="text-sm text-muted-foreground">
                    {contract.buyer.name} • {contract.buyer.type}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-semibold">{contract.buyer.rating}</span>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  {contract.status}
                </Badge>
              </div>

              {/* Contract Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                  <p className="font-bold">{contract.quantity} kg</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Locked Price</p>
                  <p className="font-bold text-blue-600">{formatKsh(contract.lockedPrice)}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Market Price</p>
                  <p className="font-bold">{formatKsh(contract.currentMarketPrice)}</p>
                </div>
                <div className={`rounded-lg p-3 ${
                  contract.priceDifference > 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">Your Gain/Loss</p>
                  <p className={`font-bold ${
                    contract.priceDifference > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {contract.priceDifference > 0 ? "+" : ""}{formatKsh(contract.priceDifference * contract.quantity)}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Time Until Delivery</span>
                  <span className="font-semibold">{contract.daysUntilDelivery} days</span>
                </div>
                <Progress value={(1 - contract.daysUntilDelivery / 90) * 100} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Contract: {contract.contractDate}</span>
                  <span>Delivery: {contract.deliveryDate}</span>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-white rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Payment Terms</span>
                  <Badge variant="outline">{contract.paymentTerms}</Badge>
                </div>
                {contract.paymentTerms === "50% Advance" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Received: {formatKsh(contract.lockedPrice * contract.quantity * 0.5)}
                  </p>
                )}
              </div>

              {/* Performance Indicator */}
              {contract.priceDifference > 0 ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ Great Decision! You're earning {formatKsh(Math.abs(contract.priceDifference))}/kg more than market
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold text-amber-900">
                    ⚠️ Market price is lower, but you have guaranteed sale and payment
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">📋 How Forward Contracts Work</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span><strong>Agree on Terms:</strong> Lock in price, quantity, and delivery date with buyer</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span><strong>Receive Advance:</strong> Get 50-100% payment upfront (depending on terms)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span><strong>Grow Your Crop:</strong> Farm with confidence knowing you have a guaranteed buyer</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span><strong>Deliver & Get Paid:</strong> Deliver produce on agreed date and receive final payment</span>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h5 className="font-semibold text-amber-900 mb-2">⚖️ Risk Management Tips</h5>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Don't lock in 100% of your harvest - keep some for spot market</li>
                <li>• Check buyer ratings and payment history before signing</li>
                <li>• Use contracts when prices are high and expected to drop</li>
                <li>• Consider weather and crop health before committing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Stats */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3">✅ Your Contract Performance</h5>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">5</p>
              <p className="text-xs text-green-700">Completed Contracts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">+8%</p>
              <p className="text-xs text-green-700">Avg Gain vs Market</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">100%</p>
              <p className="text-xs text-green-700">Payment Success</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
