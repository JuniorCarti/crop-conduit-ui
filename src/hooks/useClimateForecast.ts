/**
 * React Query hook for climate forecasts via Cloudflare worker.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchForecast,
  deriveFrostRisk,
  deriveRainfallOutlook,
  deriveAdvisory,
  type WeatherApiForecast,
  type FrostRiskSummary,
  type RainfallOutlook,
  type AdvisoryItem,
} from "@/services/weatherProxyService";

export type ClimateForecastResult = {
  forecast: WeatherApiForecast;
  frostRisk: FrostRiskSummary;
  rainfallOutlook: RainfallOutlook;
  advisory: AdvisoryItem[];
};

export function useClimateForecast(params: {
  farmId: string | null;
  lat: number | null;
  lon: number | null;
  days: number;
}) {
  const enabled = Boolean(params.farmId && params.lat != null && params.lon != null);

  return useQuery<ClimateForecastResult>({
    queryKey: ["climateForecast", params.farmId, params.lat, params.lon, params.days],
    enabled,
    staleTime: 8 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      if (params.lat == null || params.lon == null) {
        throw new Error("Missing coordinates.");
      }
      const forecast = await fetchForecast({
        lat: params.lat,
        lon: params.lon,
        days: params.days,
      });
      const frostRisk = deriveFrostRisk(forecast);
      const rainfallOutlook = deriveRainfallOutlook(forecast);
      const advisory = deriveAdvisory(frostRisk, rainfallOutlook);
      return { forecast, frostRisk, rainfallOutlook, advisory };
    },
  });
}
