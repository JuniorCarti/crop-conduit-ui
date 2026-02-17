import { useEffect, useMemo, useState } from "react";
import { getMarketPrices, normalizeCommodityForPredict, getStorageCommodityLabel } from "@/services/marketPriceService";
import marketHubs from "@/data/market_hubs_ke.json";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";

export type MarketOpportunityPoint = {
  market: string;
  label: string;
  lat: number;
  lon: number;
  pricePerKg: number;
  trend: "up" | "down" | "flat";
  distanceKm: number;
  score: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: MarketOpportunityPoint[] }>();

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

const supportedDefaultCrop = "Tomatoes";

function mapCropForMarketService(cropFilter: string) {
  if (!cropFilter || cropFilter === "all") return supportedDefaultCrop;
  try {
    const normalized = normalizeCommodityForPredict(cropFilter);
    return getStorageCommodityLabel(normalized);
  } catch {
    return supportedDefaultCrop;
  }
}

export function useMarketOpportunity(params: {
  enabled: boolean;
  cropFilter: string;
  plottedMembers: MemberMapPoint[];
}) {
  const { enabled, cropFilter, plottedMembers } = params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<MarketOpportunityPoint[]>([]);

  const center = useMemo(() => {
    if (!plottedMembers.length) return null;
    const totals = plottedMembers.reduce(
      (acc, row) => ({ accLat: acc.accLat + Number(row.lat), accLon: acc.accLon + Number(row.lon) }),
      { accLat: 0, accLon: 0 }
    );
    return { lat: totals.accLat / plottedMembers.length, lon: totals.accLon / plottedMembers.length };
  }, [plottedMembers]);

  useEffect(() => {
    if (!enabled || !center) {
      setPoints([]);
      setError(null);
      setLoading(false);
      return;
    }
    const crop = mapCropForMarketService(cropFilter);
    const cacheKey = `${crop}:${center.lat.toFixed(2)}:${center.lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setPoints(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all(
      (marketHubs as any[]).map(async (hub) => {
        const history = await getMarketPrices({ commodity: crop, market: hub.label, limitCount: 2 });
        if (!history.length) return null;
        const current = Number(history[0].retail ?? 0);
        if (!Number.isFinite(current) || current <= 0) return null;
        const prev = Number(history[1]?.retail ?? current);
        const trend = current > prev * 1.02 ? "up" : current < prev * 0.98 ? "down" : "flat";
        const dist = distanceKm(center.lat, center.lon, Number(hub.lat), Number(hub.lon));
        const score = current - dist * 0.45;
        return {
          market: hub.name,
          label: hub.label,
          lat: Number(hub.lat),
          lon: Number(hub.lon),
          pricePerKg: current,
          trend,
          distanceKm: dist,
          score,
        } as MarketOpportunityPoint;
      })
    )
      .then((rows) => {
        if (!active) return;
        const ranked = rows.filter(Boolean).sort((a: any, b: any) => b.score - a.score).slice(0, 3) as MarketOpportunityPoint[];
        setPoints(ranked);
        cache.set(cacheKey, { at: Date.now(), data: ranked });
        setError(ranked.length ? null : "Market data unavailable");
      })
      .catch(() => {
        if (!active) return;
        setPoints([]);
        setError("Market data unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, cropFilter, center]);

  return {
    loading,
    error,
    points,
    bestMarket: points[0] ?? null,
  };
}
