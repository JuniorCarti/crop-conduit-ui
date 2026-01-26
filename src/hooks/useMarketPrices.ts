/**
 * Market Prices Hooks
 * Real-time hooks for market price data
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as MarketPriceService from "../services/marketPriceService";
import type { MarketPrice } from "../services/marketPriceService";

/**
 * Subscribe to market prices with real-time updates
 */
export function useMarketPrices(filters: {
  commodity?: string;
  market?: string;
  county?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = MarketPriceService.subscribeToMarketPrices(filters, (data) => {
      setPrices(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [
    filters.commodity,
    filters.market,
    filters.county,
    filters.startDate?.toISOString(),
    filters.endDate?.toISOString(),
  ]);

  return { prices, isLoading };
}

/**
 * Get market prices (one-time fetch)
 */
export function useMarketPricesQuery(filters: {
  commodity?: string;
  market?: string;
  county?: string;
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
}) {
  const key = [
    "marketPrices",
    filters.commodity || "all",
    filters.market || "all",
    filters.county || "all",
    filters.startDate?.toISOString() || "all",
    filters.endDate?.toISOString() || "all",
    filters.limitCount ?? "all",
  ];

  return useQuery({
    queryKey: key,
    queryFn: () => MarketPriceService.getMarketPrices(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get latest price for a commodity
 */
export function useLatestPrice(commodity: string, market?: string) {
  return useQuery({
    queryKey: ["latestPrice", commodity, market],
    queryFn: () => MarketPriceService.getLatestPrice(commodity, market),
    enabled: !!commodity,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get average price for a commodity
 */
export function useAveragePrice(commodity: string, date?: Date) {
  return useQuery({
    queryKey: ["averagePrice", commodity, date?.toISOString()],
    queryFn: () => MarketPriceService.getAveragePrice(commodity, date),
    enabled: !!commodity,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Sync market prices from Render API
 */
export function useSyncMarketPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MarketPriceService.syncMarketForecastWithFallback(),
    onSuccess: (result) => {
      // Invalidate both query keys to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["marketPrices"] });
      queryClient.invalidateQueries({ queryKey: ["cropPrices"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedMarkets"] });
      if (result.success > 0) {
        toast.success(`Synced ${result.success} prices. ${result.skipped > 0 ? `${result.skipped} skipped.` : ""}`);
      } else if (result.skipped > 0) {
        toast.warning(`Sync completed but ${result.skipped} prices were skipped. Check console for details.`);
      } else if (result.errors > 0) {
        toast.error("Sync failed. Check console for details.");
      } else {
        toast.info("Sync completed with no new data.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to sync market prices");
    },
  });
}
