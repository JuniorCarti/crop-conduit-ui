import { useState } from "react";
import { TrendingUp, TrendingDown, MapPin, Bell, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useCropPrices, usePriceHistory, useRecommendedMarkets } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { formatKsh, formatPricePerUnit } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Market() {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pricePeriod, setPricePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch data using API hooks
  const { data: cropPrices, isLoading: pricesLoading, error: pricesError } = useCropPrices();
  const { data: priceHistory, isLoading: historyLoading } = usePriceHistory(pricePeriod);
  const { data: recommendedMarkets, isLoading: marketsLoading } = useRecommendedMarkets();

  // Filter crops based on search
  const filteredCrops = cropPrices?.filter(crop => 
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Market Forecasting" 
        subtitle="Oracle Agent • Real-time prices"
        icon={TrendingUp}
      >
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAlertModal(true)}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Set Alert</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Search */}
        <div className="relative animate-fade-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search crops..." 
            className="pl-10 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error State */}
        {pricesError && (
          <AlertCard
            type="danger"
            title="Error Loading Prices"
            message="Failed to load market prices. Please try again later."
          />
        )}

        {/* Price Cards */}
        <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h3 className="font-semibold text-foreground mb-3">Today's Prices</h3>
          {pricesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredCrops.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredCrops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop.name)}
                  className="bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{crop.name}</span>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      crop.trend === "up" ? "text-success" : "text-destructive"
                    }`}>
                      {crop.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {crop.change > 0 ? "+" : ""}{crop.change}%
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatKsh(crop.price)}</p>
                  <p className="text-xs text-muted-foreground">{crop.unit}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No crops found matching "{searchQuery}"
            </div>
          )}
        </section>

        {/* Price Trends Chart */}
        <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <Tabs value={pricePeriod} onValueChange={(v) => setPricePeriod(v as 'daily' | 'weekly' | 'monthly')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Price Trends</h3>
                <TabsList className="h-8">
                  <TabsTrigger value="daily" className="text-xs h-6 px-2">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs h-6 px-2">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs h-6 px-2">Monthly</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={pricePeriod} className="mt-0">
                {historyLoading ? (
                  <div className="h-52 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : priceHistory && priceHistory.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="maize" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wheat" 
                          stroke="hsl(var(--warning))" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sorghum" 
                          stroke="hsl(var(--info))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {priceHistory && priceHistory.length > 0 && (
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Maize</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-xs text-muted-foreground">Wheat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-info" />
                  <span className="text-xs text-muted-foreground">Sorghum</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recommended Markets */}
        <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="font-semibold text-foreground mb-3">Recommended Markets</h3>
          {marketsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : recommendedMarkets && recommendedMarkets.length > 0 ? (
            <div className="space-y-2">
              {recommendedMarkets.map((market) => (
                <div 
                  key={market.id}
                  className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{market.name}</p>
                      <p className="text-xs text-muted-foreground">{market.distance} • Best for {market.bestFor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatKsh(market.avgPrice)}</p>
                    <p className="text-xs text-muted-foreground">avg price</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recommended markets available
            </div>
          )}
        </section>
      </div>

      {/* Price Alert Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
            <DialogDescription>
              Get notified when crop prices reach your target
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Crop</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                {cropPrices?.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Alert when price is</label>
              <div className="flex gap-2 mt-1">
                <select className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  <option>Above</option>
                  <option>Below</option>
                </select>
                <Input placeholder="Enter price" type="number" className="flex-1" />
              </div>
            </div>
            <Button className="w-full">Create Alert</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Detail Modal */}
      <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCrop} Price Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedCrop && cropPrices && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatKsh(cropPrices.find(c => c.name === selectedCrop)?.price || 0)}
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">24h Change</p>
                    <p className={`text-xl font-bold ${
                      (cropPrices.find(c => c.name === selectedCrop)?.change || 0) > 0 
                        ? "text-success" 
                        : "text-destructive"
                    }`}>
                      {(cropPrices.find(c => c.name === selectedCrop)?.change || 0) > 0 ? "+" : ""}
                      {cropPrices.find(c => c.name === selectedCrop)?.change || 0}%
                    </p>
                  </div>
                </div>
                <div className="h-40 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  Detailed price chart
                </div>
                <Button className="w-full" onClick={() => setShowAlertModal(true)}>
                  Set Price Alert
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
