import type { Listing } from "@/features/marketplace/models/types";
import {
  getAveragePrice,
  getMarketPrices,
  getStorageCommodityLabel,
  normalizeCommodityForPredict,
} from "@/services/marketPriceService";
import { getSupportedMarkets } from "@/services/marketOracleService";

export type MarketPriceReference = {
  retail?: number;
  wholesale?: number;
  unit: "kg" | "piece" | "crate" | string;
  marketName?: string;
  date?: string;
  source: "oracle" | "cached" | "fallback";
};

const MARKET_CACHE_NAME_MAP: Record<string, string> = {
  "Wakulima (Nairobi)": "Wakulima",
  "Dandora (Nairobi)": "Marikiti (Nairobi)",
  "Kongowea (Mombasa)": "Mombasa Market",
  Kisumu: "Kisumu Market",
  Nakuru: "Nakuru Market",
};

const MARKET_COORDS: Record<string, { lat: number; lng: number }> = {
  "Wakulima (Nairobi)": { lat: -1.2833, lng: 36.8233 },
  "Dandora (Nairobi)": { lat: -1.2667, lng: 36.9000 },
  "Kongowea (Mombasa)": { lat: -4.0435, lng: 39.6720 },
  Kisumu: { lat: -0.0917, lng: 34.7679 },
  Nakuru: { lat: -0.3031, lng: 36.0800 },
};

const resolveAdmin1FromCounty = (county: string): string | null => {
  const normalized = (county || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("nairobi")) return "Nairobi";
  if (normalized.includes("mombasa") || normalized.includes("coast")) return "Coast";
  if (normalized.includes("kisumu") || normalized.includes("nyanza")) return "Nyanza";
  if (normalized.includes("nakuru") || normalized.includes("rift")) return "Rift Valley";
  if (normalized.includes("central")) return "Central";
  if (normalized.includes("eastern")) return "Eastern";
  if (normalized.includes("north eastern")) return "North Eastern";
  return null;
};

const toRad = (value: number) => (value * Math.PI) / 180;

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const pickNearestMarket = (lat: number, lng: number, markets: string[]): string => {
  let best = markets[0];
  let bestDist = Number.POSITIVE_INFINITY;
  markets.forEach((market) => {
    const coords = MARKET_COORDS[market];
    if (!coords) return;
    const dist = distanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = market;
    }
  });
  return best;
};

export async function getMarketPriceReference(
  listing: Listing
): Promise<MarketPriceReference> {
  const log = (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info("[MarketReference]", ...args);
    }
  };

  let canonicalCommodity: ReturnType<typeof normalizeCommodityForPredict>;
  try {
    canonicalCommodity = normalizeCommodityForPredict(listing.cropType || "");
  } catch (error) {
    log("Unsupported commodity for listing", listing.cropType, error);
    return { unit: "kg", source: "fallback" };
  }

  const storageCommodity = getStorageCommodityLabel(canonicalCommodity);
  const admin1 = resolveAdmin1FromCounty(listing.location?.county || "");
  const markets = getSupportedMarkets(admin1 ?? undefined);
  if (!markets.length) {
    log("No supported markets for listing", listing.id);
    return { unit: "kg", source: "fallback" };
  }

  const lat = listing.location?.lat;
  const lng = listing.location?.lng ?? listing.location?.lon;
  const apiMarket = lat != null && lng != null
    ? pickNearestMarket(lat, lng, markets)
    : markets[0];
  const cacheMarket = MARKET_CACHE_NAME_MAP[apiMarket] ?? apiMarket;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);

  let retail: number | undefined;
  let wholesale: number | undefined;
  let date: string | undefined;

  try {
    const history = await getMarketPrices({
      commodity: storageCommodity,
      market: cacheMarket,
      startDate,
      endDate: today,
      limitCount: 7,
    });

    if (history.length > 0) {
      retail = history[0].retail;
      wholesale = history[0].wholesale;
      date = history[0].date?.toISOString();
      log("Using cached market price", cacheMarket, storageCommodity);
      return {
        retail,
        wholesale,
        unit: "kg",
        marketName: cacheMarket,
        date,
        source: "cached",
      };
    }
  } catch (error) {
    log("Market cache lookup failed", error);
  }

  try {
    const average = await getAveragePrice(storageCommodity);
    if (average) {
      retail = average.retail;
      wholesale = average.wholesale;
      log("Using average market price", storageCommodity);
      return {
        retail,
        wholesale,
        unit: "kg",
        marketName: cacheMarket,
        source: "cached",
      };
    }
  } catch (error) {
    log("Average market price lookup failed", error);
  }

  return { unit: "kg", marketName: cacheMarket, source: "fallback" };
}
