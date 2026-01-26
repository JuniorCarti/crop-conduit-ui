/**
 * React Query mutation for Market Oracle predictions.
 */

import { useMutation } from "@tanstack/react-query";
import {
  predictMarketPrice,
  type PredictionRequest,
  type PredictionResponse,
  type MarketOracleError,
} from "@/services/marketOracleService";

export function useMarketOraclePrediction() {
  return useMutation<PredictionResponse, MarketOracleError, PredictionRequest>({
    mutationFn: predictMarketPrice,
  });
}
