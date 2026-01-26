import { useQuery } from "@tanstack/react-query";
import type {
  AdvisoryContext,
  AdvisoryResponse,
  AdvisoryMarketSummary,
  AdvisoryRiskSummary,
  AdvisoryForecastSummary,
} from "@/types/advisory";
import { generateAdvisory } from "@/services/advisoryAiService";
import {
  predictMarketPrice,
  type SupportedCommodity,
  type PredictionResponse,
} from "@/services/marketOracleService";
import type { WeatherApiForecast, FrostRiskSummary, RainfallOutlook } from "@/services/weatherProxyService";

export type AdvisoryAiInput = {
  farmId: string | null;
  cropId: string | null;
  language: "en" | "sw";
  location: {
    name: string | null;
    county: string | null;
    ward: string | null;
    lat: number | null;
    lon: number | null;
  };
  crop: {
    name: string | null;
    plantingDate: string | null;
    growthStage: string | null;
  };
  forecast: WeatherApiForecast | null;
  frostRisk: FrostRiskSummary | null;
  rainfallOutlook: RainfallOutlook | null;
  marketInput?: {
    commodity: SupportedCommodity;
    admin1: string;
    market: string;
    previousMonthPrice: number;
    pricetype?: "retail" | "wholesale";
  } | null;
  marketSummary?: AdvisoryMarketSummary | null;
  dateKey?: string;
  enabled?: boolean;
};

const toFixedOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" ? Number(value.toFixed(2)) : null;

const computeRainRisk = (
  totalMm: number | null,
  avgChancePct: number | null
): AdvisoryRiskSummary["rainRiskLevel"] => {
  if (totalMm == null || avgChancePct == null) return null;
  if (totalMm >= 20 || avgChancePct >= 60) return "High";
  if (totalMm >= 10 || avgChancePct >= 40) return "Medium";
  return "Low";
};

const buildForecastSummary = (
  forecast: WeatherApiForecast | null
): AdvisoryForecastSummary => {
  if (!forecast) {
    return { days: [], totalRainMm: null, avgRainChancePct: null };
  }

  const days = forecast.forecast.forecastday.slice(0, 7).map((day) => ({
    date: day.date,
    minTempC: toFixedOrNull(day.day.mintemp_c),
    maxTempC: toFixedOrNull(day.day.maxtemp_c),
    rainMm: toFixedOrNull(day.day.totalprecip_mm),
    rainChancePct: toFixedOrNull(day.day.daily_chance_of_rain),
  }));

  const totalRainMm =
    days.length > 0
      ? days.reduce((sum, item) => sum + (item.rainMm ?? 0), 0)
      : null;
  const avgRainChancePct =
    days.length > 0
      ? days.reduce((sum, item) => sum + (item.rainChancePct ?? 0), 0) / days.length
      : null;

  return {
    days,
    totalRainMm: totalRainMm == null ? null : Number(totalRainMm.toFixed(2)),
    avgRainChancePct:
      avgRainChancePct == null ? null : Number(avgRainChancePct.toFixed(2)),
  };
};

export function useAdvisoryAi(params: AdvisoryAiInput) {
  const dateKey = params.dateKey ?? new Date().toISOString().slice(0, 10);
  const queryKey = [
    "advisoryAi",
    params.farmId,
    params.cropId ?? "none",
    dateKey,
    params.language,
  ];

  return useQuery<AdvisoryResponse>({
    queryKey,
    enabled: params.enabled ?? false,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 15,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    queryFn: async () => {
      const forecastSummary = buildForecastSummary(params.forecast);
      const contextNotes: string[] = [];

      if (params.location.lat == null || params.location.lon == null) {
        contextNotes.push("Missing location coordinates. Ask user to select a farm.");
      }
      if (!params.crop.name) {
        contextNotes.push("Missing crop name. Ask user for the crop.");
      }
      if (!params.crop.plantingDate) {
        contextNotes.push("Missing planting date. Ask user for planting date.");
      }
      if (!params.crop.growthStage) {
        contextNotes.push("Missing crop stage. Ask user for growth stage.");
      }
      if (!forecastSummary.days.length) {
        contextNotes.push("Missing forecast data. Ask user to refresh forecasts.");
      }
      contextNotes.push(
        "Include a why line tied to actual forecast or market values for each action and risk."
      );

      const fallbackRainTotal =
        typeof params.rainfallOutlook?.totalMm === "number"
          ? params.rainfallOutlook.totalMm
          : null;
      const fallbackRainChance =
        params.rainfallOutlook?.days?.length
          ? params.rainfallOutlook.days.reduce((sum, day) => sum + day.chancePct, 0) /
            params.rainfallOutlook.days.length
          : null;
      const rainTotal = forecastSummary.totalRainMm ?? fallbackRainTotal;
      const rainAvgChance = forecastSummary.avgRainChancePct ?? fallbackRainChance;
      const rainRiskLevel = computeRainRisk(rainTotal, rainAvgChance);

      const riskSummary: AdvisoryRiskSummary = {
        frostRiskLevel: params.frostRisk?.riskLevel ?? null,
        frostMinTempC: params.frostRisk?.minTempC ?? null,
        rainRiskLevel,
        rainTotalMm: rainTotal,
        rainAvgChancePct: rainAvgChance,
      };

      let marketSummary: AdvisoryMarketSummary =
        params.marketSummary ?? {
          available: false,
          commodity: null,
          market: null,
          admin1: null,
          predictedPricePerKg: null,
          confidencePct: null,
          unreasonable: null,
          note: "Market data unavailable. Ask user for target market and price.",
        };

      if (params.marketInput) {
        try {
          const prediction: PredictionResponse = await predictMarketPrice({
            date: dateKey,
            admin1: params.marketInput.admin1,
            market: params.marketInput.market,
            commodity: params.marketInput.commodity,
            pricetype: params.marketInput.pricetype ?? "retail",
            previous_month_price: params.marketInput.previousMonthPrice,
          });

          marketSummary = {
            available: true,
            commodity: prediction.commodity ?? params.marketInput.commodity,
            market: prediction.market ?? params.marketInput.market,
            admin1: params.marketInput.admin1,
            predictedPricePerKg: prediction.prediction_per_kg ?? null,
            confidencePct: prediction.confidence_pct ?? null,
            unreasonable: prediction.unreasonable ?? null,
            note: prediction.note ?? null,
          };
        } catch (error: any) {
          marketSummary = {
            available: false,
            commodity: params.marketInput.commodity,
            market: params.marketInput.market,
            admin1: params.marketInput.admin1,
            predictedPricePerKg: null,
            confidencePct: null,
            unreasonable: null,
            note: error?.message || "Market prediction failed.",
          };
          contextNotes.push("Market prediction failed. Ask user to confirm market data.");
        }
      }

      if (marketSummary.unreasonable) {
        contextNotes.push(
          "Market prediction flagged as unreasonable. Advise verifying with current market price sync."
        );
      }

      const context: AdvisoryContext = {
        language: params.language,
        location: {
          farmId: params.farmId ?? null,
          name: params.location.name,
          county: params.location.county,
          ward: params.location.ward,
          lat: params.location.lat,
          lon: params.location.lon,
        },
        crop: {
          id: params.cropId,
          name: params.crop.name,
          plantingDate: params.crop.plantingDate,
          growthStage: params.crop.growthStage,
        },
        forecast: forecastSummary,
        risks: riskSummary,
        market: marketSummary,
        contextNotes,
      };

      return generateAdvisory(context);
    },
  });
}
