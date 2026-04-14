/**
 * Satellite Yield Prediction Component
 * Uses satellite imagery to predict regional harvests and supply forecasts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, TrendingUp, AlertTriangle, MapPin, Calendar } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

interface RegionalYield {
  region: string;
  crop: string;
  expectedYield: number;
  yieldChange: number;
  harvestDate: string;
  daysUntilHarvest: number;
  confidence: number;
  impactOnPrices: "High Supply → Prices Drop" | "Low Supply → Prices Rise" | "Normal Supply → Stable Prices";
  priceImpact: number;
}

interface SupplyForecast {
  crop: string;
  currentSupply: number;
  expectedSupply: number;
  supplyChange: number;
  oversupplyRisk: "Low" | "Medium" | "High";
  recommendation: string;
  affectedMarkets: string[];
}

const MOCK_YIELDS: RegionalYield[] = [
  {
    region: "Kiambu County",
    crop: "Tomatoes",
    expectedYield: 15000,
    yieldChange: +35,
    harvestDate: "Next week",
    daysUntilHarvest: 7,
    confidence: 88,
    impactOnPrices: "High Supply → Prices Drop",
    priceImpact: -15,
  },
  {
    region: "Nakuru County",
    crop: "Onions",
    expectedYield: 8000,
    yieldChange: -20,
    harvestDate: "In 2 weeks",
    daysUntilHarvest: 14,
    confidence: 82,
    impactOnPrices: "Low Supply → Prices Rise",
    priceImpact: +18,
  },
  {
    region: "Meru County",
    crop: "Irish Potato",
    expectedYield: 12000,
    yieldChange: +5,
    harvestDate: "In 10 days",
    daysUntilHarvest: 10,
    confidence: 90,
    impactOnPrices: "Normal Supply → Stable Prices",
    priceImpact: 0,
  },
];

const MOCK_FORECAST: SupplyForecast = {
  crop: "Tomatoes",
  currentSupply: 10000,
  expectedSupply: 25000,
  supplyChange: +150,
  oversupplyRisk: "High",
  recommendation: "Delay planting or switch to Onions - tomato oversupply expected",
  affectedMarkets: ["Wakulima (Nairobi)", "Gikomba", "Marikiti"],
};

export function SatelliteYieldPrediction() {
  const getRiskColor = (risk: string) => {
    if (risk === "High") return "bg-red-100 text-red-700 border-red-300";
    if (risk === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-blue-600" />
              Satellite Yield Prediction
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>AI analysis of satellite imagery for harvest forecasting</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Oversupply Alert */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">⚠️ Oversupply Warning</h4>
              <p className="text-sm text-red-700 mb-2">
                High tomato yield expected in Kiambu next week (+35% above normal)
              </p>
              <p className="text-sm font-semibold text-red-900">
                Expected Price Impact: -15% in Nairobi markets
              </p>
            </div>
          </div>
        </div>

        {/* Supply Forecast Summary */}
        <div className="border-2 border-purple-200 rounded-lg p-5 bg-purple-50">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Supply Forecast: {MOCK_FORECAST.crop}
          </h4>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Supply</p>
              <p className="text-2xl font-bold">{MOCK_FORECAST.currentSupply.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">kg/week</p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded p-3 text-center">
              <p className="text-xs text-red-700 mb-1">Expected Supply</p>
              <p className="text-2xl font-bold text-red-600">{MOCK_FORECAST.expectedSupply.toLocaleString()}</p>
              <p className="text-xs text-red-700">kg/week</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Change</p>
              <p className="text-2xl font-bold text-red-600">+{MOCK_FORECAST.supplyChange}%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Oversupply Risk</span>
              <Badge className={getRiskColor(MOCK_FORECAST.oversupplyRisk)}>
                {MOCK_FORECAST.oversupplyRisk}
              </Badge>
            </div>
            <Progress 
              value={MOCK_FORECAST.oversupplyRisk === "High" ? 85 : MOCK_FORECAST.oversupplyRisk === "Medium" ? 50 : 20} 
              className="h-2" 
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-amber-900 mb-1">💡 Recommendation</p>
            <p className="text-sm text-amber-700">{MOCK_FORECAST.recommendation}</p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Affected Markets</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_FORECAST.affectedMarkets.map((market) => (
                <Badge key={market} variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {market}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Yield Predictions */}
        <div className="space-y-4">
          <h4 className="font-semibold">Regional Harvest Predictions</h4>
          
          {MOCK_YIELDS.map((yield_data, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                yield_data.yieldChange > 20
                  ? "border-red-200 bg-red-50/50"
                  : yield_data.yieldChange < -10
                  ? "border-green-200 bg-green-50/50"
                  : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h5 className="font-bold">{yield_data.region}</h5>
                  </div>
                  <p className="text-sm text-muted-foreground">{yield_data.crop}</p>
                </div>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {yield_data.harvestDate}
                </Badge>
              </div>

              {/* Yield Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected Yield</p>
                  <p className="text-xl font-bold">{yield_data.expectedYield.toLocaleString()} kg</p>
                </div>
                <div className={`rounded p-3 ${
                  yield_data.yieldChange > 0 ? "bg-red-100" : "bg-green-100"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">vs Normal</p>
                  <p className={`text-xl font-bold ${
                    yield_data.yieldChange > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {yield_data.yieldChange > 0 ? "+" : ""}{yield_data.yieldChange}%
                  </p>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Satellite Confidence</span>
                  <span className="font-semibold">{yield_data.confidence}%</span>
                </div>
                <Progress value={yield_data.confidence} className="h-2" />
              </div>

              {/* Price Impact */}
              <div className={`rounded-lg p-3 ${
                yield_data.priceImpact < 0
                  ? "bg-red-100 border border-red-200"
                  : yield_data.priceImpact > 0
                  ? "bg-green-100 border border-green-200"
                  : "bg-gray-100 border border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Price Impact</p>
                    <p className="text-sm font-semibold">{yield_data.impactOnPrices}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      yield_data.priceImpact < 0
                        ? "text-red-600"
                        : yield_data.priceImpact > 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}>
                      {yield_data.priceImpact > 0 ? "+" : ""}{yield_data.priceImpact}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Satellite Coverage Map */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-600" />
            Satellite Coverage
          </h5>
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-blue-200">
            <div className="text-6xl mb-3">🛰️</div>
            <p className="font-semibold mb-1">Kenya Agricultural Monitoring</p>
            <p className="text-sm text-muted-foreground">
              Covering 47 counties with daily satellite imagery
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded p-2 text-center">
              <p className="text-lg font-bold text-blue-600">47</p>
              <p className="text-xs text-muted-foreground">Counties</p>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <p className="text-lg font-bold text-blue-600">Daily</p>
              <p className="text-xs text-muted-foreground">Updates</p>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <p className="text-lg font-bold text-blue-600">10m</p>
              <p className="text-xs text-muted-foreground">Resolution</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">🤖 How Satellite Prediction Works</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Satellite className="h-4 w-4 mt-0.5" />
              <span><strong>1. Satellite Imagery:</strong> Daily high-resolution images of farmland across Kenya</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5" />
              <span><strong>2. Crop Health Analysis:</strong> AI detects crop growth, health, and maturity</span>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5" />
              <span><strong>3. Harvest Prediction:</strong> Estimates yield and harvest timing by region</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span><strong>4. Supply Forecasting:</strong> Predicts oversupply/shortage and price impacts</span>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold mb-3">📡 Satellite Data Sources</h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded p-3">
              <p className="font-semibold text-sm mb-1">Sentinel-2</p>
              <p className="text-xs text-muted-foreground">European Space Agency</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="font-semibold text-sm mb-1">Landsat 8</p>
              <p className="text-xs text-muted-foreground">NASA/USGS</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="font-semibold text-sm mb-1">Planet Labs</p>
              <p className="text-xs text-muted-foreground">Daily Imagery</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="font-semibold text-sm mb-1">MODIS</p>
              <p className="text-xs text-muted-foreground">NASA Terra/Aqua</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
