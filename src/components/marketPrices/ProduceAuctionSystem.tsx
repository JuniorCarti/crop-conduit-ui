/**
 * Produce Auction System Component
 * Live auctions for premium produce with real-time bidding
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, TrendingUp, Clock, Users } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface Auction {
  id: string;
  commodity: string;
  quantity: number;
  quality: "A" | "Premium";
  startingBid: number;
  currentBid: number;
  bidders: number;
  timeLeft: number;
  seller: string;
  status: "Live" | "Ending Soon" | "Closed";
}

const MOCK_AUCTIONS: Auction[] = [
  {
    id: "1",
    commodity: "Grade A Tomatoes",
    quantity: 500,
    quality: "A",
    startingBid: 100,
    currentBid: 125,
    bidders: 12,
    timeLeft: 180,
    seller: "John Kamau",
    status: "Live",
  },
  {
    id: "2",
    commodity: "Premium Avocados",
    quantity: 200,
    quality: "Premium",
    startingBid: 150,
    currentBid: 185,
    bidders: 8,
    timeLeft: 45,
    seller: "Mary Wanjiku",
    status: "Ending Soon",
  },
];

export function ProduceAuctionSystem() {
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimes: Record<string, string> = {};
      MOCK_AUCTIONS.forEach(auction => {
        const minutes = Math.floor(auction.timeLeft / 60);
        const seconds = auction.timeLeft % 60;
        newTimes[auction.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      });
      setTimeRemaining(newTimes);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-purple-600" />
          Produce Auction System
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">UI Mockup</Badge>
        </CardTitle>
        <CardDescription>Live auctions for premium produce - highest bidder wins</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-2">🏆 Why Auction Your Produce?</h5>
          <div className="grid grid-cols-3 gap-2 text-sm text-purple-700">
            <div>💰 <strong>Higher Prices:</strong> Competitive bidding drives prices up</div>
            <div>⚡ <strong>Fast Sales:</strong> Sell within hours, not days</div>
            <div>✅ <strong>Guaranteed Payment:</strong> Buyers pre-verified</div>
          </div>
        </div>

        {MOCK_AUCTIONS.map((auction) => (
          <div key={auction.id} className={`border-2 rounded-lg p-5 ${
            auction.status === "Ending Soon" ? "border-orange-300 bg-orange-50" : "border-gray-200"
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h6 className="font-bold text-xl">{auction.commodity}</h6>
                <p className="text-sm text-muted-foreground">{auction.quantity} kg • by {auction.seller}</p>
              </div>
              <Badge className={auction.status === "Ending Soon" ? "bg-orange-600 text-white" : "bg-green-600 text-white"}>
                {auction.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded p-3 text-center">
                <p className="text-xs text-muted-foreground">Starting Bid</p>
                <p className="font-bold">{formatKsh(auction.startingBid)}</p>
              </div>
              <div className="bg-green-100 border border-green-300 rounded p-3 text-center">
                <p className="text-xs text-green-700">Current Bid</p>
                <p className="text-2xl font-bold text-green-600">{formatKsh(auction.currentBid)}</p>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <p className="text-xs text-muted-foreground">Bidders</p>
                <p className="font-bold flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" /> {auction.bidders}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Time Remaining
                </span>
                <span className="text-2xl font-bold text-orange-600">{timeRemaining[auction.id] || "..."}</span>
              </div>
              <Progress value={(1 - auction.timeLeft / 300) * 100} className="h-2" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">View Details</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Gavel className="h-4 w-4 mr-2" /> Place Bid
              </Button>
            </div>
          </div>
        ))}

        <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
          <Gavel className="h-4 w-4 mr-2" /> Start New Auction
        </Button>
      </CardContent>
    </Card>
  );
}
