/**
 * Weather proxy service for Cloudflare Worker.
 */

export type WeatherApiForecast = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime?: string;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        totalprecip_mm: number;
        daily_chance_of_rain: number;
        avghumidity?: number;
        maxwind_kph?: number;
      };
    }>;
  };
};

export type FrostRiskLevel = "Low" | "Medium" | "High";

export type FrostRiskSummary = {
  riskLevel: FrostRiskLevel;
  minTempC: number;
  days: Array<{ date: string; minTempC: number; risk: FrostRiskLevel }>;
};

export type RainfallOutlook = {
  totalMm: number;
  days: Array<{ date: string; mm: number; chancePct: number }>;
};

export type AdvisoryItem = {
  type: "warning" | "tip";
  title: string;
  body: string;
};

const resolveWeatherProxyUrl = (): string => {
  const baseUrl = import.meta.env.VITE_WEATHER_PROXY_URL;
  if (!baseUrl) {
    throw new Error("VITE_WEATHER_PROXY_URL is not configured.");
  }
  return baseUrl.replace(/\/$/, "");
};

const getRiskLevel = (minTempC: number): FrostRiskLevel => {
  if (minTempC <= 2) return "High";
  if (minTempC <= 5) return "Medium";
  return "Low";
};

export async function fetchForecast(params: {
  lat: number;
  lon: number;
  days: number;
}): Promise<WeatherApiForecast> {
  const baseUrl = resolveWeatherProxyUrl();
  const url = new URL(baseUrl);
  url.searchParams.set("lat", String(params.lat));
  url.searchParams.set("lon", String(params.lon));
  url.searchParams.set("days", String(params.days));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Failed to fetch weather forecast.");
  }

  return response.json();
}

export function deriveFrostRisk(forecast: WeatherApiForecast): FrostRiskSummary {
  const days = forecast.forecast.forecastday.map((day) => ({
    date: day.date,
    minTempC: day.day.mintemp_c,
    risk: getRiskLevel(day.day.mintemp_c),
  }));

  const today = days[0];
  return {
    riskLevel: today?.risk ?? "Low",
    minTempC: today?.minTempC ?? 0,
    days,
  };
}

export function deriveRainfallOutlook(forecast: WeatherApiForecast): RainfallOutlook {
  const days = forecast.forecast.forecastday.map((day) => ({
    date: day.date,
    mm: day.day.totalprecip_mm ?? 0,
    chancePct: day.day.daily_chance_of_rain ?? 0,
  }));

  const totalMm = days.reduce((sum, day) => sum + (day.mm || 0), 0);
  return { totalMm, days };
}

export function deriveAdvisory(
  frostRisk: FrostRiskSummary,
  rainfall: RainfallOutlook
): AdvisoryItem[] {
  const advisories: AdvisoryItem[] = [];
  const avgChance =
    rainfall.days.length > 0
      ? rainfall.days.reduce((sum, day) => sum + (day.chancePct || 0), 0) / rainfall.days.length
      : 0;

  if (frostRisk.riskLevel === "High" || frostRisk.riskLevel === "Medium") {
    advisories.push({
      type: "warning",
      title: "climate.advisory.frost.title",
      body: "climate.advisory.frost.body",
    });
  }

  if (avgChance >= 60 || rainfall.totalMm >= 20) {
    advisories.push({
      type: "warning",
      title: "climate.advisory.rain.title",
      body: "climate.advisory.rain.body",
    });
  } else {
    advisories.push({
      type: "tip",
      title: "climate.advisory.clear.title",
      body: "climate.advisory.clear.body",
    });
  }

  return advisories;
}
