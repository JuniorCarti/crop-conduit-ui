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
          <TabsList>
            <TabsTrigger value="table">{t("marketPrices.tabs.table")}</TabsTrigger>
            <TabsTrigger value="charts">{t("marketPrices.tabs.charts")}</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
