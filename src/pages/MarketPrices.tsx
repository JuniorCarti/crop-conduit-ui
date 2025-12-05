/**
 * Market Prices Page
 * Main page for viewing and managing market prices
 */

import { useState } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketPriceTable } from "@/components/marketPrices/MarketPriceTable";
import { PriceChart } from "@/components/marketPrices/PriceChart";

export default function MarketPrices() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");

  return (
    <div className="min-h-screen">
      <PageHeader title="Market Prices" subtitle="Real-time commodity pricing data" icon={TrendingUp} />

      <div className="p-4 md:p-6 space-y-6">
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Price Table</TabsTrigger>
            <TabsTrigger value="charts">Charts & Trends</TabsTrigger>
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
