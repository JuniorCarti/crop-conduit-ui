/**
 * Price Reference Component
 * Shows market price reference for listings
 */

import { TrendingUp, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstimatedSupply } from "@/hooks/useNextHarvest";
import { formatKsh } from "@/lib/currency";
import { getMarketPriceReference, type MarketPriceReference } from "@/services/marketReferenceService";
import type { Listing } from "../models/types";
import { useTranslation } from "react-i18next";

interface PriceReferenceProps {
  listing: Listing;
}

export function PriceReference({ listing }: PriceReferenceProps) {
  const { t } = useTranslation();
  const [reference, setReference] = useState<MarketPriceReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { supply: estimatedSupply } = useEstimatedSupply(listing.cropType);

  const listingKey = useMemo(
    () =>
      JSON.stringify({
        id: listing.id,
        cropType: listing.cropType,
        unit: listing.unit,
        pricePerUnit: listing.pricePerUnit,
        lat: listing.location?.lat,
        lng: listing.location?.lng ?? listing.location?.lon,
        county: listing.location?.county,
      }),
    [
      listing.cropType,
      listing.id,
      listing.location?.county,
      listing.location?.lat,
      listing.location?.lng,
      listing.location?.lon,
      listing.pricePerUnit,
      listing.unit,
    ]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await getMarketPriceReference(listing);
        if (!active) return;
        setReference(data);
        if (data.source === "fallback") {
          setError(t("marketplace.marketPriceUnavailable", "Market price unavailable"));
        }
      } catch (err: any) {
        if (!active) return;
        setError(
          err?.message || t("marketplace.marketPriceUnavailable", "Market price unavailable")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [listing, listingKey, retryCount, t]);

  const listingPrice = listing.pricePerUnit;
  const marketWholesale = reference?.wholesale ?? 0;
  const marketRetail = reference?.retail ?? 0;
  const marketPriceAnchor = marketRetail || marketWholesale || 0;

  const unitWeightKg = useMemo(() => {
    const rawWeight = listing.metadata?.unitWeightKg ?? listing.metadata?.unitWeight;
    return typeof rawWeight === "number" && rawWeight > 0 ? rawWeight : null;
  }, [listing.metadata?.unitWeight, listing.metadata?.unitWeightKg]);

  const listingPricePerKg = useMemo(() => {
    if (listing.unit === "kg") return listingPrice;
    if (listing.unit === "tons") return listingPrice / 1000;
    if (unitWeightKg) return listingPrice / unitWeightKg;
    return null;
  }, [listing.unit, listingPrice, unitWeightKg]);

  const unitMismatch =
    listing.unit !== "kg" && listing.unit !== "tons" && listingPricePerKg == null;

  const priceDifference =
    listingPricePerKg != null ? listingPricePerKg - marketPriceAnchor : 0;
  const pricePercent =
    marketPriceAnchor > 0 && listingPricePerKg != null
      ? (priceDifference / marketPriceAnchor) * 100
      : 0;

  const formattedPercent = `${pricePercent > 0 ? "+" : ""}${pricePercent.toFixed(1)}%`;
  const comparisonLabel =
    listingPricePerKg == null
      ? null
      : pricePercent > 10
      ? `${t("marketplace.priceAboveMarket", "Above market")} ${formattedPercent}`
      : pricePercent < -10
      ? `${t("marketplace.priceBelowMarket", "Good deal")} ${formattedPercent}`
      : `${t("marketplace.priceFairMarket", "Fair market price")} ${formattedPercent}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("marketplace.marketPriceReference", "Market Price Reference")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t("marketplace.marketPriceReference", "Market Price Reference")}
        </CardTitle>
        <CardDescription>
          {t("marketplace.marketPriceSubtitle", "Compare with current market prices")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {t("marketplace.yourPrice", "Your Price")}
            </p>
            <p className="text-lg font-semibold">
              {formatKsh(listingPrice)} / {listing.unit}
            </p>
            {listingPricePerKg != null && listing.unit !== "kg" && (
              <p className="text-xs text-muted-foreground">
                {t("marketplace.estimatedPerKg", "~ per kg")} {formatKsh(listingPricePerKg)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {t("marketplace.marketRetail", "Market Retail")}
            </p>
            <p className="text-lg font-semibold">
              {marketRetail ? `${formatKsh(marketRetail)} / kg` : "--"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("marketplace.marketWholesale", "Wholesale")}:{" "}
              {marketWholesale ? `${formatKsh(marketWholesale)} / kg` : "--"}
            </p>
          </div>
        </div>

        {unitMismatch && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {t("marketplace.unitMismatch", "Unit mismatch")}
            </Badge>
            <Badge variant="outline">
              {t("marketplace.marketPriceUnavailable", "Market price unavailable")}
            </Badge>
          </div>
        )}

        {marketPriceAnchor > 0 && listingPricePerKg != null && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("marketplace.priceDifference", "Price Difference")}
              </span>
              <Badge
                variant={
                  pricePercent > 10 ? "destructive" : pricePercent < -10 ? "default" : "secondary"
                }
              >
                {comparisonLabel}
              </Badge>
            </div>
            {pricePercent > 10 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                {t(
                  "marketplace.priceAboveHint",
                  "Your price is higher than market average"
                )}
              </p>
            )}
            {pricePercent < -10 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                {t(
                  "marketplace.priceBelowHint",
                  "Your price is below market average - good for buyers"
                )}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
              {t("common.retry", "Retry")}
            </Button>
          </div>
        )}

        {!error && reference && (
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <p>
              {t("marketplace.marketUsed", "Market used")}:{" "}
              {reference.marketName || t("marketplace.marketUnknown", "Unknown")}
              {reference.date ? ` - ${new Date(reference.date).toLocaleDateString()}` : ""}
            </p>
            {estimatedSupply > 0 && (
              <p className="text-xs">
                {t("marketplace.estimatedSupply", "Estimated supply")}: {estimatedSupply}{" "}
                {listing.unit}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
