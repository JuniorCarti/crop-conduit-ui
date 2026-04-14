/**
 * Buyer Subscription Model Component
 * Restaurants and buyers subscribe to weekly/monthly deliveries
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repeat, Calendar, DollarSign, CheckCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface Subscription {
  id: string;
  buyer: string;
  type: "Restaurant" | "Hotel" | "Retailer";
  commodity: string;
  quantity: number;
  frequency: "Weekly" | "Bi-Weekly" | "Monthly";
  pricePerUnit: number;
  nextDelivery: string;
  totalEarnings: number;
  status: "Active" | "Paused";
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "1",
    buyer: "Nairobi Fresh Foods",
    type: "Restaurant",
    commodity: "Tomatoes",
    quantity: 50,
    frequency: "Weekly",
    pricePerUnit: 95,
    nextDelivery: "Every Monday",
    totalEarnings: 19000,
    status: "Active",
  },
  {
    id: "2",
    buyer: "Hilton Hotel Nairobi",
    type: "Hotel",
    commodity: "Mixed Vegetables",
    quantity: 100,
    frequency: "Bi-Weekly",
    pricePerUnit: 75,
    nextDelivery: "Jan 25, 2024",
    totalEarnings: 30000,
    status: "Active",
  },
];

export function BuyerSubscriptionModel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-green-600" />
          Buyer Subscription Model
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">UI Mockup</Badge>
        </CardTitle>
        <CardDescription>Guaranteed demand through recurring delivery subscriptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3">✨ Benefits of Subscriptions</h5>
          <div className="grid grid-cols-3 gap-2 text-sm text-green-700">
            <div>💰 <strong>Predictable Income:</strong> Know your monthly revenue</div>
            <div>🎯 <strong>Guaranteed Sales:</strong> No need to find buyers</div>
            <div>📈 <strong>Better Planning:</strong> Plan harvests around deliveries</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{MOCK_SUBSCRIPTIONS.length}</p>
            <p className="text-xs text-blue-700">Active Subscriptions</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatKsh(MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.totalEarnings, 0))}
            </p>
            <p className="text-xs text-green-700">Monthly Revenue</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">100%</p>
            <p className="text-xs text-purple-700">Delivery Success</p>
          </div>
        </div>

        {MOCK_SUBSCRIPTIONS.map((sub) => (
          <div key={sub.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h6 className="font-bold text-lg">{sub.buyer}</h6>
                <Badge variant="outline" className="mt-1">{sub.type}</Badge>
              </div>
              <Badge className="bg-green-600 text-white">{sub.status}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-muted-foreground">Commodity</p>
                <p className="font-semibold text-sm">{sub.commodity}</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="font-semibold text-sm">{sub.quantity} kg</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="font-semibold text-sm">{sub.frequency}</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-muted-foreground">Price/Unit</p>
                <p className="font-semibold text-sm text-green-600">{formatKsh(sub.pricePerUnit)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Delivery</p>
                  <p className="font-semibold text-sm">{sub.nextDelivery}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                <p className="font-bold text-green-600">{formatKsh(sub.totalEarnings)}</p>
              </div>
            </div>
          </div>
        ))}

        <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
          <Repeat className="h-4 w-4 mr-2" /> Create Subscription Offer
        </Button>
      </CardContent>
    </Card>
  );
}
