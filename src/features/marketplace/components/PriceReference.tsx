/**
 * Price Reference Component
 * Shows market price reference for listings
 */

import { TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestPrice, useAveragePrice } from "@/hooks/useMarketPrices";
import { useEstimatedSupply } from "@/hooks/useNextHarvest";
import { formatKsh } from "@/lib/currency";
import type { Listing } from "../models/types";

interface PriceReferenceProps {
  listing: Listing;
}

export function PriceReference({ listing }: PriceReferenceProps) {
  const { data: latestPrice, isLoading: latestLoading } = useLatestPrice(listing.cropType, listing.location?.county);
  const { data: averagePrice, isLoading: averageLoading } = useAveragePrice(listing.cropType);
  const { supply: estimatedSupply } = useEstimatedSupply(listing.cropType);

  if (latestLoading || averageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Market Price Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const listingPrice = listing.pricePerUnit;
  const marketWholesale = latestPrice?.wholesale || averagePrice?.wholesale || 0;
  const marketRetail = latestPrice?.retail || averagePrice?.retail || 0;
  const priceDifference = listingPrice - marketWholesale;
  const pricePercent = marketWholesale > 0 ? (priceDifference / marketWholesale) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Market Price Reference
        </CardTitle>
        <CardDescription>Compare with current market prices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Your Price</p>
            <p className="text-lg font-semibold">{formatKsh(listingPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Market Wholesale</p>
            <p className="text-lg font-semibold">{formatKsh(marketWholesale)}</p>
          </div>
        </div>

        {marketWholesale > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price Difference</span>
              <Badge variant={pricePercent > 10 ? "destructive" : pricePercent < -10 ? "default" : "secondary"}>
                {pricePercent > 0 ? "+" : ""}
                {pricePercent.toFixed(1)}%
              </Badge>
            </div>
            {pricePercent > 10 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Your price is significantly higher than market average
              </p>
            )}
            {pricePercent < -10 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Your price is below market average - good for buyers!
              </p>
            )}
          </div>
        )}

        {latestPrice && (
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <p>Latest: {latestPrice.market} - {new Date(latestPrice.date).toLocaleDateString()}</p>
            {estimatedSupply > 0 && (
              <p className="text-xs">Estimated supply: {estimatedSupply} {listing.unit}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
