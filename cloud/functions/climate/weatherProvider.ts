import * as functions from "firebase-functions";

export interface ProviderDailyForecast {
  date: string;
  minTempC: number;
  maxTempC: number;
  humidity: number;
  windSpeed: number;
  rainMm: number;
  rainChance: number;
}

export interface ProviderForecast {
  daily: ProviderDailyForecast[];
}

const WEATHER_API_KEY = functions.config().weather?.api_key || process.env.WEATHER_API_KEY;

export async function fetchForecast(lat: number, lon: number): Promise<ProviderForecast> {
  if (!WEATHER_API_KEY) {
    throw new Error("Missing WEATHER_API_KEY for weather provider.");
  }

  // Placeholder: replace with real provider integration.
  // Example: Open-Meteo, Tomorrow.io, or Meteomatics.
  return {
    daily: [
      {
        date: new Date().toISOString().split("T")[0],
        minTempC: 6,
        maxTempC: 18,
        humidity: 70,
        windSpeed: 2.2,
        rainMm: 1.2,
        rainChance: 40,
      },
    ],
  };
}
