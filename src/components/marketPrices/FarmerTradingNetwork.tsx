/**
 * Farmer-to-Farmer Trading Network Component
 * Peer-to-peer produce exchange and barter system
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRightLeft, MapPin, Phone, MessageSquare } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TradeOffer {
  id: string;
  farmer: {
    name: string;
    location: string;
    distance: number;
    rating: number;
    trades: number;
  };
  offering: {
    crop: string;
    quantity: number;
    quality: "A" | "B" | "C";
    cashValue: number;
  };
  seeking: {
    crop: string;
    quantity: number;
    quality: "A" | "B" | "C";
    cashValue: number;
  };
  tradeType: "Barter" | "Cash + Barter" | "Cash";
  status: "Active" | "Pending" | "Completed";
  postedDate: string;
}

const MOCK_OFFERS: TradeOffer[] = [
  {
    id: "1",
    farmer: {
      name: "John Kamau",
      location: "Kiambu",
      distance: 5,
      rating: 4.8,
      trades: 23,
    },
    offering: {
      crop: "Onions",
      quantity: 100,
      quality: "A",
      cashValue: 8000,
    },
    seeking: {
      crop: "Tomatoes",
      quantity: 80,
      quality: "A",
      cashValue: 8000,
    },
    tradeType: "Barter",
    status: "Active",
    postedDate: "2 hours ago",
  },
  {
    id: "2",
    farmer: {
      name: "Mary Wanjiku",
      location: "Nakuru",
      distance: 12,
      rating: 4.9,
      trades: 45,
    },
    offering: {
      crop: "Irish Potato",
      quantity: 150,
      quality: "B",
      cashValue: 9000,
    },
    seeking: {
      crop: "Kale",
      quantity: 100,
      quality: "A",
      cashValue: 4500,
    },
    tradeType: "Cash + Barter",
    status: "Active",
    postedDate: "5 hours ago",
  },
  {
    id: "3",
    farmer: {
      name: "Peter Omondi",
      location: "Kisumu",
      distance: 8,
      rating: 4.7,
      trades: 18,
    },
    offering: {
      crop: "Cabbage",
      quantity: 120,
      quality: "A",
      cashValue: 6600,
    },
    seeking: {
      crop: "Onions",
      quantity: 80,
      quality: "B",
      cashValue: 6000,
    },
    tradeType: "Cash + Barter",
    status: "Active",
    postedDate: "1 day ago",
  },
];

const MY_INVENTORY = [
  { crop: "Tomatoes", quantity: 200, quality: "A", value: 20000 },
  { crop: "Kale", quantity: 150, quality: "A", value: 6750 },
];

export function FarmerTradingNetwork() {
  const getQualityColor = (quality: string) => {
    if (quality === "A") return "bg-green-100 text-green-700 border-green-300";
    if (quality === "B") return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Farmer-to-Farmer Trading Network
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Peer-to-peer produce exchange and barter system</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">127</p>
            <p className="text-xs text-green-700">Active Offers</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">45</p>
            <p className="text-xs text-blue-700">Nearby Farmers</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">89%</p>
            <p className="text-xs text-purple-700">Success Rate</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">15km</p>
            <p className="text-xs text-orange-700">Avg Distance</p>
          </div>
        </div>

        {/* My Inventory */}
        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-green-600" />
            My Available Inventory
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MY_INVENTORY.map((item) => (
              <div key={item.crop} className="bg-white rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="font-semibold">{item.crop}</h6>
                  <Badge className={getQualityColor(item.quality)} variant="outline">
                    Grade {item.quality}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity} kg</span>
                  <span className="font-semibold text-green-600">{formatKsh(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-3 bg-green-600 hover:bg-green-700">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Create Trade Offer
          </Button>
        </div>

        {/* Trade Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold">Available Trade Offers Near You</h5>
            <Badge variant="outline">{MOCK_OFFERS.length} offers</Badge>
          </div>

          {MOCK_OFFERS.map((offer) => (
            <div
              key={offer.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              {/* Farmer Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-green-600 text-white">
                    <AvatarFallback>{offer.farmer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h6 className="font-semibold">{offer.farmer.name}</h6>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{offer.farmer.location} • {offer.farmer.distance}km away</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-semibold">{offer.farmer.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {offer.farmer.trades} successful trades
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{offer.postedDate}</Badge>
              </div>

              {/* Trade Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Offering */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 mb-2 font-semibold">Offering</p>
                  <h6 className="font-bold text-lg mb-1">{offer.offering.crop}</h6>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{offer.offering.quantity} kg</span>
                    <Badge className={getQualityColor(offer.offering.quality)} variant="outline" size="sm">
                      Grade {offer.offering.quality}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    Value: {formatKsh(offer.offering.cashValue)}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ArrowRightLeft className="h-8 w-8 text-green-600" />
                </div>

                {/* Seeking */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700 mb-2 font-semibold">Seeking</p>
                  <h6 className="font-bold text-lg mb-1">{offer.seeking.crop}</h6>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{offer.seeking.quantity} kg</span>
                    <Badge className={getQualityColor(offer.seeking.quality)} variant="outline" size="sm">
                      Grade {offer.seeking.quality}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-green-900">
                    Value: {formatKsh(offer.seeking.cashValue)}
                  </p>
                </div>
              </div>

              {/* Trade Type & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                    {offer.tradeType}
                  </Badge>
                  {offer.tradeType === "Cash + Barter" && (
                    <span className="text-sm text-muted-foreground">
                      + {formatKsh(Math.abs(offer.offering.cashValue - offer.seeking.cashValue))} cash
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Propose Trade
                  </Button>
                </div>
              </div>

              {/* Match Indicator */}
              {(offer.seeking.crop === "Tomatoes" || offer.seeking.crop === "Kale") && (
                <div className="mt-3 bg-green-100 border border-green-300 rounded p-2 text-center">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ You have {offer.seeking.crop} in your inventory - Perfect match!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤝 How Farmer Trading Works</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span><strong>List Your Produce:</strong> Post what you have and what you need</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span><strong>Find Matches:</strong> Browse offers from nearby farmers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span><strong>Negotiate:</strong> Agree on barter or cash + barter terms</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span><strong>Exchange:</strong> Meet and swap produce safely</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3">✨ Benefits of Farmer Trading</h5>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-start gap-2">
              <span>💰</span>
              <span><strong>Save Cash:</strong> Exchange produce without spending money</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🌾</span>
              <span><strong>Diversify:</strong> Get different crops for your family or market</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🤝</span>
              <span><strong>Build Community:</strong> Connect with nearby farmers</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚚</span>
              <span><strong>Reduce Waste:</strong> Trade excess produce instead of letting it spoil</span>
            </li>
          </ul>
        </div>

        {/* Safety Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h5 className="font-semibold text-amber-900 mb-2">🔒 Safety Tips</h5>
          <ul className="space-y-1 text-sm text-amber-700">
            <li>• Check farmer ratings and trade history before agreeing</li>
            <li>• Meet in public places or at farm gates</li>
            <li>• Inspect produce quality before finalizing trade</li>
            <li>• Use AgriSmart escrow for high-value trades</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
