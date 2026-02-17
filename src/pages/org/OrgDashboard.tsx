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
      { title: "Members", value: memberCount.toString(), subtitle: `${newMembers} new this month` },
      { title: "Active members", value: activeMembers.toString(), subtitle: `${pendingMembers} pending verification` },
      {
        title: "Next collection",
        value: nextCollection?.startDate ?? "None scheduled",
        subtitle: nextCollection?.crop ? `${nextCollection.crop} - ${nextCollection.targetVolumeKg ?? 0} kg` : "",
      },
    ],
    [memberCount, newMembers, activeMembers, pendingMembers, nextCollection]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card) => (
          <Card
            key={card.title}
            className="border-border/60 cursor-pointer transition hover:border-foreground/20"
            onClick={() => {
              if (card.title === "Members") navigate("/org/members");
              if (card.title === "Active members") navigate("/org/members?status=active");
              if (card.title === "Next collection") navigate("/org/aggregation");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (card.title === "Members") navigate("/org/members");
                if (card.title === "Active members") navigate("/org/members?status=active");
                if (card.title === "Next collection") navigate("/org/aggregation");
              }
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{card.value}</p>
              {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
        <Card
          className="border-border/60 cursor-pointer transition hover:border-foreground/20"
          onClick={() => navigate("/org/group-prices")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/org/group-prices");
            }
          }}
        >
          <CardHeader className="space-y-2">
            <CardTitle className="text-sm text-muted-foreground">Prices today</CardTitle>
            {marketOptions.length > 0 && (
              <select
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                value={selectedMarket ?? marketOptions[0]}
                onChange={(event) => setSelectedMarket(event.target.value)}
              >
                {marketOptions.map((market) => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {priceLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-4/6 rounded bg-muted" />
              </div>
            ) : priceError ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive">{priceError}</p>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : priceSignals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No member crop data yet. Add members to generate price insights.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {priceMeta?.market}{priceMeta?.updatedAt ? ` - Updated ${priceMeta.updatedAt}` : ""}
                </p>
                {priceSignals.map((signal) => (
                  <div key={signal.crop} className="flex items-center justify-between text-xs">
                    <span>{signal.crop}</span>
                    <span className="text-muted-foreground">KES {signal.price ? signal.price.toFixed(0) : "--"}/kg</span>
                    <span className="font-semibold">{signal.trend === "up" ? "up" : signal.trend === "down" ? "down" : "flat"}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {analyticsV2Enabled && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Total Members</p>
                <p className="font-semibold">{memberCount || "--"}</p>
              </div>
              <div className="rounded border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Active Members</p>
                <p className="font-semibold">{activeMembers || "--"}</p>
              </div>
              <div className="rounded border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
                <p className="font-semibold">{pendingMembers || "--"}</p>
              </div>
              <div className="rounded border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Sponsored Used / Total</p>
                <p className="font-semibold">{sponsoredUsed}/{sponsoredTotal}</p>
              </div>
              <div className="rounded border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Paid Used / Total</p>
                <p className="font-semibold">{paidUsed}/{paidTotal}</p>
              </div>
            </div>
            <div className="h-56 rounded border border-border/60 p-2">
              {joinedPerMonth.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">--</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={joinedPerMonth}>
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="joined" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
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

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Cooperative actions</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate("/org/members?open=add")}>Add members</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/org/members?open=joinCode")}>Create join code</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate("/org/aggregation/new")}>Plan collection</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Stay on top of member onboarding, collection planning, and market updates with live cooperative data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
