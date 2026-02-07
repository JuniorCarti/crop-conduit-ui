import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMarketPrices, syncMarketForecastWithFallback } from "@/services/marketPriceService";

export type PricePoint = {
  date: string;
  retail: number;
  wholesale: number;
};

export type PriceTableRow = {
  id: string;
  crop: string;
  market: string;
  retail: number;
  wholesale: number;
  change7d: number;
  change30d: number;
  sparkline: number[];
  recommendation: "best" | "good" | "avoid";
  latestDate: string;
};

export type PriceAlert = {
  id: string;
  commodity: string;
  market: string;
  pricetype: "retail" | "wholesale";
  severity: "low" | "medium" | "high";
  reason: string;
  changePct: number;
  window: "7d" | "30d";
  resolved: boolean;
};

export type MarketRecommendation = {
  crop: string;
  market: string;
  basis: "retail" | "wholesale";
  expectedGain: number;
  explanation: string;
};

const RANGE_CACHE_MINUTES = 20;

const KENYA_MARKET_COUNTY: Record<string, string> = {
  "Wakulima (Nairobi)": "Nairobi",
  "Dandora (Nairobi)": "Nairobi",
  "Kongowea (Mombasa)": "Mombasa",
  Kisumu: "Kisumu",
  Nakuru: "Nakuru",
  "Nakuru Market": "Nakuru",
};

const FALLBACK_MARKETS_BY_COUNTY: Record<string, string[]> = {
  Nairobi: ["Wakulima (Nairobi)", "Dandora (Nairobi)"],
  Mombasa: ["Kongowea (Mombasa)"],
  Kisumu: ["Kisumu"],
  Nakuru: ["Nakuru", "Nakuru Market"],
};

const DEFAULT_MARKETS = ["Nakuru", "Wakulima (Nairobi)", "Kisumu"];

const toDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const percentileChange = (latest: number, baseline: number) => {
  if (!baseline || baseline <= 0) return 0;
  return ((latest - baseline) / baseline) * 100;
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const stddev = (values: number[]) => {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const recommendationBucket = (change: number): "best" | "good" | "avoid" => {
  if (change >= 8) return "best";
  if (change >= -4) return "good";
  return "avoid";
};

const readOrgTopCrops = async (orgId: string): Promise<string[]> => {
  const score = new Map<string, number>();

  const plansSnap = await getDocs(collection(db, "orgs", orgId, "collections"));
  plansSnap.forEach((planDoc) => {
    const crop = String((planDoc.data() as any)?.crop ?? "").trim();
    if (!crop) return;
    score.set(crop, (score.get(crop) ?? 0) + 3);
  });

  const membersSnap = await getDocs(collection(db, "orgs", orgId, "members"));
  membersSnap.forEach((memberDoc) => {
    const member = memberDoc.data() as any;
    const crops = [
      ...(Array.isArray(member.mainCrops) ? member.mainCrops : []),
      ...(Array.isArray(member.secondaryCrops) ? member.secondaryCrops : []),
    ];
    crops.forEach((crop: string) => {
      const label = String(crop || "").trim();
      if (!label) return;
      score.set(label, (score.get(label) ?? 0) + 1);
    });
  });

  if (score.size === 0) {
    const orgSnap = await getDoc(doc(db, "orgs", orgId));
    const org = orgSnap.exists() ? (orgSnap.data() as any) : {};
    const fallback = Array.isArray(org.topCrops)
      ? org.topCrops
      : Array.isArray(org.settings?.preferredCrops)
        ? org.settings.preferredCrops
        : [];
    return fallback.filter(Boolean).slice(0, 5);
  }

  return Array.from(score.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([crop]) => crop);
};

const readOrgMarkets = async (orgId: string): Promise<{ markets: string[]; county: string | null }> => {
  const orgSnap = await getDoc(doc(db, "orgs", orgId));
  const org = orgSnap.exists() ? (orgSnap.data() as any) : {};
  const county = (org.county ?? org.hqCounty ?? org.countyHQ ?? null) as string | null;

  const configured = [
    ...(Array.isArray(org.marketsPreferred) ? org.marketsPreferred : []),
    ...(Array.isArray(org.settings?.nearbyMarkets) ? org.settings.nearbyMarkets : []),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return { markets: Array.from(new Set(configured)).slice(0, 6), county };
  }

  if (county && FALLBACK_MARKETS_BY_COUNTY[county]) {
    return { markets: FALLBACK_MARKETS_BY_COUNTY[county], county };
  }

  return { markets: DEFAULT_MARKETS, county };
};

const isFresh = (computedAt?: any) => {
  const date = computedAt?.toDate?.() ?? (computedAt instanceof Date ? computedAt : null);
  if (!date) return false;
  return (Date.now() - date.getTime()) < RANGE_CACHE_MINUTES * 60 * 1000;
};

const toPointMap = (prices: Awaited<ReturnType<typeof getMarketPrices>>) => {
  const grouped = new Map<string, { retailSum: number; wholesaleSum: number; count: number }>();
  prices.forEach((item) => {
    const key = toDateKey(item.date);
    const prev = grouped.get(key) ?? { retailSum: 0, wholesaleSum: 0, count: 0 };
    prev.retailSum += Number(item.retail ?? 0);
    prev.wholesaleSum += Number(item.wholesale ?? 0);
    prev.count += 1;
    grouped.set(key, prev);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({
      date,
      retail: value.count ? value.retailSum / value.count : 0,
      wholesale: value.count ? value.wholesaleSum / value.count : 0,
    }));
};

export async function resolveCoopFocus(orgId: string) {
  const [topCrops, marketInfo] = await Promise.all([readOrgTopCrops(orgId), readOrgMarkets(orgId)]);
  return {
    topCrops,
    markets: marketInfo.markets,
    county: marketInfo.county,
  };
}

export async function loadOrRefreshHistory(params: {
  orgId: string;
  crop: string;
  market: string;
  range: "7d" | "30d";
  forceRefresh?: boolean;
}) {
  const { orgId, crop, market, range, forceRefresh } = params;
  const historyId = `${slug(crop)}_${slug(market)}_${range}`;
  const historyRef = doc(db, "orgs", orgId, "priceHistory", historyId);
  const historySnap = await getDoc(historyRef);

  if (historySnap.exists() && !forceRefresh && isFresh((historySnap.data() as any).computedAt)) {
    return (historySnap.data() as any).points as PricePoint[];
  }

  const days = range === "7d" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const marketPrices = await getMarketPrices({
    commodity: crop,
    market,
    startDate,
    endDate: new Date(),
    limitCount: 200,
  });

  const points = toPointMap(marketPrices);

  await setDoc(
    historyRef,
    {
      commodity: crop,
      market,
      pricetype: "both",
      points,
      range,
      computedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return points;
}

export async function refreshGroupPriceData(params: {
  orgId: string;
  crops: string[];
  markets: string[];
  forceRefresh?: boolean;
}) {
  const { orgId, crops, markets, forceRefresh } = params;
  await syncMarketForecastWithFallback();

  const rows: PriceTableRow[] = [];
  const alerts: PriceAlert[] = [];
  const recommendationsByCrop = new Map<string, Array<{ market: string; retail: number; wholesale: number; scoreRetail: number; scoreWholesale: number }>>();

  await Promise.all(
    crops.flatMap((crop) =>
      markets.map(async (market) => {
        const points30 = await loadOrRefreshHistory({ orgId, crop, market, range: "30d", forceRefresh });
        if (!points30.length) return;

        const latest = points30[points30.length - 1];
        const points7 = points30.slice(-7);
        const avg7Retail = average(points7.map((p) => p.retail));
        const avg30Retail = average(points30.map((p) => p.retail));
        const change7Retail = percentileChange(latest.retail, avg7Retail);
        const change30Retail = percentileChange(latest.retail, avg30Retail);

        const avg7Wholesale = average(points7.map((p) => p.wholesale));
        const avg30Wholesale = average(points30.map((p) => p.wholesale));
        const change7Wholesale = percentileChange(latest.wholesale, avg7Wholesale);

        const idBase = `${slug(crop)}_${slug(market)}`;
        const latestDate = latest.date;

        await setDoc(
          doc(db, "orgs", orgId, "priceSignals", `${idBase}_retail`),
          {
            commodity: crop,
            market,
            pricetype: "retail",
            unit: "kg",
            latestPrice: latest.retail,
            latestDate,
            source: "oracle",
            marketKey: market,
            change7d: change7Retail,
            change30d: change30Retail,
            lastUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await setDoc(
          doc(db, "orgs", orgId, "priceSignals", `${idBase}_wholesale`),
          {
            commodity: crop,
            market,
            pricetype: "wholesale",
            unit: "kg",
            latestPrice: latest.wholesale,
            latestDate,
            source: "oracle",
            marketKey: market,
            change7d: change7Wholesale,
            change30d: percentileChange(latest.wholesale, avg30Wholesale),
            lastUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const row: PriceTableRow = {
          id: idBase,
          crop,
          market,
          retail: latest.retail,
          wholesale: latest.wholesale,
          change7d: change7Retail,
          change30d: change30Retail,
          sparkline: points7.map((p) => p.retail),
          recommendation: recommendationBucket(change7Retail),
          latestDate,
        };
        rows.push(row);

        const retailVol = avg7Retail > 0 ? (stddev(points7.map((p) => p.retail)) / avg7Retail) * 100 : 0;
        const allAlerts: Array<{ value: number; pricetype: "retail" | "wholesale"; window: "7d" | "30d" }> = [
          { value: Math.abs(change7Retail), pricetype: "retail", window: "7d" },
          { value: Math.abs(change30Retail), pricetype: "retail", window: "30d" },
          { value: Math.abs(change7Wholesale), pricetype: "wholesale", window: "7d" },
          { value: retailVol, pricetype: "retail", window: "7d" },
        ];

        for (const metric of allAlerts) {
          let severity: "low" | "medium" | "high" | null = null;
          if (metric.value > 35) severity = "high";
          else if (metric.value > 20) severity = "medium";
          else if (metric.value > 10) severity = "low";
          if (!severity) continue;

          const alertId = `${idBase}_${metric.pricetype}_${metric.window}`;
          const reason = `Price moved ${metric.value.toFixed(1)}% in ${metric.window}.`;
          const alert: PriceAlert = {
            id: alertId,
            commodity: crop,
            market,
            pricetype: metric.pricetype,
            severity,
            reason,
            changePct: Number(metric.value.toFixed(2)),
            window: metric.window,
            resolved: false,
          };
          alerts.push(alert);

          await setDoc(
            doc(db, "orgs", orgId, "priceAlerts", alertId),
            {
              ...alert,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        const marketCounty = KENYA_MARKET_COUNTY[market] ?? null;
        const distancePenalty = marketCounty ? 0 : 5;
        const scoreRetail = latest.retail - distancePenalty;
        const scoreWholesale = latest.wholesale - distancePenalty;

        const list = recommendationsByCrop.get(crop) ?? [];
        list.push({ market, retail: latest.retail, wholesale: latest.wholesale, scoreRetail, scoreWholesale });
        recommendationsByCrop.set(crop, list);
      })
    )
  );

  const recommendations: MarketRecommendation[] = [];
  for (const [crop, options] of recommendationsByCrop.entries()) {
    const ranked = [...options].sort((a, b) => b.scoreWholesale - a.scoreWholesale);
    if (!ranked.length) continue;
    const best = ranked[0];
    const second = ranked[1];
    const expectedGain = best.scoreWholesale - (second?.scoreWholesale ?? best.scoreWholesale);
    const recommendation: MarketRecommendation = {
      crop,
      market: best.market,
      basis: "wholesale",
      expectedGain: Number(expectedGain.toFixed(2)),
      explanation: `Highest adjusted wholesale value${second ? `, about KES ${expectedGain.toFixed(1)}/kg above ${second.market}` : ""}.`,
    };
    recommendations.push(recommendation);
    await setDoc(
      doc(db, "orgs", orgId, "recommendations", slug(crop)),
      {
        ...recommendation,
        computedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { rows, alerts, recommendations };
}

export async function readCachedDashboard(orgId: string) {
  const [signalsSnap, alertsSnap, recSnap] = await Promise.all([
    getDocs(collection(db, "orgs", orgId, "priceSignals")),
    getDocs(query(collection(db, "orgs", orgId, "priceAlerts"), where("resolved", "==", false))),
    getDocs(collection(db, "orgs", orgId, "recommendations")),
  ]);

  const grouped = new Map<string, Partial<PriceTableRow>>();
  signalsSnap.forEach((snap) => {
    const data = snap.data() as any;
    const key = `${data.commodity}_${data.market}`;
    const prev = grouped.get(key) ?? {
      id: key,
      crop: data.commodity,
      market: data.market,
      recommendation: "good" as const,
      sparkline: [],
      change7d: 0,
      change30d: 0,
      latestDate: data.latestDate,
    };
    if (data.pricetype === "retail") {
      prev.retail = Number(data.latestPrice ?? 0);
      prev.change7d = Number(data.change7d ?? 0);
      prev.change30d = Number(data.change30d ?? 0);
    }
    if (data.pricetype === "wholesale") {
      prev.wholesale = Number(data.latestPrice ?? 0);
    }
    grouped.set(key, prev);
  });

  const rows = Array.from(grouped.values()).map((item) => ({
    id: item.id as string,
    crop: item.crop as string,
    market: item.market as string,
    retail: Number(item.retail ?? 0),
    wholesale: Number(item.wholesale ?? 0),
    change7d: Number(item.change7d ?? 0),
    change30d: Number(item.change30d ?? 0),
    sparkline: [],
    recommendation: recommendationBucket(Number(item.change7d ?? 0)),
    latestDate: (item.latestDate as string) ?? toDateKey(),
  }));

  const alerts: PriceAlert[] = alertsSnap.docs.map((snap) => ({ id: snap.id, ...(snap.data() as Omit<PriceAlert, "id">) }));
  const recommendations: MarketRecommendation[] = recSnap.docs.map((snap) => snap.data() as MarketRecommendation);
  return { rows, alerts, recommendations };
}

export async function loadHistoryForRow(params: { orgId: string; crop: string; market: string; range: "7d" | "30d" }) {
  return loadOrRefreshHistory({ ...params, forceRefresh: false });
}

export const formatDateLabel = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const toTimestampDate = (value: any) => {
  if (value?.toDate) return value.toDate() as Date;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

