import type { CropPrice } from "@/services/api";
import { normalizeCommodity } from "@/lib/normalizeCommodity";

export type DecisionSupportConfidence = "High" | "Medium" | "Low";

export interface DecisionSupportForecastDay {
  date: string;
  chanceOfRain?: number;
  totalPrecipMm?: number;
  maxTempC?: number;
  minTempC?: number;
  maxWindKph?: number;
}

export interface DecisionSupportInput {
  crop?: string;
  location?: {
    county?: string;
    ward?: string;
    name?: string;
  };
  forecastDaily?: DecisionSupportForecastDay[];
  marketOracleData?: CropPrice[] | null;
}

export interface DecisionSupportOutput {
  plantingAdvice: {
    window: string;
    confidence: DecisionSupportConfidence;
    reasons: string[];
    cropSuggestions: string[];
    caution?: string;
    fallback?: string;
  };
  harvestAdvice: {
    recommendation: string;
    weatherRisk: string;
    marketSignal?: string;
    profitHint?: string;
    reasons: string[];
    storageNote?: string;
    fallback?: string;
  };
  marketSignal: {
    summary: string;
    bestMarket?: string;
    price?: number | null;
    changePct?: number | null;
    volatility?: "Stable" | "Volatile";
    demand?: "High" | "Moderate" | "Low";
    transportTip?: string;
    fallback?: string;
  };
  riskAlert: {
    title: string;
    level: "Green" | "Orange" | "Red";
    tips: string[];
    fallback?: string;
  };
  profitTip: {
    tip: string;
  };
  meta: {
    hasForecast: boolean;
    hasMarket: boolean;
  };
}

const formatDay = (value?: string) => {
  if (!value) return "soon";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

const formatRange = (start?: string, end?: string) => {
  if (!start && !end) return "Next 7 days";
  if (start && !end) return formatDay(start);
  if (!start && end) return formatDay(end);
  if (start === end) return formatDay(start);
  return `${formatDay(start)} - ${formatDay(end)}`;
};

const isRainy = (day: DecisionSupportForecastDay) =>
  (day.chanceOfRain ?? 0) >= 60 || (day.totalPrecipMm ?? 0) >= 5;

const isHeavyRain = (day: DecisionSupportForecastDay) =>
  (day.chanceOfRain ?? 0) >= 80 || (day.totalPrecipMm ?? 0) >= 10;

const isWindy = (day: DecisionSupportForecastDay) => (day.maxWindKph ?? 0) >= 30;

const isHot = (day: DecisionSupportForecastDay) => (day.maxTempC ?? 0) >= 32;

export const mapCropToOracleName = (cropLabel?: string): string | null => {
  const normalized = cropLabel ? normalizeCommodity(cropLabel) : null;
  if (!normalized) return null;
  if (normalized === "potatoes") return "Irish potato";
  if (normalized === "onion") return "Onions";
  if (normalized === "tomatoes") return "Tomatoes";
  if (normalized === "kale") return "Kale";
  if (normalized === "cabbage") return "Cabbage";
  return null;
};

export const buildDecisionSupport = (input: DecisionSupportInput): DecisionSupportOutput => {
  const forecast = input.forecastDaily ?? [];
  const hasForecast = forecast.length > 0;
  const marketOracleData = input.marketOracleData ?? [];
  const hasMarket = marketOracleData.length > 0;

  const rainyDays = forecast.filter(isRainy);
  const rainyCount = rainyDays.length;
  const heavyRainSoon = forecast.slice(0, 3).some(isHeavyRain);
  const windySoon = forecast.slice(0, 3).some(isWindy);
  const hotSoon = forecast.slice(0, 3).some(isHot);

  const avgTemp =
    forecast.length > 0
      ? forecast.reduce((sum, day) => sum + (day.maxTempC ?? 0), 0) / forecast.length
      : null;
  const withinPlantTemp = avgTemp != null && avgTemp >= 18 && avgTemp <= 30;
  const dryStreak = forecast.every((day) => !isRainy(day));

  let plantingAdvice: DecisionSupportOutput["plantingAdvice"] = {
    window: "Weather-only guidance",
    confidence: "Low",
    reasons: ["Need local rainfall and temperature data to refine timing."],
    cropSuggestions: ["Maize", "Beans", "Sorghum"],
    caution: "Planting too early can lead to seed loss if rain delays.",
    fallback: "Weather-only guidance",
  };

  if (hasForecast) {
    if (rainyCount >= 2 && withinPlantTemp) {
      const start = rainyDays[0]?.date;
      const end = rainyDays[Math.min(rainyDays.length - 1, 2)]?.date ?? rainyDays[0]?.date;
      plantingAdvice = {
        window: formatRange(start, end),
        confidence: rainyCount >= 4 ? "High" : "Medium",
        reasons: [
          `Rain expected on ${formatDay(rainyDays[0]?.date)} and ${formatDay(rainyDays[1]?.date)}.`,
          "Soil moisture likely to improve for germination.",
          "Temperatures are in the safe planting range (18-30°C).",
        ],
        cropSuggestions: ["Maize", "Beans", "Vegetables"],
        caution: "Plant within 3-5 days after first rain to avoid seed washout.",
      };
    } else if (dryStreak) {
      plantingAdvice = {
        window: "Delay planting 7-10 days",
        confidence: "Low",
        reasons: [
          "Long dry spell expected in the next 7 days.",
          "Low soil moisture may cause poor germination.",
        ],
        cropSuggestions: ["Sorghum", "Millet", "Cowpeas"],
        caution: "Consider dryland crops or wait for the next rain window.",
      };
    } else {
      plantingAdvice = {
        window: "Monitor and plant after next rain",
        confidence: "Medium",
        reasons: [
          "Scattered rain expected but not consistent.",
          "Irrigation can help if planting early.",
        ],
        cropSuggestions: ["Leafy greens", "Short-cycle beans"],
        caution: "Avoid planting large acreage until rainfall stabilizes.",
      };
    }
  }

  let harvestAdvice: DecisionSupportOutput["harvestAdvice"] = {
    recommendation: "Weather-only guidance",
    weatherRisk: "Weather",
    reasons: ["Forecast data is required for harvest guidance."],
    fallback: "Weather-only guidance",
  };

  if (hasForecast) {
    if (heavyRainSoon) {
      const firstRain = forecast.find(isHeavyRain);
      harvestAdvice = {
        recommendation: `Harvest before ${formatDay(firstRain?.date)}`,
        weatherRisk: "Rain",
        reasons: [
          "Heavy rain risk in the next 72 hours.",
          "Harvest early to avoid rot and mold damage.",
        ],
        storageNote: "Keep harvested produce ventilated and dry.",
      };
    } else if (hotSoon) {
      harvestAdvice = {
        recommendation: "Harvest early morning for the next 3-5 days",
        weatherRisk: "Heat",
        reasons: [
          "High temperature stress expected.",
          "Early harvest reduces moisture loss.",
        ],
        storageNote: "Shade produce immediately after harvest.",
      };
    } else if (windySoon) {
      harvestAdvice = {
        recommendation: "Secure harvest within 5-7 days",
        weatherRisk: "Wind",
        reasons: [
          "Wind exposure could increase crop damage.",
          "Plan sheltered harvesting windows.",
        ],
      };
    } else {
      harvestAdvice = {
        recommendation: "Harvest in 5-7 days",
        weatherRisk: "Stable",
        reasons: [
          "No major disruptions expected.",
          "Maintain regular harvest cadence.",
        ],
      };
    }
  }

  let marketSignal: DecisionSupportOutput["marketSignal"] = {
    summary: "No live prices - forecast-only mode",
    fallback: "No live prices - forecast-only mode",
  };

  let marketChangePct: number | null = null;
  if (hasMarket) {
    const oracleName = mapCropToOracleName(input.crop);
    const cropSignal = oracleName
      ? marketOracleData.find((entry) => entry.name.toLowerCase() === oracleName.toLowerCase())
      : null;
    const price = cropSignal?.price ?? null;
    const changePct = cropSignal?.change ?? null;
    marketChangePct = changePct;
    const volatility = changePct != null && Math.abs(changePct) > 10 ? "Volatile" : "Stable";
    const demand = changePct != null && changePct >= 8 ? "High" : changePct != null && changePct <= -5 ? "Low" : "Moderate";

    if (price != null) {
      marketSignal = {
        summary: "Market Oracle price signal",
        bestMarket: "Market Oracle (aggregate)",
        price,
        changePct,
        volatility,
        demand,
        transportTip: changePct != null && changePct >= 5
          ? "Consider group transport to capture higher prices."
          : "Plan transport early to avoid last-minute costs.",
      };

      if (changePct != null && changePct > 5) {
        harvestAdvice.marketSignal = "Rising price signal from Market Oracle.";
        harvestAdvice.profitHint = "Delay harvest slightly to sell at better prices if weather allows.";
      }
    }
  }

  const humidWarm = forecast.some((day) => (day.maxTempC ?? 0) >= 26 && (day.totalPrecipMm ?? 0) >= 5);
  const droughtRisk = dryStreak || rainyCount === 0;
  const riskAlert: DecisionSupportOutput["riskAlert"] = {
    title: humidWarm ? "Pest risk increased" : droughtRisk ? "Water stress risk" : "Low stress risk",
    level: humidWarm ? "Orange" : droughtRisk ? "Red" : "Green",
    tips: humidWarm
      ? ["Warm humid conditions favor pests like fall armyworm.", "Inspect maize leaves this week."]
      : droughtRisk
      ? ["Dry spell expected; moisture stress likely.", "Mulch and reduce evaporation where possible."]
      : ["Continue routine field scouting.", "Maintain drainage to prevent waterlogging."],
  };

  const profitTip: DecisionSupportOutput["profitTip"] = {
    tip: marketChangePct != null && marketChangePct >= 5
      ? "Group selling can reduce transport costs and improve bargaining power."
      : "Stagger harvest batches to avoid flooding the market on one day.",
  };

  return {
    plantingAdvice,
    harvestAdvice,
    marketSignal,
    riskAlert,
    profitTip,
    meta: { hasForecast, hasMarket },
  };
};
