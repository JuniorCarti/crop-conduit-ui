/**
 * Enhanced Market Prices Page with Market Oracle Agent Features (UI Mockup)
 * Includes all new features as UI components ready for backend integration
 */

import { useState } from "react";
import { TrendingUp, Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketPriceTable } from "@/components/marketPrices/MarketPriceTable";
import { PriceChart } from "@/components/marketPrices/PriceChart";
import { PriceForecast7Day } from "@/components/marketPrices/PriceForecast7Day";
import { PriceAlertsManager } from "@/components/marketPrices/PriceAlertsManager";
import { ComparativeMarketAnalysis } from "@/components/marketPrices/ComparativeMarketAnalysis";
import { SeasonalPricePatterns } from "@/components/marketPrices/SeasonalPricePatterns";
import { DemandForecasting } from "@/components/marketPrices/DemandForecasting";
import { WeatherPriceCorrelation } from "@/components/marketPrices/WeatherPriceCorrelation";
import { MultiTimeframeForecast } from "@/components/marketPrices/MultiTimeframeForecast";
import { IntraDayPricePredictions } from "@/components/marketPrices/IntraDayPricePredictions";
import { PriceVolatilityIndex } from "@/components/marketPrices/PriceVolatilityIndex";
import { CrossMarketArbitrage } from "@/components/marketPrices/CrossMarketArbitrage";
import { OptimalSellingWindow } from "@/components/marketPrices/OptimalSellingWindow";
import { ProfitMarginCalculator } from "@/components/marketPrices/ProfitMarginCalculator";
import { GamificationDashboard } from "@/components/marketPrices/GamificationDashboard";
import { HistoricalPerformanceTracking } from "@/components/marketPrices/HistoricalPerformanceTracking";
import { useTranslation } from "react-i18next";

// Batch 1: AI/ML Features
import { AIPriceNegotiationAssistant } from "@/components/marketPrices/AIPriceNegotiationAssistant";
import { PredictiveCropRecommendationEngine } from "@/components/marketPrices/PredictiveCropRecommendationEngine";
import { ComputerVisionQualityGrading } from "@/components/marketPrices/ComputerVisionQualityGrading";
import { MarketSentimentAnalysis } from "@/components/marketPrices/MarketSentimentAnalysis";
import { DynamicPricingAlgorithm } from "@/components/marketPrices/DynamicPricingAlgorithm";
import { SatelliteYieldPrediction } from "@/components/marketPrices/SatelliteYieldPrediction";

// Batch 2: Network & Marketplace Features
import { FarmerTradingNetwork } from "@/components/marketPrices/FarmerTradingNetwork";
import { CooperativeBulkBuying } from "@/components/marketPrices/CooperativeBulkBuying";
import { ForwardContractsFutures } from "@/components/marketPrices/ForwardContractsFutures";
import { ProduceAuctionSystem } from "@/components/marketPrices/ProduceAuctionSystem";
import { BuyerSubscriptionModel } from "@/components/marketPrices/BuyerSubscriptionModel";
import { ProduceExchangePlatform } from "@/components/marketPrices/ProduceExchangePlatform";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MarketPricesEnhanced() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("Tomatoes");
  const [selectedMarket, setSelectedMarket] = useState<string>("Wakulima (Nairobi)");
  const { t } = useTranslation();

  // Feature toggles for UI mockups
  const [featureToggles, setFeatureToggles] = useState({
    forecast7Day: true,
    priceAlerts: true,
    marketComparison: true,
    seasonalPatterns: true,
    demandForecasting: true,
    weatherCorrelation: true,
    multiTimeframe: true,
    intraDayPricing: true,
    volatilityIndex: true,
    arbitrage: true,
    sellingWindow: true,
    profitCalculator: true,
    gamification: true,
    historicalPerformance: true,
  });

  const toggleFeature = (feature: keyof typeof featureToggles) => {
    setFeatureToggles((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("marketPrices.title")}
        subtitle={t("marketPrices.subtitle")}
        icon={TrendingUp}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Feature Toggles
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Market Oracle Features</DialogTitle>
              <DialogDescription>
                Toggle UI mockup features on/off (no backend integration yet)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="forecast7Day">7-Day Price Forecast</Label>
                <Switch
                  id="forecast7Day"
                  checked={featureToggles.forecast7Day}
                  onCheckedChange={() => toggleFeature("forecast7Day")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="priceAlerts">Price Alerts</Label>
                <Switch
                  id="priceAlerts"
                  checked={featureToggles.priceAlerts}
                  onCheckedChange={() => toggleFeature("priceAlerts")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketComparison">Market Comparison</Label>
                <Switch
                  id="marketComparison"
                  checked={featureToggles.marketComparison}
                  onCheckedChange={() => toggleFeature("marketComparison")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seasonalPatterns">Seasonal Patterns</Label>
                <Switch
                  id="seasonalPatterns"
                  checked={featureToggles.seasonalPatterns}
                  onCheckedChange={() => toggleFeature("seasonalPatterns")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="demandForecasting">Demand Forecasting</Label>
                <Switch
                  id="demandForecasting"
                  checked={featureToggles.demandForecasting}
                  onCheckedChange={() => toggleFeature("demandForecasting")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weatherCorrelation">Weather-Price Correlation</Label>
                <Switch
                  id="weatherCorrelation"
                  checked={featureToggles.weatherCorrelation}
                  onCheckedChange={() => toggleFeature("weatherCorrelation")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="multiTimeframe">Multi-Timeframe Forecasts</Label>
                <Switch
                  id="multiTimeframe"
                  checked={featureToggles.multiTimeframe}
                  onCheckedChange={() => toggleFeature("multiTimeframe")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="intraDayPricing">Intra-Day Pricing</Label>
                <Switch
                  id="intraDayPricing"
                  checked={featureToggles.intraDayPricing}
                  onCheckedChange={() => toggleFeature("intraDayPricing")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="volatilityIndex">Volatility Index</Label>
                <Switch
                  id="volatilityIndex"
                  checked={featureToggles.volatilityIndex}
                  onCheckedChange={() => toggleFeature("volatilityIndex")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="arbitrage">Cross-Market Arbitrage</Label>
                <Switch
                  id="arbitrage"
                  checked={featureToggles.arbitrage}
                  onCheckedChange={() => toggleFeature("arbitrage")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sellingWindow">Optimal Selling Window</Label>
                <Switch
                  id="sellingWindow"
                  checked={featureToggles.sellingWindow}
                  onCheckedChange={() => toggleFeature("sellingWindow")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="profitCalculator">Profit Calculator</Label>
                <Switch
                  id="profitCalculator"
                  checked={featureToggles.profitCalculator}
                  onCheckedChange={() => toggleFeature("profitCalculator")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gamification">Gamification & Rewards</Label>
                <Switch
                  id="gamification"
                  checked={featureToggles.gamification}
                  onCheckedChange={() => toggleFeature("gamification")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="historicalPerformance">Historical Performance</Label>
                <Switch
                  id="historicalPerformance"
                  checked={featureToggles.historicalPerformance}
                  onCheckedChange={() => toggleFeature("historicalPerformance")}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Info Banner */}
        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">
              UI Mockup
            </Badge>
            <div className="flex-1">
              <p className="text-sm font-semibold">Market Oracle Agent - Enhanced Features</p>
              <p className="text-xs text-muted-foreground mt-1">
                These features are UI mockups with sample data. Use the Feature Toggles button to
                show/hide components. Backend integration coming soon.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <MarketPriceTable
              initialFilters={{
                commodity: selectedCommodity || undefined,
                market: selectedMarket || undefined,
              }}
            />
            <PriceChart
              commodity={selectedCommodity || undefined}
              market={selectedMarket || undefined}
            />
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            {featureToggles.sellingWindow && <OptimalSellingWindow />}
            {featureToggles.multiTimeframe && <MultiTimeframeForecast />}
            {featureToggles.forecast7Day && (
              <PriceForecast7Day
                commodity={selectedCommodity}
                market={selectedMarket}
                currentPrice={75}
              />
            )}
            {featureToggles.intraDayPricing && <IntraDayPricePredictions />}
            {featureToggles.demandForecasting && (
              <DemandForecasting commodity={selectedCommodity} />
            )}
            {featureToggles.weatherCorrelation && (
              <WeatherPriceCorrelation commodity={selectedCommodity} region="Central Kenya" />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {featureToggles.volatilityIndex && <PriceVolatilityIndex />}
            {featureToggles.arbitrage && <CrossMarketArbitrage />}
            {featureToggles.marketComparison && (
              <ComparativeMarketAnalysis
                commodity={selectedCommodity}
                currentLocation="Nakuru"
              />
            )}
            {featureToggles.seasonalPatterns && (
              <SeasonalPricePatterns commodity={selectedCommodity} market={selectedMarket} />
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            {featureToggles.profitCalculator && <ProfitMarginCalculator />}
            {featureToggles.priceAlerts && <PriceAlertsManager />}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {featureToggles.historicalPerformance && <HistoricalPerformanceTracking />}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            {featureToggles.gamification && <GamificationDashboard />}
          </TabsContent>

          {/* AI Tools Tab - Batch 1 */}
          <TabsContent value="ai-tools" className="space-y-6">
            <AIPriceNegotiationAssistant />
            <PredictiveCropRecommendationEngine />
            <ComputerVisionQualityGrading />
            <MarketSentimentAnalysis />
            <DynamicPricingAlgorithm />
            <SatelliteYieldPrediction />
          </TabsContent>

          {/* Network & Trading Tab - Batch 2 */}
          <TabsContent value="network" className="space-y-6">
            <FarmerTradingNetwork />
            <CooperativeBulkBuying />
            <ForwardContractsFutures />
            <ProduceAuctionSystem />
            <BuyerSubscriptionModel />
            <ProduceExchangePlatform />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
