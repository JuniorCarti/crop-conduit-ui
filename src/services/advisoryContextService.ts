import { auth } from "@/lib/firebase";
import type { ClimateSignal } from "@/lib/climateInsights";
import { fetchForecast, deriveFrostRisk } from "@/services/weatherProxyService";
import {
  getSupportedMarkets,
  predictMarketPrice,
  type PredictionResponse,
} from "@/services/marketOracleService";
import {
  normalizeCommodityForPredict,
  getStorageCommodityLabel,
  getMarketPrices,
  getAveragePrice,
} from "@/services/marketPriceService";
import type { AdvisoryContext, AdvisoryContextMeta } from "@/types/advisoryContext";

const WEATHER_SOURCE_LABEL = "Weather proxy";
const MARKET_CACHE_NAME_MAP: Record<string, string> = {
  "Wakulima (Nairobi)": "Wakulima",
  "Dandora (Nairobi)": "Marikiti (Nairobi)",
  "Kongowea (Mombasa)": "Mombasa Market",
  Kisumu: "Kisumu Market",
  Nakuru: "Nakuru Market",
};

const resolveAdmin1FromLocation = (county: string, ward?: string): string | null => {
  const normalized = `${county} ${ward ?? ""}`.trim().toLowerCase();
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

const resolveAdmin1FromMarket = (market: string): string => {
  const value = market.toLowerCase();
  if (value.includes("nairobi")) return "Nairobi";
  if (value.includes("mombasa")) return "Coast";
  if (value.includes("kisumu")) return "Nyanza";
  if (value.includes("nakuru")) return "Rift Valley";
  return "Nairobi";
};

const formatTrend = (values: number[]): "up" | "down" | "flat" | "unknown" => {
  if (values.length < 2) return "unknown";
  const first = values[0];
  const last = values[values.length - 1];
  if (first === last) return "flat";
  return last > first ? "up" : "down";
};

const formatDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const buildWeatherHighlights = (daily: AdvisoryContext["weather"]["daily"]) => {
  return daily.slice(0, 3).map((day) => {
    const min = day.minTempC ?? "n/a";
    const max = day.maxTempC ?? "n/a";
    const rain = day.rainChancePct ?? "n/a";
    return `${day.date}: ${min}-${max}C, rain chance ${rain}%`;
  });
};

const deriveWeatherAlerts = (daily: AdvisoryContext["weather"]["daily"]) => {
  const alerts: AdvisoryContext["weather"]["alerts"] = [];
  if (daily.length === 0) return alerts;

  const minTemp = Math.min(...daily.map((d) => d.minTempC ?? 99));
  const maxTemp = Math.max(...daily.map((d) => d.maxTempC ?? -99));
  const avgRainChance =
    daily.length > 0
      ? daily.reduce((sum, d) => sum + (d.rainChancePct ?? 0), 0) / daily.length
      : 0;
  const totalRain =
    daily.length > 0 ? daily.reduce((sum, d) => sum + (d.rainMm ?? 0), 0) : 0;

  if (minTemp <= 5) {
    alerts.push({
      type: "frost",
      level: minTemp <= 2 ? "high" : "medium",
      message: `Frost risk: minimum forecast temperature ${minTemp}C.`,
    });
  }

  if (totalRain >= 20 || avgRainChance >= 60) {
    alerts.push({
      type: "rain",
      level: totalRain >= 30 ? "high" : "medium",
      message: `Heavy rain potential: ${Math.round(totalRain)}mm over forecast window.`,
    });
  }

  if (maxTemp >= 32) {
    alerts.push({
      type: "heat",
      level: maxTemp >= 35 ? "high" : "medium",
      message: `Heat stress risk: peak temperature ${maxTemp}C.`,
    });
  }

  return alerts;
};

const buildSprayAlerts = (signals?: ClimateSignal[]) => {
  if (!signals?.length) return [];
  const spraySignal = signals.find((signal) => signal.id === "spray-suitability");
  if (!spraySignal) return [];
  const level =
    spraySignal.level === "good"
      ? "low"
      : spraySignal.level === "warning"
      ? "medium"
      : "high";
  return [
    {
      type: "spray" as const,
      level,
      message: spraySignal.observations.join(" "),
    },
  ];
};

const computePreviousMonthPrice = async (commodity: string, market: string) => {
  const startPrev = new Date();
  startPrev.setDate(1);
  startPrev.setMonth(startPrev.getMonth() - 1);
  const endPrev = new Date(startPrev);
  endPrev.setMonth(endPrev.getMonth() + 1);
  endPrev.setDate(0);

  const history = await getMarketPrices({
    commodity,
    market,
    startDate: startPrev,
    endDate: endPrev,
    limitCount: 31,
  });

  if (history.length > 0) {
    const values = history
      .map((item) => item.retail || item.wholesale)
      .filter((value) => typeof value === "number" && value > 0) as number[];
    if (values.length) {
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }

  const avg = await getAveragePrice(commodity, startPrev);
  if (avg?.retail) return avg.retail;
  if (avg?.wholesale) return avg.wholesale;
  return null;
};

const computeMarketTrend = (prices: Array<{ date: Date; retail: number; wholesale: number }>) => {
  if (prices.length < 2) return "unknown" as const;
  const sorted = [...prices].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((item) => item.retail || item.wholesale).filter((value) => value > 0);
  return formatTrend(values);
};

export async function getAdvisoryContext(
  crop: { name: string; stage: string },
  location: { county: string; ward: string; lat: number; lng: number },
  language: "en" | "sw",
  options?: { signals?: ClimateSignal[]; onProgress?: (step: "weather" | "market") => void }
): Promise<{ context: AdvisoryContext; meta: AdvisoryContextMeta }> {
  const dataQuality = {
    weatherOk: true,
    marketOk: true,
    messages: [] as string[],
  };

  options?.onProgress?.("weather");
  const weatherPromise = (async () => {
    const forecast = await fetchForecast({
      lat: location.lat,
      lon: location.lng,
      days: 7,
    });
    const frostRisk = deriveFrostRisk(forecast);

    const daily = forecast.forecast.forecastday.slice(0, 7).map((day) => ({
      date: day.date,
      minTempC: day.day.mintemp_c ?? null,
      maxTempC: day.day.maxtemp_c ?? null,
      rainChancePct: day.day.daily_chance_of_rain ?? null,
      rainMm: day.day.totalprecip_mm ?? null,
      windKph: day.day.maxwind_kph ?? null,
    }));

    const alerts = [
      ...deriveWeatherAlerts(daily),
      ...buildSprayAlerts(options?.signals),
    ];

    const avgMax =
      daily.length > 0
        ? Math.round(daily.reduce((sum, d) => sum + (d.maxTempC ?? 0), 0) / daily.length)
        : null;
    const totalRain =
      daily.length > 0 ? Math.round(daily.reduce((sum, d) => sum + (d.rainMm ?? 0), 0)) : null;
    const summary = `7-day forecast: avg max ${avgMax ?? "n/a"}C, total rain ${totalRain ?? "n/a"}mm, frost risk ${frostRisk.riskLevel}.`;

    return {
      weather: {
        summary,
        daily,
        alerts,
      },
      weatherTimestamp: forecast.location.localtime ?? null,
    };
  })();

  options?.onProgress?.("market");
  const marketPromise = (async () => {
    const admin1 = resolveAdmin1FromLocation(location.county, location.ward);
    const markets = getSupportedMarkets(admin1 ?? undefined).map((apiMarket) => ({
      apiMarket,
      cacheMarket: MARKET_CACHE_NAME_MAP[apiMarket] ?? apiMarket,
    }));
    const canonicalCommodity = normalizeCommodityForPredict(crop.name);
    const storageCommodity = getStorageCommodityLabel(canonicalCommodity);

    if (!auth.currentUser) {
      return {
        market: {
          topMarkets: [],
          bestMarket: null,
          notes: "Login required to load cached market prices.",
        },
        marketTimestamp: null,
        marketHighlights: [] as string[],
        ok: false,
        message: "Login required to load cached market prices.",
      };
    }

    const today = new Date();
    const start7d = new Date(today);
    start7d.setDate(today.getDate() - 6);

    const topMarkets: AdvisoryContext["market"]["topMarkets"] = [];

    for (const market of markets) {
      const admin1ForMarket = resolveAdmin1FromMarket(market.apiMarket);
      const history = await getMarketPrices({
        commodity: storageCommodity,
        market: market.cacheMarket,
        startDate: start7d,
        endDate: today,
        limitCount: 7,
      });

      const previousMonthPrice = await computePreviousMonthPrice(
        storageCommodity,
        market.cacheMarket
      );

      let retail: number | null = null;
      let wholesale: number | null = null;
      let predictedAt: string | null = null;

      if (previousMonthPrice) {
        try {
          const retailRes: PredictionResponse = await predictMarketPrice({
            date: today.toISOString().slice(0, 10),
            admin1: admin1ForMarket,
            market: market.apiMarket,
            commodity: canonicalCommodity,
            pricetype: "retail",
            previous_month_price: previousMonthPrice,
          });
          const wholesaleRes: PredictionResponse = await predictMarketPrice({
            date: today.toISOString().slice(0, 10),
            admin1: admin1ForMarket,
            market: market.apiMarket,
            commodity: canonicalCommodity,
            pricetype: "wholesale",
            previous_month_price: previousMonthPrice,
          });
          retail = retailRes.prediction_per_kg ?? null;
          wholesale = wholesaleRes.prediction_per_kg ?? null;
          predictedAt = today.toISOString();
        } catch {
          // Prediction failures fall back to cached data below.
        }
      }

      if (!retail && history.length > 0) {
        retail = history[0].retail || history[0].wholesale || null;
      }
      if (!wholesale && history.length > 0) {
        wholesale = history[0].wholesale || history[0].retail || null;
      }

      const trend = history.length
        ? computeMarketTrend(history.map((item) => ({
            date: item.date,
            retail: item.retail,
            wholesale: item.wholesale,
          })))
        : "unknown";

      if (retail || wholesale) {
        topMarkets.push({
          market: market.cacheMarket,
          admin1: admin1ForMarket,
          retail,
          wholesale,
          lastUpdated: formatDate(predictedAt || history[0]?.date) ?? null,
          trend7d: trend,
        });
      }
    }

    const best = topMarkets
      .filter((item) => typeof item.retail === "number" || typeof item.wholesale === "number")
      .sort((a, b) => (b.retail ?? b.wholesale ?? 0) - (a.retail ?? a.wholesale ?? 0))[0];

    const topMarketsSlice = topMarkets.slice(0, 3);
    const marketHighlights = topMarketsSlice.map((item) => {
      const value = item.retail ?? item.wholesale;
      const priceText = typeof value === "number" ? `${Math.round(value)} KSh/kg` : "n/a";
      const ts = item.lastUpdated ? ` - ${item.lastUpdated}` : "";
      return `${item.market}: ${priceText} (${item.trend7d ?? "unknown"} trend)${ts}`;
    });

    const marketTimestamp = topMarketsSlice[0]?.lastUpdated ?? null;

    return {
      market: {
        topMarkets: topMarketsSlice,
        bestMarket: best
          ? {
              market: best.market,
              admin1: best.admin1,
              netPrice: best.retail ?? best.wholesale ?? null,
              pricetype: best.retail != null ? "retail" : "wholesale",
            }
          : null,
        notes: topMarkets.length
          ? "Top markets ranked by latest available price."
          : "Market data unavailable.",
      },
      marketTimestamp,
      marketHighlights,
      ok: topMarkets.length > 0,
      message: topMarkets.length > 0 ? "" : "Market data unavailable.",
    };
  })();

  const [weatherResult, marketResult] = await Promise.allSettled([weatherPromise, marketPromise]);

  let weather: AdvisoryContext["weather"] = { summary: "", daily: [], alerts: [] };
  let weatherTimestamp: string | null = null;
  if (weatherResult.status === "fulfilled") {
    weather = weatherResult.value.weather;
    weatherTimestamp = weatherResult.value.weatherTimestamp;
  } else {
    dataQuality.weatherOk = false;
    dataQuality.messages.push("Weather data unavailable.");
    weather = {
      summary: "Weather data unavailable.",
      daily: [],
      alerts: [],
    };
  }

  let market: AdvisoryContext["market"] = { topMarkets: [], bestMarket: null, notes: "" };
  let marketTimestamp: string | null = null;
  let marketHighlights: string[] = [];
  if (marketResult.status === "fulfilled") {
    market = marketResult.value.market;
    marketTimestamp = marketResult.value.marketTimestamp;
    marketHighlights = marketResult.value.marketHighlights;
    if (!marketResult.value.ok && marketResult.value.message) {
      dataQuality.marketOk = false;
      dataQuality.messages.push(marketResult.value.message);
    }
  } else {
    dataQuality.marketOk = false;
    dataQuality.messages.push("Market data unavailable.");
    market = {
      topMarkets: [],
      bestMarket: null,
      notes: "Market data unavailable.",
    };
  }

  if (!dataQuality.weatherOk && !dataQuality.marketOk) {
    throw new Error("Weather and market data are unavailable. Please try again.");
  }

  const context: AdvisoryContext = {
    language,
    farm: {
      county: location.county,
      ward: location.ward,
      lat: location.lat,
      lng: location.lng,
    },
    crop: {
      name: crop.name,
      stage: crop.stage,
    },
    weather,
    market,
    dataQuality,
  };

  const locationName = [location.county, location.ward].filter(Boolean).join(", ");
  const meta: AdvisoryContextMeta = {
    locationName,
    weatherHighlights: buildWeatherHighlights(weather.daily),
    weatherSource: WEATHER_SOURCE_LABEL,
    weatherTimestamp,
    marketHighlights,
    marketTimestamp,
    dataQualityMessages: dataQuality.messages,
  };

  return { context, meta };
}
