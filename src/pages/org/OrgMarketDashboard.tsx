import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { getMarketPrices } from "@/services/marketPriceService";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type CropDistribution = {
  crop: string;
  memberCount: number;
  percentage: number;
};

type PriceTrend = {
  date: string;
  price: number;
};

type CropPrice = {
  crop: string;
  currentPrice: number;
  previousPrice: number;
  trend: "up" | "down" | "neutral";
  change: number;
};

export default function OrgMarketDashboard() {
  const accountQuery = useUserAccount();
  const navigate = useNavigate();
  const orgId = accountQuery.data?.orgId ?? "";
  const [loading, setLoading] = useState(true);
  const [cropDistribution, setCropDistribution] = useState<CropDistribution[]>([]);
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [priceTrends, setPriceTrends] = useState<Record<string, PriceTrend[]>>({});
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        // Load member crop distribution
        const membersSnap = await getDocs(collection(db, "orgs", orgId, "members"));
        const cropCounts = new Map<string, number>();
        let totalMembers = 0;

        membersSnap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const crops = [...(data.mainCrops ?? []), ...(data.secondaryCrops ?? [])];
          crops.forEach((crop: string) => {
            if (crop) {
              cropCounts.set(crop, (cropCounts.get(crop) ?? 0) + 1);
              totalMembers++;
            }
          });
        });

        const distribution = Array.from(cropCounts.entries())
          .map(([crop, count]) => ({
            crop,
            memberCount: count,
            percentage: Math.round((count / Math.max(totalMembers, 1)) * 100),
          }))
          .sort((a, b) => b.memberCount - a.memberCount)
          .slice(0, 8);

        setCropDistribution(distribution);

        // Load prices for top crops
        const pricePromises = distribution.slice(0, 5).map(async (item) => {
          try {
            const prices = await getMarketPrices({ commodity: item.crop, limitCount: 7 });
            if (prices.length === 0) return null;

            const current = Number(prices[0]?.retail ?? prices[0]?.wholesale ?? 0);
            const previous = prices.length > 1 ? Number(prices[1]?.retail ?? prices[1]?.wholesale ?? 0) : current;
            const change = current - previous;
            const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";

            const trendData = prices
              .slice(0, 7)
              .reverse()
              .map((p) => ({
                date: p.date?.toISOString?.().slice(5, 10) ?? "--",
                price: Number(p.retail ?? p.wholesale ?? 0),
              }));

            return {
              crop: item.crop,
              currentPrice: current,
              previousPrice: previous,
              trend,
              change: Math.abs(change),
              trendData,
            };
          } catch {
            return null;
          }
        });

        const priceResults = await Promise.all(pricePromises);
        const validPrices = priceResults.filter((p): p is NonNullable<typeof p> => p !== null);
        setCropPrices(validPrices.map(({ trendData, ...rest }) => rest));

        const trends: Record<string, PriceTrend[]> = {};
        validPrices.forEach((p) => {
          if (p.trendData) trends[p.crop] = p.trendData;
        });
        setPriceTrends(trends);

        if (validPrices.length > 0 && !selectedCrop) {
          setSelectedCrop(validPrices[0].crop);
        }
      } catch (error) {
        console.error("Failed to load market dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (cropDistribution.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">No Crop Data Available</p>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Add members with crop information to see market insights and price trends for your cooperative.
          </p>
          <Button onClick={() => navigate("/org/members?open=add")}>Add Members</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Market Dashboard</h2>
        <p className="text-sm text-muted-foreground">Aggregated market insights for your cooperative's crops</p>
      </div>

      {/* Price Overview Cards */}
      {cropPrices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cropPrices.map((crop) => {
            const TrendIcon = crop.trend === "up" ? TrendingUp : crop.trend === "down" ? TrendingDown : Minus;
            return (
              <Card
                key={crop.crop}
                className={`border-border/60 cursor-pointer transition-all hover:shadow-md ${
                  selectedCrop === crop.crop ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
                }`}
                onClick={() => setSelectedCrop(crop.crop)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{crop.crop}</p>
                    <Badge
                      variant={crop.trend === "up" ? "default" : crop.trend === "down" ? "destructive" : "outline"}
                      className="flex items-center gap-1"
                    >
                      <TrendIcon className="h-3 w-3" />
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">KES {crop.currentPrice.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">per kg</p>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span
                      className={crop.trend === "up" ? "text-green-600" : crop.trend === "down" ? "text-red-600" : "text-gray-600"}
                    >
                      {crop.trend === "up" ? "+" : crop.trend === "down" ? "-" : ""}KES {crop.change.toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {cropPrices.length === 0 && (
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium">Price data unavailable</p>
              <p className="text-xs text-muted-foreground">Market prices for your crops are currently unavailable. Check back later.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Price Trend Chart */}
        {selectedCrop && priceTrends[selectedCrop] && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Price Trend - {selectedCrop}</CardTitle>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceTrends[selectedCrop]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Distribution */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Crop Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Member crop preferences</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="memberCount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Details Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Crop Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cropDistribution.map((crop) => (
              <div key={crop.crop} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="flex-1">
                  <p className="font-semibold">{crop.crop}</p>
                  <p className="text-xs text-muted-foreground">{crop.memberCount} members growing this crop</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{crop.percentage}%</p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
