import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { getMarketPricesToday, resolveOrgCropsAndMarket } from "@/services/marketOracleService";
import { useNavigate } from "react-router-dom";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import KenyaMemberMap from "@/components/org/KenyaMemberMap";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Users, UserCheck, Calendar, TrendingUp, TrendingDown, Minus, Plus, UserPlus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";


type PriceSignal = {
  crop: string;
  market: string;
  price: number;
  trend?: "up" | "down" | "flat";
};

type CollectionPlan = {
  id: string;
  crop: string;
  startDate: string;
  endDate?: string;
  targetVolumeKg?: number;
  status?: string;
};

export default function OrgDashboard() {
  const accountQuery = useUserAccount();
  const orgId = accountQuery.data?.orgId ?? "";
  const navigate = useNavigate();

  const [memberCount, setMemberCount] = useState(0);
  const [newMembers, setNewMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [pendingMembers, setPendingMembers] = useState(0);
  const [nextCollection, setNextCollection] = useState<CollectionPlan | null>(null);
  const [priceSignals, setPriceSignals] = useState<PriceSignal[]>([]);
  const [priceMeta, setPriceMeta] = useState<{ market: string; updatedAt?: string } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [analyticsV2Enabled, setAnalyticsV2Enabled] = useState(false);
  const [sponsoredTotal, setSponsoredTotal] = useState(0);
  const [sponsoredUsed, setSponsoredUsed] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [paidUsed, setPaidUsed] = useState(0);
  const [joinedPerMonth, setJoinedPerMonth] = useState<Array<{ month: string; joined: number }>>([]);
  const kenyaMemberMapEnabled =
    String((import.meta as any).env?.VITE_ENABLE_KENYA_MEMBER_MAP ?? "false").toLowerCase() === "true";

  useEffect(() => {
    const fetchMembers = async () => {
      if (!orgId) return;
      const snap = await getDocs(collection(db, "orgs", orgId, "members"));
      const now = Date.now();
      let active = 0;
      let pending = 0;
      let recent = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const status = data.status ?? data.verificationStatus;
        if (status === "active") active += 1;
        if (["draft", "submitted"].includes(status)) pending += 1;
        const joinedAt = data.joinedAt?.toDate?.()?.getTime?.() ?? null;
        if (joinedAt && now - joinedAt <= 1000 * 60 * 60 * 24 * 30) {
          recent += 1;
        }
      });
      setMemberCount(snap.size);
      setActiveMembers(active);
      setPendingMembers(pending);
      setNewMembers(recent);
      const monthBuckets = new Map<string, number>();
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const date = data.joinedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? null;
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
      });
      const timeline = Array.from(monthBuckets.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, joined]) => ({ month, joined }));
      setJoinedPerMonth(timeline);
    };

    fetchMembers().catch(() => {
      setMemberCount(0);
      setActiveMembers(0);
      setPendingMembers(0);
      setNewMembers(0);
      setJoinedPerMonth([]);
    });
  }, [orgId, selectedMarket]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!orgId) return;
      const snap = await getDocs(collection(db, "orgs", orgId, "collections"));
      const today = new Date().toISOString().split("T")[0];
      const plans = snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
        .filter((plan) => plan.startDate && plan.startDate >= today)
        .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
      setNextCollection(plans.length ? (plans[0] as CollectionPlan) : null);
    };
    fetchCollections().catch(() => setNextCollection(null));
  }, [orgId, selectedMarket]);

  useEffect(() => {
    const loadFlags = async () => {
      if (!orgId) return;
      const flags = await getOrgFeatureFlags(orgId);
      setAnalyticsV2Enabled(Boolean(flags.analyticsV2));
    };
    loadFlags().catch(() => setAnalyticsV2Enabled(false));
  }, [orgId]);

  useEffect(() => {
    const loadSeatUsage = async () => {
      if (!orgId || !analyticsV2Enabled) return;
      const subSnap = await getDoc(doc(db, "orgs", orgId, "subscription", "current"));
      if (!subSnap.exists()) {
        setPaidTotal(0);
        setPaidUsed(0);
        setSponsoredTotal(0);
        setSponsoredUsed(0);
        return;
      }
      const data = subSnap.data() as any;
      setPaidTotal(Number(data?.seats?.paidTotal ?? data?.paidSeatsTotal ?? 0));
      setPaidUsed(Number(data?.seats?.paidUsed ?? data?.paidSeatsUsed ?? 0));
      setSponsoredTotal(Number(data?.seats?.sponsoredTotal ?? data?.sponsoredSeatsTotal ?? 0));
      setSponsoredUsed(Number(data?.seats?.sponsoredUsed ?? data?.sponsoredSeatsUsed ?? 0));
    };
    loadSeatUsage().catch(() => {
      setPaidTotal(0);
      setPaidUsed(0);
      setSponsoredTotal(0);
      setSponsoredUsed(0);
    });
  }, [orgId, analyticsV2Enabled, memberCount]);

  useEffect(() => {
    const loadMarkets = async () => {
      if (!orgId) return;
      const orgSnap = await getDoc(doc(db, "orgs", orgId));
      const orgData = orgSnap.exists() ? (orgSnap.data() as any) : {};
      const defaultMarket = orgData.defaultMarket ?? orgData.settings?.defaultMarket ?? null;
      const markets = new Map<string, number>();
      if (defaultMarket) markets.set(defaultMarket, 100);
      const memberSnap = await getDocs(collection(db, "orgs", orgId, "members"));
      memberSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const preferred = data.preferredMarkets ?? [];
        preferred.forEach((m: string) => markets.set(m, (markets.get(m) ?? 0) + 1));
      });
      const list = Array.from(markets.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
      const fallback = list.length ? list : ["Nakuru Market", "Wakulima (Nairobi)", "Kisumu Market"];
      setMarketOptions(fallback);
      if (!selectedMarket) {
        setSelectedMarket(defaultMarket ?? fallback[0]);
      }
    };
    loadMarkets().catch(() => undefined);
  }, [orgId, selectedMarket]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!orgId) return;
      setPriceLoading(true);
      setPriceError(null);
      try {
        const { crops, market: fallbackMarket } = await resolveOrgCropsAndMarket(orgId);
        const market = selectedMarket ?? fallbackMarket;
        if (!crops.length) {
          setPriceSignals([]);
          setPriceMeta({ market, updatedAt: undefined });
          return;
        }
        const snapshot = await getMarketPricesToday({ orgId, market, crops, priceType: "retail" });
        const updatedAt = snapshot.updatedAt?.toDate?.()?.toLocaleTimeString?.() ?? undefined;
        setPriceMeta({ market: snapshot.market, updatedAt });
        setPriceSignals(
          snapshot.items.map((item) => ({
            crop: item.crop,
            market: snapshot.market,
            price: item.price,
            trend: item.trend,
          })) as any
        );
      } catch (error: any) {
        setPriceSignals([]);
        setPriceError(error?.message || "Unable to load prices");
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices().catch(() => setPriceSignals([]));
  }, [orgId, selectedMarket]);

  const metrics = useMemo(
    () => [
      { 
        title: "Total Members", 
        value: memberCount.toString(), 
        subtitle: `${newMembers} new this month`,
        icon: Users,
        trend: newMembers > 0 ? "up" : "neutral",
        trendValue: newMembers > 0 ? `+${newMembers}` : "0",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      { 
        title: "Active Members", 
        value: activeMembers.toString(), 
        subtitle: `${pendingMembers} pending approval`,
        icon: UserCheck,
        trend: "neutral",
        trendValue: `${Math.round((activeMembers / memberCount) * 100)}%`,
        color: "text-green-600",
        bgColor: "bg-green-50"
      },
      {
        title: "Next Collection",
        value: nextCollection?.startDate ?? "None scheduled",
        subtitle: nextCollection?.crop ? `${nextCollection.crop} - ${nextCollection.targetVolumeKg ?? 0} kg` : "Plan a collection",
        icon: Calendar,
        trend: "neutral",
        trendValue: nextCollection ? "Scheduled" : "--",
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      {
        title: "Pending Approvals",
        value: pendingMembers.toString(),
        subtitle: "Require your attention",
        icon: UserPlus,
        trend: pendingMembers > 0 ? "up" : "neutral",
        trendValue: pendingMembers > 0 ? "Action needed" : "All clear",
        color: "text-amber-600",
        bgColor: "bg-amber-50"
      },
    ],
    [memberCount, newMembers, activeMembers, pendingMembers, nextCollection]
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
          return (
            <Card
              key={metric.title}
              className="border-border/60 cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
              onClick={() => {
                if (metric.title === "Total Members") navigate("/org/members");
                if (metric.title === "Active Members") navigate("/org/members?status=active");
                if (metric.title === "Next Collection") navigate("/org/aggregation");
                if (metric.title === "Pending Approvals") navigate("/org/members?status=submitted");
              }}
              role="button"
              tabIndex={0}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.subtitle}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs">
                  <TrendIcon className={`h-3 w-3 ${metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-gray-400"}`} />
                  <span className={metric.trend === "up" ? "text-green-600 font-medium" : metric.trend === "down" ? "text-red-600 font-medium" : "text-gray-600"}>
                    {metric.trendValue}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Prices Dashboard */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Market Prices Today
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Live prices for your cooperative's crops
              </p>
            </div>
            {marketOptions.length > 0 && (
              <Select value={selectedMarket ?? marketOptions[0]} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  {marketOptions.map((market) => (
                    <SelectItem key={market} value={market}>{market}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {priceLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : priceError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-3">{priceError}</p>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : priceSignals.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No member crop data yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add members to generate price insights.</p>
              <Button size="sm" className="mt-4" onClick={() => navigate("/org/members?open=add")}>Add Members</Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{priceMeta?.market}</span>
                <span>{priceMeta?.updatedAt ? `Updated ${priceMeta.updatedAt}` : ""}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {priceSignals.map((signal) => {
                  const TrendIcon = signal.trend === "up" ? TrendingUp : signal.trend === "down" ? TrendingDown : Minus;
                  return (
                    <div key={signal.crop} className="rounded-lg border border-border/60 p-4 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{signal.crop}</p>
                          <p className="text-2xl font-bold mt-1">KES {signal.price ? signal.price.toFixed(0) : "--"}</p>
                          <p className="text-xs text-muted-foreground">per kg</p>
                        </div>
                        <Badge variant={signal.trend === "up" ? "default" : signal.trend === "down" ? "destructive" : "outline"} className="flex items-center gap-1">
                          <TrendIcon className="h-3 w-3" />
                          {signal.trend === "up" ? "Up" : signal.trend === "down" ? "Down" : "Stable"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/org/group-prices")}>View Full Market Dashboard</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {analyticsV2Enabled && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Seat Usage */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Seat Usage</CardTitle>
              <p className="text-sm text-muted-foreground">Track your cooperative's seat allocation</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sponsored Seats</span>
                  <span className="text-sm text-muted-foreground">{sponsoredUsed} / {sponsoredTotal}</span>
                </div>
                <Progress value={(sponsoredUsed / Math.max(sponsoredTotal, 1)) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, sponsoredTotal - sponsoredUsed)} seats remaining
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Paid Seats</span>
                  <span className="text-sm text-muted-foreground">{paidUsed} / {paidTotal}</span>
                </div>
                <Progress value={(paidUsed / Math.max(paidTotal, 1)) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, paidTotal - paidUsed)} seats remaining
                </p>
              </div>
              <div className="pt-4 border-t border-border/60">
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/org/subscription")}>Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>

          {/* Member Growth */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Member Growth</CardTitle>
              <p className="text-sm text-muted-foreground">New members joined over time</p>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {joinedPerMonth.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No growth data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={joinedPerMonth}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="joined" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {kenyaMemberMapEnabled && orgId && (
        <ErrorBoundary
          fallback={
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Kenya Member Map</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Map is temporarily unavailable. Dashboard data is still available.
                </p>
              </CardContent>
            </Card>
          }
        >
          <KenyaMemberMap orgId={orgId} />
        </ErrorBoundary>
      )}

      {/* Quick Actions */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <p className="text-sm text-muted-foreground">Common tasks for managing your cooperative</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => navigate("/org/members?open=add")}>
              <UserPlus className="h-5 w-5 mb-2 text-primary" />
              <span className="font-semibold">Add Members</span>
              <span className="text-xs text-muted-foreground mt-1">Onboard new farmers</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => navigate("/org/members?open=joinCode")}>
              <Plus className="h-5 w-5 mb-2 text-primary" />
              <span className="font-semibold">Join Code</span>
              <span className="text-xs text-muted-foreground mt-1">Generate invite codes</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => navigate("/org/aggregation")}>
              <Calendar className="h-5 w-5 mb-2 text-primary" />
              <span className="font-semibold">Plan Collection</span>
              <span className="text-xs text-muted-foreground mt-1">Schedule harvest events</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => navigate("/org/group-prices")}>
              <TrendingUp className="h-5 w-5 mb-2 text-primary" />
              <span className="font-semibold">Market Insights</span>
              <span className="text-xs text-muted-foreground mt-1">View price trends</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
