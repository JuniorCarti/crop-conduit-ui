/**
 * Market Sentiment Analysis Component
 * Analyzes WhatsApp groups, social media, and news for market sentiment
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle, Users, Newspaper } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SentimentSignal {
  source: "WhatsApp" | "Twitter" | "News" | "Traders";
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  message: string;
  timestamp: string;
  impact: "High" | "Medium" | "Low";
}

interface CommoditySentiment {
  commodity: string;
  overallSentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentScore: number;
  priceExpectation: "Rising" | "Falling" | "Stable";
  signals: SentimentSignal[];
  crowdWisdom: string;
}

const MOCK_SENTIMENTS: CommoditySentiment[] = [
  {
    commodity: "Tomatoes",
    overallSentiment: "Bearish",
    sentimentScore: 35,
    priceExpectation: "Falling",
    signals: [
      {
        source: "WhatsApp",
        sentiment: "Bearish",
        confidence: 85,
        message: "Traders worried about oversupply from Kiambu region",
        timestamp: "2 hours ago",
        impact: "High",
      },
      {
        source: "News",
        sentiment: "Bearish",
        confidence: 75,
        message: "Heavy rains expected - may increase tomato supply",
        timestamp: "5 hours ago",
        impact: "Medium",
      },
      {
        source: "Traders",
        sentiment: "Neutral",
        confidence: 60,
        message: "Wakulima market buyers reducing purchase volumes",
        timestamp: "1 day ago",
        impact: "Medium",
      },
    ],
    crowdWisdom: "Market consensus: Prices likely to drop 10-15% in next week due to oversupply concerns",
  },
  {
    commodity: "Onions",
    overallSentiment: "Bullish",
    sentimentScore: 78,
    priceExpectation: "Rising",
    signals: [
      {
        source: "Twitter",
        sentiment: "Bullish",
        confidence: 90,
        message: "Shortage reported in Nairobi markets - prices climbing",
        timestamp: "1 hour ago",
        impact: "High",
      },
      {
        source: "WhatsApp",
        sentiment: "Bullish",
        confidence: 80,
        message: "Buyers actively looking for onion suppliers",
        timestamp: "3 hours ago",
        impact: "High",
      },
      {
        source: "Traders",
        sentiment: "Bullish",
        confidence: 75,
        message: "Export demand increasing from Tanzania",
        timestamp: "6 hours ago",
        impact: "Medium",
      },
    ],
    crowdWisdom: "Market consensus: Strong buying opportunity - prices expected to rise 15-20%",
  },
];

export function MarketSentimentAnalysis() {
  const getSentimentColor = (sentiment: string) => {
    if (sentiment === "Bullish") return "bg-green-100 text-green-700 border-green-300";
    if (sentiment === "Bearish") return "bg-red-100 text-red-700 border-red-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "Bullish") return <TrendingUp className="h-4 w-4" />;
    if (sentiment === "Bearish") return <TrendingDown className="h-4 w-4" />;
    return <span className="h-4 w-4">→</span>;
  };

  const getImpactColor = (impact: string) => {
    if (impact === "High") return "text-red-600";
    if (impact === "Medium") return "text-orange-600";
    return "text-gray-600";
  };

  const getSourceIcon = (source: string) => {
    if (source === "WhatsApp") return "💬";
    if (source === "Twitter") return "🐦";
    if (source === "News") return "📰";
    return "👥";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Market Sentiment Analysis
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>AI analysis of market chatter, social media, and news</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-Time Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">⚠️ Market Alert</h4>
              <p className="text-sm text-amber-700">
                Strong bearish sentiment detected for Tomatoes. Consider delaying sales or switching to Onions.
              </p>
            </div>
          </div>
        </div>

        {/* Commodity Sentiments */}
        {MOCK_SENTIMENTS.map((commodity) => (
          <div
            key={commodity.commodity}
            className={`border-2 rounded-lg p-5 ${
              commodity.overallSentiment === "Bullish"
                ? "border-green-200 bg-green-50/50"
                : commodity.overallSentiment === "Bearish"
                ? "border-red-200 bg-red-50/50"
                : "border-gray-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-xl mb-1">{commodity.commodity}</h4>
                <div className="flex items-center gap-2">
                  <Badge className={getSentimentColor(commodity.overallSentiment)} variant="outline">
                    {getSentimentIcon(commodity.overallSentiment)}
                    <span className="ml-1">{commodity.overallSentiment}</span>
                  </Badge>
                  <Badge variant="outline">
                    {commodity.priceExpectation === "Rising" ? "📈" : commodity.priceExpectation === "Falling" ? "📉" : "➡️"}
                    <span className="ml-1">{commodity.priceExpectation}</span>
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{
                  color: commodity.sentimentScore >= 60 ? "#16a34a" : 
                         commodity.sentimentScore >= 40 ? "#6b7280" : "#dc2626"
                }}>
                  {commodity.sentimentScore}
                </p>
                <p className="text-xs text-muted-foreground">Sentiment Score</p>
              </div>
            </div>

            {/* Sentiment Meter */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-red-600 font-semibold">Bearish</span>
                <span className="text-muted-foreground">Sentiment</span>
                <span className="text-green-600 font-semibold">Bullish</span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 rounded-full">
                <div
                  className="absolute top-0 h-3 w-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                  style={{ left: `${commodity.sentimentScore}%`, transform: "translateX(-50%)" }}
                ></div>
              </div>
            </div>

            {/* Crowd Wisdom */}
            <div className={`rounded-lg p-4 mb-4 ${
              commodity.overallSentiment === "Bullish"
                ? "bg-green-100 border border-green-200"
                : commodity.overallSentiment === "Bearish"
                ? "bg-red-100 border border-red-200"
                : "bg-gray-100 border border-gray-200"
            }`}>
              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 mt-0.5" style={{
                  color: commodity.overallSentiment === "Bullish" ? "#16a34a" : 
                         commodity.overallSentiment === "Bearish" ? "#dc2626" : "#6b7280"
                }} />
                <div>
                  <h5 className="font-semibold text-sm mb-1">Crowd Wisdom</h5>
                  <p className="text-sm">{commodity.crowdWisdom}</p>
                </div>
              </div>
            </div>

            {/* Sentiment Signals */}
            <div className="space-y-3">
              <h5 className="font-semibold text-sm">Recent Signals ({commodity.signals.length})</h5>
              {commodity.signals.map((signal, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSourceIcon(signal.source)}</span>
                      <div>
                        <p className="font-semibold text-sm">{signal.source}</p>
                        <p className="text-xs text-muted-foreground">{signal.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSentimentColor(signal.sentiment)} variant="outline" size="sm">
                        {signal.sentiment}
                      </Badge>
                      <Badge variant="outline" size="sm" className={getImpactColor(signal.impact)}>
                        {signal.impact}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{signal.message}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="font-semibold">{signal.confidence}%</span>
                  </div>
                  <Progress value={signal.confidence} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Data Sources */}
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold mb-3">📊 Data Sources Monitored</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <p className="text-2xl mb-1">💬</p>
              <p className="font-semibold text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">45 groups</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
              <p className="text-2xl mb-1">🐦</p>
              <p className="font-semibold text-sm">Twitter</p>
              <p className="text-xs text-muted-foreground">1,200 accounts</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
              <p className="text-2xl mb-1">📰</p>
              <p className="font-semibold text-sm">News</p>
              <p className="text-xs text-muted-foreground">15 sources</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
              <p className="text-2xl mb-1">👥</p>
              <p className="font-semibold text-sm">Traders</p>
              <p className="text-xs text-muted-foreground">500+ contacts</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤖 How Sentiment Analysis Works</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5" />
              <span><strong>1. Data Collection:</strong> AI monitors WhatsApp groups, social media, news, and trader networks</span>
            </div>
            <div className="flex items-start gap-2">
              <Newspaper className="h-4 w-4 mt-0.5" />
              <span><strong>2. Natural Language Processing:</strong> Analyzes text for sentiment (bullish/bearish/neutral)</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5" />
              <span><strong>3. Signal Aggregation:</strong> Combines multiple sources into overall sentiment score</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5" />
              <span><strong>4. Crowd Wisdom:</strong> Identifies market consensus and early warning signals</span>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 All data is anonymized and aggregated. Individual messages are never stored or shared.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
