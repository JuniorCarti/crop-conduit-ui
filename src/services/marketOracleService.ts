import { collection, doc, getDoc, getDocs, setDoc, query, where, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMarketPrices, syncMarketForecastWithFallback } from "@/services/marketPriceService";

export type SupportedCommodity = "Tomatoes" | "Onions" | "Irish Potato" | "Kale" | "Cabbage";

export type PredictionRequest = {
  date: string;
  admin1: string;
  market: string;
  commodity: string;
  pricetype: "retail" | "wholesale";
  previous_month_price: number;
};

export type PredictionResponse = {
  date?: string;
  admin1?: string;
  market?: string;
  commodity?: string;
  unit?: string;
  prediction_per_kg?: number;
  predicted_price?: number;
  retail?: number;
  wholesale?: number;
  unreasonable?: boolean;
  confidence_pct?: number;
  lower_bound?: number;
  upper_bound?: number;
  note?: string;
  [key: string]: any;
};

export type MarketOracleError = {
  message: string;
  status?: number;
  details?: any;
};

export type MarketSnapshotItem = {
  crop: string;
  unit: string;
  price: number;
  trend: "up" | "down" | "flat";
  lastUpdated?: any;
};

export type MarketSnapshot = {
  date: string;
  market: string;
  priceType: "retail" | "wholesale";
  items: MarketSnapshotItem[];
  updatedAt?: any;
  source: "market-oracle";
};

const HOURS_6_MS = 6 * 60 * 60 * 1000;

const toDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const normalizeMarketKey = (market: string) => market.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const getSnapshotDocId = (date: string, market: string, priceType: string) => {
  return `${date}_${normalizeMarketKey(market)}_${priceType}`;
};

const isFresh = (updatedAt?: any) => {
  const updated = updatedAt?.toDate ? updatedAt.toDate().getTime() : updatedAt instanceof Date ? updatedAt.getTime() : null;
  if (!updated) return false;
  return Date.now() - updated < HOURS_6_MS;
};

const computeTrend = (current: number, previous?: number | null): "up" | "down" | "flat" => {
  if (!previous || previous <= 0) return "flat";
  const diff = (current - previous) / previous;
  if (diff > 0.02) return "up";
  if (diff < -0.02) return "down";
  return "flat";
};

const SUPPORTED_MARKETS_BY_REGION: Record<string, string[]> = {
  Nairobi: ["Wakulima (Nairobi)", "Dandora (Nairobi)"],
  Coast: ["Kongowea (Mombasa)"],
  Nyanza: ["Kisumu"],
  "Rift Valley": ["Nakuru"],
  Central: ["Nakuru"],
  Eastern: ["Nakuru"],
  "North Eastern": ["Nakuru"],
};

const MARKET_ALIASES: Record<string, string> = {
  "wakulima": "Wakulima (Nairobi)",
  "wakulima (nairobi)": "Wakulima (Nairobi)",
  "dandora": "Dandora (Nairobi)",
  "marikiti": "Dandora (Nairobi)",
  "dandora (nairobi)": "Dandora (Nairobi)",
  "kongowea": "Kongowea (Mombasa)",
  "kongowea (mombasa)": "Kongowea (Mombasa)",
  "mombasa market": "Kongowea (Mombasa)",
  "kisumu": "Kisumu",
  "kisumu market": "Kisumu",
  "nakuru": "Nakuru",
  "nakuru market": "Nakuru",
};

const SUPPORTED_COMMODITIES: SupportedCommodity[] = [
  "Tomatoes",
  "Onions",
  "Irish Potato",
  "Kale",
  "Cabbage",
];

export function getSupportedCommodities() {
  return [...SUPPORTED_COMMODITIES];
}

export function getSupportedMarkets(admin1?: string) {
  if (admin1 && SUPPORTED_MARKETS_BY_REGION[admin1]) {
    return [...SUPPORTED_MARKETS_BY_REGION[admin1]];
  }
  const markets = new Set<string>();
  Object.values(SUPPORTED_MARKETS_BY_REGION).forEach((list) => {
    list.forEach((market) => markets.add(market));
  });
  return Array.from(markets);
}

export function normalizeMarket(market: string, admin1?: string) {
  const trimmed = (market || "").trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  const alias = MARKET_ALIASES[key];
  if (alias) return alias;
  const supported = getSupportedMarkets(admin1);
  const exact = supported.find((item) => item.toLowerCase() === key);
  if (exact) return exact;
  return null;
}

export async function predictMarketPrice(
  request: PredictionRequest
): Promise<PredictionResponse> {
  const baseUrl = import.meta.env.VITE_RENDER_API_URL || import.meta.env.VITE_MARKET_API_URL;
  if (!baseUrl) {
    throw { message: "Market oracle API URL not configured." } as MarketOracleError;
  }

  const endpoint = baseUrl.includes("/predict") ? baseUrl : `${baseUrl}/predict`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw {
        message: "Market oracle request failed.",
        status: response.status,
        details: text,
      } as MarketOracleError;
    }

    return (await response.json()) as PredictionResponse;
  } catch (error: any) {
    if (error?.message) {
      throw error;
    }
    throw {
      message: "Unable to reach market oracle.",
      details: error,
    } as MarketOracleError;
  }
}

export async function getMarketPricesToday(params: {
  orgId: string;
  market: string;
  crops: string[];
  priceType: "retail" | "wholesale";
}) {
  const date = toDateKey();
  const snapshotId = getSnapshotDocId(date, params.market, params.priceType);
  const snapshotRef = doc(db, "orgs", params.orgId, "marketSnapshots", snapshotId);
  const snapshotSnap = await getDoc(snapshotRef);

  if (snapshotSnap.exists() && isFresh(snapshotSnap.data()?.updatedAt)) {
    return snapshotSnap.data() as MarketSnapshot;
  }

  await syncMarketForecastWithFallback();

  const items: MarketSnapshotItem[] = [];
  for (const crop of params.crops) {
    const prices = await getMarketPrices({ commodity: crop, market: params.market, limitCount: 1 });
    if (!prices.length) continue;
    const priceDoc = prices[0];
    const price = params.priceType === "wholesale" ? priceDoc.wholesale : priceDoc.retail;
    items.push({
      crop,
      unit: "kg",
      price,
      trend: "flat",
      lastUpdated: Timestamp.fromDate(priceDoc.updatedAt ?? priceDoc.date ?? new Date()),
    });
  }

  // compute trends from previous day snapshot if available
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayId = getSnapshotDocId(toDateKey(yesterday), params.market, params.priceType);
  const yesterdaySnap = await getDoc(doc(db, "orgs", params.orgId, "marketSnapshots", yesterdayId));
  const previousItems = yesterdaySnap.exists() ? (yesterdaySnap.data()?.items ?? []) : [];

  const previousMap = new Map<string, number>();
  for (const item of previousItems) {
    if (item?.crop && typeof item.price === "number") {
      previousMap.set(item.crop, item.price);
    }
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    trend: computeTrend(item.price, previousMap.get(item.crop)),
  }));

  const snapshot: MarketSnapshot = {
    date,
    market: params.market,
    priceType: params.priceType,
    items: normalizedItems,
    updatedAt: serverTimestamp(),
    source: "market-oracle",
  };

  await setDoc(snapshotRef, snapshot, { merge: true });
  return snapshot;
}

export async function resolveOrgCropsAndMarket(orgId: string) {
  const orgSnap = await getDoc(doc(db, "orgs", orgId));
  const orgData = orgSnap.exists() ? (orgSnap.data() as any) : {};
  const focusCrops: string[] = orgData.focusCrops ?? orgData.settings?.preferredCrops ?? [];
  const defaultMarket: string | null = orgData.defaultMarket ?? orgData.settings?.defaultMarket ?? null;

  let crops = focusCrops.filter(Boolean);
  let market = defaultMarket;

  if (!crops.length) {
    const memberSnap = await getDocs(query(collection(db, "orgs", orgId, "members"), where("status", "==", "active")));
    const cropCounts = new Map<string, number>();
    const marketCounts = new Map<string, number>();
    memberSnap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const cropList = [...(data.mainCrops ?? []), ...(data.secondaryCrops ?? [])].filter(Boolean);
      cropList.forEach((crop: string) => cropCounts.set(crop, (cropCounts.get(crop) ?? 0) + 1));
      const preferred = data.preferredMarkets ?? [];
      preferred.forEach((m: string) => marketCounts.set(m, (marketCounts.get(m) ?? 0) + 1));
    });
    crops = Array.from(cropCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crop]) => crop);
    if (!market && marketCounts.size) {
      market = Array.from(marketCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  if (!market) {
    market = "Nakuru Market";
  }

  return { crops, market };
}
