/**
 * Market Oracle Service
 * Handles prediction requests for market prices.
 */

import { normalizeCommodity } from "@/lib/normalizeCommodity";

export const SUPPORTED_COMMODITIES = [
  "tomatoes",
  "cabbage",
  "potatoes",
  "onion",
  "kale",
] as const;

export type SupportedCommodity = (typeof SUPPORTED_COMMODITIES)[number];

const SUPPORTED_MARKETS = [
  { value: "Wakulima (Nairobi)", admin1: "Nairobi", matches: ["wakulima", "nairobi"] },
  { value: "Dandora (Nairobi)", admin1: "Nairobi", matches: ["dandora", "marikiti"] },
  { value: "Kongowea (Mombasa)", admin1: "Coast", matches: ["kongowea", "mombasa"] },
  { value: "Kisumu", admin1: "Nyanza", matches: ["kisumu"] },
  { value: "Nakuru", admin1: "Rift Valley", matches: ["nakuru"] },
] as const;

export interface PredictionRequest {
  date: string;
  admin1: string;
  market: string;
  commodity: SupportedCommodity;
  pricetype: "retail" | "wholesale";
  previous_month_price: number;
}

export interface PredictionResponse {
  commodity: string;
  market: string;
  date: string;
  prediction_per_kg: number;
  unit?: string;
  confidence_pct?: number;
  error_margin?: number;
  lower_bound?: number;
  upper_bound?: number;
  unreasonable?: boolean;
  note?: string;
}

export type MarketOracleError = Error & {
  status?: number;
  details?: string;
  isNetworkError?: boolean;
};

const createMarketOracleError = (
  message: string,
  options?: { status?: number; details?: string; isNetworkError?: boolean }
): MarketOracleError => {
  const error = new Error(message) as MarketOracleError;
  error.name = "MarketOracleError";
  error.status = options?.status;
  error.details = options?.details;
  error.isNetworkError = options?.isNetworkError;
  return error;
};

const resolveMarketApiUrl = (): string => {
  const baseUrl =
    import.meta.env.VITE_MARKET_API_URL ||
    "https://market-forecaster-kenyan-agro-market-621a.onrender.com";
  return `${baseUrl.replace(/\/$/, "")}/predict`;
};

const MARKET_PREDICT_URL = resolveMarketApiUrl();

export function getSupportedCommodities(): SupportedCommodity[] {
  return [...SUPPORTED_COMMODITIES];
}

export function getSupportedMarkets(admin1?: string): string[] {
  if (!admin1) {
    return SUPPORTED_MARKETS.map((market) => market.value);
  }
  const filtered = SUPPORTED_MARKETS.filter((market) => market.admin1 === admin1);
  return (filtered.length ? filtered : SUPPORTED_MARKETS).map((market) => market.value);
}

export { normalizeCommodity };

export function normalizeMarket(value: string, admin1?: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const candidates = admin1
    ? SUPPORTED_MARKETS.filter((market) => market.admin1 === admin1)
    : SUPPORTED_MARKETS;

  const match = candidates.find((market) =>
    market.matches.some((token) => normalized.includes(token))
  );

  if (match) {
    return match.value;
  }

  const exact = SUPPORTED_MARKETS.find(
    (market) => market.value.toLowerCase() === normalized
  );
  return exact ? exact.value : null;
}

export async function predictMarketPrice(
  payload: PredictionRequest
): Promise<PredictionResponse> {
  if (!SUPPORTED_COMMODITIES.includes(payload.commodity)) {
    throw createMarketOracleError("Unsupported commodity", {
      status: 400,
      details: `Allowed: ${SUPPORTED_COMMODITIES.join(", ")}`,
    });
  }

  let response: Response;
  try {
    response = await fetch(MARKET_PREDICT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    throw createMarketOracleError("Network error", {
      isNetworkError: true,
      details: error?.message,
    });
  }

  if (!response.ok) {
    let details = "";
    try {
      const json = await response.json();
      details = json?.message || json?.error || JSON.stringify(json);
    } catch {
      details = await response.text().catch(() => "");
    }

    throw createMarketOracleError("Prediction request failed", {
      status: response.status,
      details: details || response.statusText,
    });
  }

  const data = (await response.json()) as PredictionResponse;
  return data;
}
