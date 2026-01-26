/**
 * Market recommendations helper.
 */

import type { MarketPrice } from "@/services/marketPriceService";
import { normalizeCommodity } from "@/lib/normalizeCommodity";

export type MarketRecommendationFilters = {
  commodity?: string;
  region?: string;
  pricetype?: "retail" | "wholesale";
  limit?: number;
};

export type MarketRecommendation = {
  market: string;
  commodity: string;
  county?: string;
  price: number;
  updatedAt?: Date;
  isBest: boolean;
  reasonKey: "market.recommendations.reasons.bestPrice" | "market.recommendations.reasons.goodDemand";
};

const toDate = (value: Date | string | undefined): Date | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
};

const pickPrice = (price: MarketPrice, pricetype?: "retail" | "wholesale") => {
  if (pricetype === "wholesale") {
    return price.wholesale || 0;
  }
  if (pricetype === "retail") {
    return price.retail || 0;
  }
  return price.retail || price.wholesale || 0;
};

export function getRecommendedMarkets(
  prices: MarketPrice[],
  filters: MarketRecommendationFilters
): MarketRecommendation[] {
  const normalizedCommodity = filters.commodity ? normalizeCommodity(filters.commodity) : null;
  const region = filters.region?.toLowerCase();

  const filtered = prices.filter((price) => {
    const priceCommodity = normalizeCommodity(price.commodity || "");
    const commodityMatch = normalizedCommodity ? priceCommodity === normalizedCommodity : true;
    const regionMatch = region ? (price.county || "").toLowerCase() === region : true;
    return commodityMatch && regionMatch;
  });

  const byMarket = new Map<
    string,
    { price: number; updatedAt?: Date; commodity: string; county?: string }
  >();

  filtered.forEach((price) => {
    const value = pickPrice(price, filters.pricetype);
    if (!value || value <= 0) return;

    const updatedAt = toDate(price.updatedAt || price.date);
    const existing = byMarket.get(price.market);

    if (!existing) {
      byMarket.set(price.market, {
        price: value,
        updatedAt,
        commodity: price.commodity,
        county: price.county,
      });
      return;
    }

    const existingTime = existing.updatedAt?.getTime() ?? 0;
    const nextTime = updatedAt?.getTime() ?? 0;

    if (nextTime > existingTime) {
      byMarket.set(price.market, {
        price: value,
        updatedAt,
        commodity: price.commodity,
        county: price.county,
      });
      return;
    }

    if (nextTime === existingTime && value > existing.price) {
      byMarket.set(price.market, {
        price: value,
        updatedAt,
        commodity: price.commodity,
        county: price.county,
      });
    }
  });

  const ranked = Array.from(byMarket.entries())
    .map(([market, data]) => ({
      market,
      ...data,
    }))
    .sort((a, b) => b.price - a.price);

  const limited = ranked.slice(0, filters.limit || 3);

  return limited.map((entry, index) => ({
    market: entry.market,
    commodity: entry.commodity,
    county: entry.county,
    price: entry.price,
    updatedAt: entry.updatedAt,
    isBest: index === 0,
    reasonKey: index === 0
      ? "market.recommendations.reasons.bestPrice"
      : "market.recommendations.reasons.goodDemand",
  }));
}
