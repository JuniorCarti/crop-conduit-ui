import type { WeatherApiForecast } from "@/services/weatherProxyService";

export type ClimateSignalLevel =
  | "low"
  | "medium"
  | "high"
  | "good"
  | "warning"
  | "critical";

export type ClimateSignal = {
  id: string;
  title: string;
  level: ClimateSignalLevel;
  badgeText: string;
  observations: string[];
  why: string;
  crops?: string[];
};

type FarmContext = {
  lat?: number | null;
  lon?: number | null;
  county?: string | null;
  ward?: string | null;
  crops?: string[] | null;
};

type DaySummary = {
  date: string;
  minTempC: number;
  maxTempC: number;
  rainChance: number;
  precipMm: number;
  humidity?: number | null;
  windKph?: number | null;
};

const SENSITIVE_CROPS = [
  "tomato",
  "tomatoes",
  "potato",
  "potatoes",
  "beans",
  "bean",
  "cabbage",
  "kale",
  "pepper",
  "capsicum",
  "lettuce",
  "strawberry",
  "coffee",
  "avocado",
];

const round = (value: number) => Math.round(value);

const uniqueCrops = (crops: string[] = []) => {
  const seen = new Set<string>();
  const result: string[] = [];
  crops.forEach((crop) => {
    const trimmed = crop.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const buildWhy = (base: string, crops: string[]) =>
  crops.length ? `${base} Crops noted: ${crops.join(", ")}.` : base;

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const longestStreak = (flags: boolean[]) => {
  let best = 0;
  let current = 0;
  flags.forEach((flag) => {
    if (flag) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
};

const hasAny = (values: Array<number | null | undefined>) =>
  values.some((value) => typeof value === "number" && !Number.isNaN(value));

const normalizeDays = (forecastJson?: WeatherApiForecast | null): DaySummary[] => {
  const days = forecastJson?.forecast?.forecastday ?? [];
  return days.map((day) => ({
    date: day.date,
    minTempC: day.day.mintemp_c ?? 0,
    maxTempC: day.day.maxtemp_c ?? 0,
    rainChance: day.day.daily_chance_of_rain ?? 0,
    precipMm: day.day.totalprecip_mm ?? 0,
    humidity: day.day.avghumidity ?? null,
    windKph: day.day.maxwind_kph ?? null,
  }));
};

export function computeClimateInsights(
  farm: FarmContext,
  forecastJson?: WeatherApiForecast | null
): ClimateSignal[] {
  const days = normalizeDays(forecastJson);
  if (days.length === 0) return [];

  const crops = uniqueCrops(farm.crops ?? []);
  const signals: ClimateSignal[] = [];

  const maxTemps = days.map((day) => day.maxTempC);
  const minTemps = days.map((day) => day.minTempC);
  const precipTotals = days.map((day) => day.precipMm);
  const rainChances = days.map((day) => day.rainChance);
  const humidityValues = days.map((day) => day.humidity ?? null);
  const windValues = days.map((day) => day.windKph ?? null);

  const hotDays = days.filter((day) => day.maxTempC >= 30);
  const peakMax = Math.max(...maxTemps);
  const peakMaxDay = days.find((day) => day.maxTempC === peakMax)?.date ?? "";
  const heatLevel: ClimateSignalLevel =
    hotDays.length >= 3 ? "high" : hotDays.length >= 2 ? "medium" : hotDays.length === 1 ? "low" : "good";

  signals.push({
    id: "heat-stress",
    title: "Heat Stress Signal",
    level: heatLevel,
    badgeText: heatLevel === "good" ? "Good" : heatLevel === "low" ? "Low" : heatLevel === "medium" ? "Medium" : "High",
    observations: [
      hotDays.length
        ? `${hotDays.length} day(s) reach >=30C; peak ${round(peakMax)}C on ${peakMaxDay}.`
        : "No days reach 30C in the forecast window.",
    ],
    why: buildWhy(`Max temperature >=30C on ${hotDays.length} day(s).`, crops),
    crops,
  });

  const hasSensitiveCrops = crops.some((crop) =>
    SENSITIVE_CROPS.includes(crop.trim().toLowerCase())
  );
  const coldThreshold = hasSensitiveCrops ? 8 : 5;
  const coldDays = days.filter((day) => day.minTempC <= coldThreshold);
  const coldMin = Math.min(...minTemps);
  const coldMinDay = days.find((day) => day.minTempC === coldMin)?.date ?? "";
  const coldLevel: ClimateSignalLevel =
    coldMin <= 2 ? "critical" : coldDays.length > 0 ? "warning" : "good";

  signals.push({
    id: "cold-stress",
    title: "Cold Stress / Frost Signal",
    level: coldLevel,
    badgeText: coldLevel === "critical" ? "Critical" : coldLevel === "warning" ? "Warning" : "Good",
    observations: [
      coldDays.length
        ? `${coldDays.length} night(s) at or below ${coldThreshold}C; lowest ${round(coldMin)}C on ${coldMinDay}.`
        : `Minimum temperatures stay above ${coldThreshold}C.`,
    ],
    why: buildWhy(`Threshold set to ${coldThreshold}C based on crop sensitivity.`, crops),
    crops,
  });

  const totalPrecip = precipTotals.reduce((sum, value) => sum + value, 0);
  const avgChance = average(rainChances);
  const rainyDays = days.filter((day) => day.rainChance >= 60);
  const rainfallLevel: ClimateSignalLevel =
    totalPrecip >= 30 || rainyDays.length >= 4
      ? "high"
      : totalPrecip >= 15 || rainyDays.length >= 2
      ? "medium"
      : "low";

  signals.push({
    id: "rainfall-trend",
    title: "Rainfall Trend",
    level: rainfallLevel,
    badgeText: rainfallLevel === "high" ? "High" : rainfallLevel === "medium" ? "Medium" : "Low",
    observations: [
      `Total precipitation: ${round(totalPrecip)} mm over ${days.length} day(s).`,
      `High rain chance (>=60%) on ${rainyDays.length} day(s).`,
    ],
    why: buildWhy(`Average rain chance ${round(avgChance)}%.`, crops),
    crops,
  });

  const maxSpread = Math.max(...maxTemps) - Math.min(...maxTemps);
  const minSpread = Math.max(...minTemps) - Math.min(...minTemps);
  const tempStable = maxSpread <= 6 && minSpread <= 6;
  const moderateRainDays = days.filter(
    (day) => day.rainChance >= 40 && day.rainChance <= 70
  );
  const heavyRainDays = days.filter((day) => day.precipMm >= 10 || day.rainChance >= 80);
  const plantingStatus =
    heavyRainDays.length >= 3 || maxSpread >= 10 || minSpread >= 10
      ? "Unfavorable"
      : tempStable && moderateRainDays.length >= 2
      ? "Favorable"
      : "Uncertain";
  const plantingLevel: ClimateSignalLevel =
    plantingStatus === "Favorable" ? "good" : plantingStatus === "Uncertain" ? "warning" : "critical";

  signals.push({
    id: "planting-window",
    title: "Planting Window Signal",
    level: plantingLevel,
    badgeText: plantingStatus,
    observations: [
      `Temperature spread: ${round(maxSpread)}C (max) and ${round(minSpread)}C (min).`,
      `Moderate rain chance days: ${moderateRainDays.length}.`,
    ],
    why: buildWhy("Status based on temperature stability and rainfall consistency.", crops),
    crops,
  });

  const dryDays = days.filter((day) => day.rainChance < 30 && day.precipMm < 2);
  const irrigationLevel: ClimateSignalLevel =
    hotDays.length >= 3 && dryDays.length >= 4
      ? "high"
      : hotDays.length >= 2 || dryDays.length >= 3
      ? "medium"
      : "low";

  signals.push({
    id: "irrigation-pressure",
    title: "Irrigation Pressure Index",
    level: irrigationLevel,
    badgeText: irrigationLevel === "high" ? "High" : irrigationLevel === "medium" ? "Medium" : "Low",
    observations: [
      `Hot days (>=30C): ${hotDays.length}.`,
      `Low rain days (<30% chance): ${dryDays.length}.`,
    ],
    why: buildWhy("Based on low rainfall combined with high temperatures.", crops),
    crops,
  });

  if (hasAny(humidityValues)) {
    const humidRainDays = days.filter(
      (day) => (day.humidity ?? 0) >= 70 && day.rainChance >= 60
    );
    const avgHumidity = average(
      days.map((day) => (day.humidity ?? 0))
    );
    const diseaseLevel: ClimateSignalLevel =
      humidRainDays.length >= 3 ? "high" : humidRainDays.length >= 1 ? "medium" : "low";

    signals.push({
      id: "disease-pressure",
      title: "Disease Pressure Signal",
      level: diseaseLevel,
      badgeText:
        diseaseLevel === "high"
          ? "High Disease Pressure"
          : diseaseLevel === "medium"
          ? "Elevated Disease Pressure"
          : "Low Disease Pressure",
      observations: [
        `Humid + rainy days: ${humidRainDays.length}.`,
        `Average humidity: ${round(avgHumidity)}%.`,
      ],
      why: buildWhy("Humidity and rain chance are used to estimate disease pressure.", crops),
      crops,
    });
  }

  if (hasAny(windValues)) {
    const windyDays = days.filter((day) => (day.windKph ?? 0) >= 25);
    const peakWind = Math.max(...windValues.map((value) => value ?? 0));
    const peakWindDay = days.find((day) => (day.windKph ?? 0) === peakWind)?.date ?? "";
    const windLevel: ClimateSignalLevel =
      peakWind >= 35 || windyDays.length >= 3
        ? "high"
        : windyDays.length >= 1
        ? "medium"
        : "low";

    signals.push({
      id: "wind-exposure",
      title: "Wind Exposure Signal",
      level: windLevel,
      badgeText: windLevel === "high" ? "High" : windLevel === "medium" ? "Medium" : "Low",
      observations: [
      `Peak wind ${round(peakWind)} km/h on ${peakWindDay}.`,
      `Days >=25 km/h: ${windyDays.length}.`,
      ],
      why: buildWhy("Wind exposure uses daily peak wind speed.", crops),
      crops,
    });
  }

  const suitabilityScores = days.map((day) => {
    const wind = day.windKph ?? 0;
    return {
      day,
      score: day.rainChance * 0.6 + day.precipMm * 2 + wind * 0.4,
    };
  });
  const bestSprayDays = [...suitabilityScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => item.day.date);
  const worstSprayDays = [...suitabilityScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.day.date);

  signals.push({
    id: "spray-suitability",
    title: "Spray Weather Suitability Signal",
    level: bestSprayDays.length >= 2 ? "good" : bestSprayDays.length === 1 ? "warning" : "critical",
    badgeText: bestSprayDays.length >= 2 ? "Good" : bestSprayDays.length === 1 ? "Warning" : "Critical",
    observations: [
      `Best conditions: ${bestSprayDays.join(", ") || "Unavailable"}.`,
      `Most challenging: ${worstSprayDays.join(", ") || "Unavailable"}.`,
    ],
    why: buildWhy("Suitability ranks rain chance, precipitation, and wind together.", crops),
    crops,
  });

  const heavyRainSignals = days.filter(
    (day) => day.precipMm >= 15 || day.rainChance >= 80
  );
  const peakPrecip = Math.max(...precipTotals);
  const peakPrecipDay = days.find((day) => day.precipMm === peakPrecip)?.date ?? "";
  const harvestLevel: ClimateSignalLevel =
    heavyRainSignals.length >= 2 ? "high" : heavyRainSignals.length >= 1 ? "medium" : "low";

  signals.push({
    id: "harvest-disruption",
    title: "Harvest Disruption Risk",
    level: harvestLevel,
    badgeText: harvestLevel === "high" ? "High" : harvestLevel === "medium" ? "Medium" : "Low",
    observations: [
      `Heavy rain signal on ${heavyRainSignals.length} day(s).`,
      `Peak precipitation ${round(peakPrecip)} mm on ${peakPrecipDay}.`,
    ],
    why: buildWhy("Heavy rain or very high rain chance increases disruption risk.", crops),
    crops,
  });

  const waterlogDays = days.filter((day) => day.precipMm >= 10);
  const highChanceStreak = longestStreak(days.map((day) => day.rainChance >= 70));
  const waterlogLevel: ClimateSignalLevel =
    peakPrecip >= 20 || highChanceStreak >= 3
      ? "high"
      : waterlogDays.length >= 1 || highChanceStreak >= 2
      ? "medium"
      : "low";

  signals.push({
    id: "soil-waterlogging",
    title: "Soil Waterlogging Risk",
    level: waterlogLevel,
    badgeText: waterlogLevel === "high" ? "High" : waterlogLevel === "medium" ? "Medium" : "Low",
    observations: [
      `Max daily precipitation ${round(peakPrecip)} mm.`,
      `Consecutive high rain chance days: ${highChanceStreak}.`,
    ],
    why: buildWhy("Persistent or heavy rain elevates waterlogging risk.", crops),
    crops,
  });

  const transportScores = days.map((day) => {
    const wind = day.windKph ?? 0;
    return {
      day,
      score: day.rainChance * 0.7 + day.precipMm * 2 + wind * 0.3,
    };
  });
  const bestTransportDays = [...transportScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => item.day.date);
  const worstTransportDays = [...transportScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.day.date);
  const transportLevel: ClimateSignalLevel =
    bestTransportDays.length >= 2 ? "good" : bestTransportDays.length === 1 ? "warning" : "critical";

  signals.push({
    id: "market-transport",
    title: "Market Transport Weather Suitability",
    level: transportLevel,
    badgeText: transportLevel === "good" ? "Good" : transportLevel === "warning" ? "Warning" : "Critical",
    observations: [
      `Best transport weather: ${bestTransportDays.join(", ") || "Unavailable"}.`,
      `Highest exposure: ${worstTransportDays.join(", ") || "Unavailable"}.`,
    ],
    why: buildWhy("Based on rain chance and wind exposure for travel conditions.", crops),
    crops,
  });

  const snapshotCount = Math.min(days.length, 7);

  signals.push({
    id: "snapshot",
    title: "7-Day Climate Snapshot",
    level: "good",
    badgeText: "Snapshot",
    observations: [
      `Daily min/max temperature and rain chance for the next ${snapshotCount} day(s).`,
    ],
    why: buildWhy("Derived directly from forecast data.", crops),
    crops,
  });

  return signals;
}
