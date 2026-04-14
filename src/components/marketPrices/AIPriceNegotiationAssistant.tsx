/**
 * AI Price Negotiation Assistant Component
 * Provides real-time negotiation coaching based on buyer behavior patterns
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Users, Target, Lightbulb, AlertCircle } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BuyerProfile {
  name: string;
  type: "Restaurant" | "Wholesaler" | "Retailer" | "Export";
  avgNegotiation: number;
  successRate: number;
  paymentReliability: number;
  volumeHistory: string;
  preferredDays: string[];
  tactics: string[];
}

interface NegotiationScenario {
  yourAskingPrice: number;
  buyerOffer: number;
  aiRecommendation: number;
  confidence: number;
  reasoning: string[];
  tactics: string[];
  expectedOutcome: string;
}

const MOCK_BUYER: BuyerProfile = {
  name: "Nairobi Fresh Foods Ltd",
  type: "Restaurant",
  avgNegotiation: 5,
  successRate: 87,
  paymentReliability: 95,
  volumeHistory: "200-300 kg weekly",
  preferredDays: ["Monday", "Thursday"],
  tactics: [
    "Usually accepts 5% below asking price",
    "Prefers bulk discounts over price cuts",
    "Values quality over lowest price",
    "Pays within 24 hours if satisfied",
  ],
};

const MOCK_SCENARIO: NegotiationScenario = {
  yourAskingPrice: 100,
  buyerOffer: 90,
  aiRecommendation: 95,
  confidence: 88,
  reasoning: [
    "Buyer typically accepts 5% discount",
    "Your tomatoes are Grade A quality",
    "Market price is currently KSh 92",
    "Buyer has high payment reliability (95%)",
    "Building long-term relationship is valuable",
  ],
  tactics: [
    "Counter at KSh 95 (5% discount)",
    "Emphasize Grade A quality",
    "Offer loyalty discount for repeat orders",
    "Mention competing offers at KSh 98",
  ],
  expectedOutcome: "87% chance buyer accepts KSh 95",
};

export function AIPriceNegotiationAssistant() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Price Negotiation Assistant
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Real-time negotiation coaching based on buyer behavior</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Negotiation Alert */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Target className="h-6 w-6 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-1">Active Negotiation</h4>
              <p className="text-sm text-purple-700">
                {MOCK_BUYER.name} is negotiating for 150kg of Grade A Tomatoes
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              Live
            </Badge>
          </div>
        </div>

        {/* Buyer Profile */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold">{MOCK_BUYER.name}</h4>
                <Badge variant="outline" className="mt-1">{MOCK_BUYER.type}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg Negotiation</p>
              <p className="text-lg font-bold text-orange-600">-{MOCK_BUYER.avgNegotiation}%</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
              <p className="text-lg font-bold text-green-600">{MOCK_BUYER.successRate}%</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Payment Score</p>
              <p className="text-lg font-bold text-blue-600">{MOCK_BUYER.paymentReliability}%</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Volume</p>
              <p className="text-sm font-bold">{MOCK_BUYER.volumeHistory}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-sm">Buyer Behavior Patterns</h5>
            {MOCK_BUYER.tactics.map((tactic, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm bg-white rounded p-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                <span>{tactic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Negotiation Scenario */}
        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Current Negotiation
          </h4>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your Asking Price</p>
              <p className="text-xl font-bold">{formatKsh(MOCK_SCENARIO.yourAskingPrice)}</p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded p-3 text-center">
              <p className="text-xs text-red-700 mb-1">Buyer's Offer</p>
              <p className="text-xl font-bold text-red-600">{formatKsh(MOCK_SCENARIO.buyerOffer)}</p>
            </div>
            <div className="bg-green-100 border border-green-200 rounded p-3 text-center">
              <p className="text-xs text-green-700 mb-1">AI Recommendation</p>
              <p className="text-xl font-bold text-green-600">{formatKsh(MOCK_SCENARIO.aiRecommendation)}</p>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="bg-white rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">AI Confidence</span>
              <span className="text-sm font-bold text-purple-600">{MOCK_SCENARIO.confidence}%</span>
            </div>
            <Progress value={MOCK_SCENARIO.confidence} className="h-2" />
          </div>

          {/* AI Reasoning */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Analysis
            </h5>
            <div className="space-y-2">
              {MOCK_SCENARIO.reasoning.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5"></div>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Tactics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
            <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommended Negotiation Tactics
            </h5>
            <div className="space-y-2">
              {MOCK_SCENARIO.tactics.map((tactic, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="font-bold">{idx + 1}.</span>
                  <span>{tactic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Outcome */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-blue-900">{MOCK_SCENARIO.expectedOutcome}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-green-600 hover:bg-green-700">
            Accept AI Recommendation (KSh 95)
          </Button>
          <Button variant="outline">
            Counter with Different Price
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h5 className="font-semibold text-amber-900 mb-2">💡 Negotiation Tips</h5>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Never accept first offer - counter at least once</li>
                <li>• Emphasize quality and reliability of your produce</li>
                <li>• Build long-term relationships over one-time profits</li>
                <li>• Know your walk-away price before negotiating</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Historical Performance */}
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold mb-3">Your Negotiation Performance</h5>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">23</p>
              <p className="text-xs text-muted-foreground">Successful Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">+12%</p>
              <p className="text-xs text-muted-foreground">Avg Above Market</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">92%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
