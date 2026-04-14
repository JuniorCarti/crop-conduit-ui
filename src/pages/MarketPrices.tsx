/**
 * Market Prices Page
 * Main page for viewing and managing market prices
 */

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketPriceTable } from "@/components/marketPrices/MarketPriceTable";
import { PriceChart } from "@/components/marketPrices/PriceChart";
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

export default function MarketPrices() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("marketPrices.title")}
        subtitle={t("marketPrices.subtitle")}
        icon={TrendingUp}
      />

      <div className="p-4 md:p-6 space-y-6">
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <TabsTrigger value="table">{t("marketPrices.tabs.table")}</TabsTrigger>
            <TabsTrigger value="charts">{t("marketPrices.tabs.charts")}</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            <TabsTrigger value="network">Network & Trading</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <MarketPriceTable
              initialFilters={{
                commodity: selectedCommodity || undefined,
                market: selectedMarket || undefined,
              }}
            />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <PriceChart commodity={selectedCommodity || undefined} market={selectedMarket || undefined} />
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <AIPriceNegotiationAssistant />
            <PredictiveCropRecommendationEngine />
            <ComputerVisionQualityGrading />
            <MarketSentimentAnalysis />
            <DynamicPricingAlgorithm />
            <SatelliteYieldPrediction />
          </TabsContent>

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
