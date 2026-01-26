import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, MapPin, Bell, Search, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useCropPrices, usePriceHistory, useRecommendedMarkets } from "@/hooks/useApi";
import { useMarketOraclePrediction } from "@/hooks/useMarketOraclePrediction";
import { useMarketPricesQuery, useSyncMarketPrices } from "@/hooks/useMarketPrices";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { formatKsh, formatKshDecimal } from "@/lib/currency";
import { differenceInMinutes, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getSupportedCommodities,
  getSupportedMarkets,
  normalizeMarket,
  type PredictionResponse,
} from "@/services/marketOracleService";
import { normalizeCommodity } from "@/lib/normalizeCommodity";
import { useTranslation } from "react-i18next";

type TodayPrice = {
  commodity: string;
  admin1: string;
  market: string;
  pricetype: "retail" | "wholesale";
  price_per_kg: number;
  updatedAt?: Date | string;
};

export default function Market() {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pricePeriod, setPricePeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [predictionForm, setPredictionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    admin1: "Nairobi",
    market: "Wakulima (Nairobi)",
    commodity: "",
    pricetype: "retail",
    previousMonthPrice: "",
  });
  const { t } = useTranslation();

  const { data: cropPrices, error: pricesError } = useCropPrices();
  const { data: priceHistory, isLoading: historyLoading } = usePriceHistory(pricePeriod);
  const syncPrices = useSyncMarketPrices();
  const predictMutation = useMarketOraclePrediction();

  const todayRange = useMemo(() => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }, []);

  const {
    data: todayPrices,
    isLoading: todayPricesLoading,
    error: todayPricesError,
  } = useMarketPricesQuery({
    startDate: todayRange.startDate,
    endDate: todayRange.endDate,
    limitCount: 300,
  });

  const recommendationFilters = useMemo(
    () => ({
      commodity: predictionForm.commodity || undefined,
      region: predictionForm.admin1 || undefined,
      pricetype: predictionForm.pricetype as "retail" | "wholesale",
      limit: 3,
    }),
    [predictionForm.admin1, predictionForm.commodity, predictionForm.pricetype]
  );

  const { data: recommendedMarkets, isLoading: marketsLoading } =
    useRecommendedMarkets(recommendationFilters);


  const normalizedSelectedCommodity = useMemo(
    () => normalizeCommodity(predictionForm.commodity || ""),
    [predictionForm.commodity]
  );

  const todayPriceRows: TodayPrice[] = useMemo(() => {
    if (!todayPrices) return [];
    return todayPrices.flatMap((price) => {
      const rows: TodayPrice[] = [];
      if (price.retail && price.retail > 0) {
        rows.push({
          commodity: price.commodity,
          admin1: price.county || "",
          market: price.market,
          pricetype: "retail",
          price_per_kg: price.retail,
          updatedAt: price.updatedAt || price.date,
        });
      }
      if (price.wholesale && price.wholesale > 0) {
        rows.push({
          commodity: price.commodity,
          admin1: price.county || "",
          market: price.market,
          pricetype: "wholesale",
          price_per_kg: price.wholesale,
          updatedAt: price.updatedAt || price.date,
        });
      }
      return rows;
    });
  }, [todayPrices]);

  const filteredTodayPrices = useMemo(() => {
    if (!todayPriceRows.length) return [];
    const query = searchQuery.trim().toLowerCase();
    return todayPriceRows.filter((price) => {
      if (!query) return true;
      return (
        price.market.toLowerCase().includes(query) ||
        price.commodity.toLowerCase().includes(query)
      );
    });
  }, [todayPriceRows, searchQuery]);

  const availableMarkets = useMemo(() => {
    if (!todayPriceRows.length) return [];
    const region = predictionForm.admin1?.toLowerCase();
    const filtered = todayPriceRows.filter((price) => {
      const regionMatch = region ? (price.admin1 || "").toLowerCase() === region : true;
      const commodityMatch = normalizedSelectedCommodity
        ? normalizeCommodity(price.commodity || "") === normalizedSelectedCommodity
        : true;
      const priceTypeMatch = predictionForm.pricetype
        ? price.pricetype === predictionForm.pricetype
        : true;
      return regionMatch && commodityMatch && priceTypeMatch;
    });

    const marketSet = new Set(filtered.map((price) => price.market));
    return Array.from(marketSet).sort();
  }, [normalizedSelectedCommodity, predictionForm.admin1, todayPriceRows]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Market] todayPrices count", todayPriceRows.length);
    }
  }, [todayPriceRows]);

  const supportedCommodities = useMemo(() => getSupportedCommodities(), []);
  const supportedMarkets = useMemo(
    () => getSupportedMarkets(predictionForm.admin1),
    [predictionForm.admin1]
  );
  const supportedCommodityLabels = useMemo(
    () =>
      supportedCommodities.map((commodity) => {
        switch (commodity) {
          case "tomatoes":
            return t("marketOracle.commodities.tomatoes");
          case "cabbage":
            return t("marketOracle.commodities.cabbage");
          case "potatoes":
            return t("marketOracle.commodities.potatoes");
          case "onion":
            return t("marketOracle.commodities.onion");
          case "kale":
            return t("marketOracle.commodities.kale");
          default:
            return commodity;
        }
      }),
    [supportedCommodities, t]
  );
  const commodityOptions = useMemo(() => {
    const fallback = [
      { value: "Tomatoes", label: t("marketOracle.commodities.tomatoes") },
      { value: "Cabbage", label: t("marketOracle.commodities.cabbage") },
      { value: "Potatoes (Irish)", label: t("marketOracle.commodities.potatoes") },
      { value: "Onions (dry)", label: t("marketOracle.commodities.onion") },
      { value: "Kale", label: t("marketOracle.commodities.kale") },
    ];

    const fromPrices =
      cropPrices?.map((crop) => ({
        value: crop.name,
        label: crop.name,
      })) || [];

    const seen = new Set<string>();
    const merged = [...fromPrices, ...fallback].filter((item) => {
      const key = item.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return merged;
  }, [cropPrices, t]);

  const adminOptions = [
    { value: "Nairobi", label: t("marketOracle.admin.nairobi") },
    { value: "Central", label: t("marketOracle.admin.central") },
    { value: "Coast", label: t("marketOracle.admin.coast") },
    { value: "Eastern", label: t("marketOracle.admin.eastern") },
    { value: "North Eastern", label: t("marketOracle.admin.northEastern") },
    { value: "Nyanza", label: t("marketOracle.admin.nyanza") },
    { value: "Rift Valley", label: t("marketOracle.admin.riftValley") },
  ];

  const priceTypeOptions = [
    { value: "retail", label: t("marketOracle.pricetype.retail") },
    { value: "wholesale", label: t("marketOracle.pricetype.wholesale") },
  ];

  const handlePredictionSubmit = async () => {
    setPredictionError(null);

    if (!predictionForm.admin1 || !predictionForm.market || !predictionForm.pricetype) {
      setPredictionError(t("marketOracle.errors.required"));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(predictionForm.date)) {
      setPredictionError(t("marketOracle.errors.invalidDate"));
      return;
    }

    const normalizedCommodity = normalizeCommodity(predictionForm.commodity || "");
    if (!normalizedCommodity) {
      setPredictionError(
        t("marketOracle.errors.unsupportedCommodity", {
          commodities: supportedCommodityLabels.join(", "),
        })
      );
      return;
    }

    const normalizedMarket = normalizeMarket(predictionForm.market, predictionForm.admin1);
    if (!normalizedMarket) {
      setPredictionError(
        t("marketOracle.errors.unsupportedMarket", {
          markets: supportedMarkets.join(", "),
        })
      );
      return;
    }

    const parsedPrevious = Number.parseFloat(predictionForm.previousMonthPrice);
    if (Number.isNaN(parsedPrevious)) {
      setPredictionError(t("marketOracle.errors.invalidPrice"));
      return;
    }

    try {
        const result = await predictMutation.mutateAsync({
          date: predictionForm.date,
          admin1: predictionForm.admin1.trim(),
          market: normalizedMarket,
          commodity: normalizedCommodity,
          pricetype: predictionForm.pricetype as "retail" | "wholesale",
          previous_month_price: parsedPrevious,
        });
        setPredictionResult(result);
        if (typeof window !== "undefined") {
          const marketSignalPayload = {
            predictedPrice:
              typeof result.prediction_per_kg === "number"
                ? result.prediction_per_kg
                : null,
            marketUnreasonable:
              typeof result.unreasonable === "boolean" ? result.unreasonable : null,
          };
          window.localStorage.setItem(
            "agrismart:lastMarketPrediction",
            JSON.stringify(marketSignalPayload)
          );
        }
      } catch (error: any) {
      if (error?.isNetworkError) {
        setPredictionError(t("marketOracle.errors.network"));
        return;
      }

      if (error?.status === 400 && String(error?.details || "").toLowerCase().includes("commodity")) {
        setPredictionError(
          t("marketOracle.errors.unsupportedCommodity", {
            commodities: supportedCommodityLabels.join(", "),
          })
        );
        return;
      }

      if (error?.status === 400 && String(error?.details || "").toLowerCase().includes("market")) {
        setPredictionError(
          t("marketOracle.errors.unsupportedMarket", {
            markets: supportedMarkets.join(", "),
          })
        );
        return;
      }

      setPredictionError(t("marketOracle.errors.generic"));
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("market.title")}
        subtitle={t("market.subtitle")}
        icon={TrendingUp}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncPrices.mutate()}
            disabled={syncPrices.isPending}
            className="gap-2"
          >
            {syncPrices.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{t("market.syncing")}</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t("market.syncPrices")}</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlertModal(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t("market.setAlert")}</span>
          </Button>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        <div className="relative animate-fade-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("market.searchPlaceholder")}
            className="pl-10 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle>{t("marketOracle.title")}</CardTitle>
                <CardDescription>{t("marketOracle.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictionError && (
                  <Alert variant="destructive">
                    <AlertTitle>{t("marketOracle.errors.title")}</AlertTitle>
                    <AlertDescription>{predictionError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("marketOracle.form.dateLabel")}
                    </label>
                    <Input
                      type="date"
                      value={predictionForm.date}
                      onChange={(e) =>
                        setPredictionForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("marketOracle.form.adminLabel")}
                    </label>
                    <Select
                      value={predictionForm.admin1}
                      onValueChange={(value) =>
                        setPredictionForm((prev) => ({ ...prev, admin1: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("marketOracle.form.adminPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {adminOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        {t("marketOracle.form.marketLabel")}
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!recommendedMarkets || recommendedMarkets.length === 0}
                        onClick={() => {
                          const bestMarket = recommendedMarkets?.[0]?.market;
                          if (bestMarket) {
                            setPredictionForm((prev) => ({ ...prev, market: bestMarket }));
                          }
                        }}
                      >
                        {t("marketOracle.form.useBestMarket", "Use best market")}
                      </Button>
                    </div>
                    <Popover open={marketOpen} onOpenChange={setMarketOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={marketOpen}
                          className="w-full justify-between"
                        >
                          {predictionForm.market
                            ? predictionForm.market
                            : t("marketOracle.form.marketPlaceholder", "Select market")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder={t("marketOracle.form.marketSearch", "Search markets...")}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {t("marketOracle.form.marketEmpty", "No markets found")}
                            </CommandEmpty>
                            <CommandGroup>
                              {availableMarkets.map((market) => (
                                <CommandItem
                                  key={market}
                                  value={market}
                                  onSelect={(value) => {
                                    setPredictionForm((prev) => ({ ...prev, market: value }));
                                    setMarketOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      predictionForm.market === market ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {market}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      {availableMarkets.length === 0
                        ? t(
                            "marketOracle.form.marketEmptyHint",
                            "Click Sync Prices to load markets."
                          )
                        : t("marketOracle.form.marketHint", "{{count}} markets available", {
                            count: availableMarkets.length,
                          })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("marketOracle.form.commodityLabel")}
                    </label>
                    <Select
                      value={predictionForm.commodity}
                      onValueChange={(value) =>
                        setPredictionForm((prev) => ({ ...prev, commodity: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("marketOracle.form.commodityPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {commodityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t("marketOracle.form.supportedHint", {
                        commodities: supportedCommodityLabels.join(", "),
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("marketOracle.form.priceTypeLabel")}
                    </label>
                    <Select
                      value={predictionForm.pricetype}
                      onValueChange={(value) =>
                        setPredictionForm((prev) => ({ ...prev, pricetype: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("marketOracle.form.priceTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {priceTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("marketOracle.form.previousPriceLabel")}
                    </label>
                    <Input
                      type="number"
                      placeholder={t("marketOracle.form.previousPricePlaceholder")}
                      value={predictionForm.previousMonthPrice}
                      onChange={(e) =>
                        setPredictionForm((prev) => ({
                          ...prev,
                          previousMonthPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handlePredictionSubmit}
                    disabled={predictMutation.isPending}
                    className="gap-2"
                  >
                    {predictMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("marketOracle.form.loading")}
                      </>
                    ) : (
                      t("marketOracle.form.predictButton")
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle>{t("marketOracle.results.title")}</CardTitle>
                <CardDescription>{t("marketOracle.results.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictMutation.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                ) : predictionResult ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("marketOracle.results.predictedPrice")}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {typeof predictionResult.prediction_per_kg === "number"
                            ? formatKshDecimal(predictionResult.prediction_per_kg, 2)
                            : t("marketOracle.results.na")}
                        </p>
                        {predictionResult.unit && (
                          <p className="text-xs text-muted-foreground">{predictionResult.unit}</p>
                        )}
                      </div>
                      {predictionResult.unreasonable && (
                        <Badge variant="destructive">{t("marketOracle.results.outlier")}</Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("marketOracle.results.confidence")}
                        </span>
                        <span className="font-medium text-foreground">
                          {typeof predictionResult.confidence_pct === "number"
                            ? `${predictionResult.confidence_pct}%`
                            : t("marketOracle.results.na")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("marketOracle.results.range")}
                        </span>
                        <span className="font-medium text-foreground">
                          {typeof predictionResult.lower_bound === "number" &&
                          typeof predictionResult.upper_bound === "number"
                            ? `${formatKshDecimal(predictionResult.lower_bound, 2)} - ${formatKshDecimal(
                                predictionResult.upper_bound,
                                2
                              )}`
                            : t("marketOracle.results.na")}
                        </span>
                      </div>
                    </div>

                    {predictionResult.note && predictionResult.unreasonable && (
                      <Alert>
                        <AlertTitle>{t("marketOracle.results.noteTitle")}</AlertTitle>
                        <AlertDescription>{predictionResult.note}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {t("marketOracle.results.empty")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {pricesError && (
          <AlertCard
            type="danger"
            title={t("market.errorTitle")}
            message={t("market.errorMessage")}
          />
        )}

        <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{t("market.todayPrices")}</h3>
            <span className="text-xs text-muted-foreground">
              {t("market.todayPricesSubtitle", "Latest market prices for today")}
            </span>
          </div>

          {todayPricesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : todayPricesError ? (
            <AlertCard
              type="danger"
              title={t("market.errors.pricesTitle", "Failed to load prices")}
              message={t("market.errors.pricesMessage", "Please click Sync Prices and try again.")}
            />
          ) : filteredTodayPrices.length > 0 ? (
            <div className="rounded-xl border border-border/50 bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("market.table.market", "Market")}</TableHead>
                    <TableHead>{t("market.table.commodity", "Commodity")}</TableHead>
                    <TableHead className="text-right">{t("market.table.price", "Price/kg")}</TableHead>
                    <TableHead>{t("market.table.type", "Type")}</TableHead>
                    <TableHead>{t("market.table.updated", "Updated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTodayPrices.map((price) => {
                    const value = price.price_per_kg || 0;
                    const typeLabel =
                      price.pricetype === "retail"
                        ? t("market.table.retail", "Retail")
                        : t("market.table.wholesale", "Wholesale");
                    const updatedAt = price.updatedAt;
                    const updatedLabel = updatedAt
                      ? formatDistanceToNow(updatedAt instanceof Date ? updatedAt : new Date(updatedAt), {
                          addSuffix: true,
                        })
                      : t("market.table.updatedUnknown", "Unknown");

                    return (
                      <TableRow key={`${price.market}-${price.commodity}-${price.pricetype}`}>
                        <TableCell className="font-medium">{price.market}</TableCell>
                        <TableCell>{price.commodity}</TableCell>
                        <TableCell className="text-right">{formatKshDecimal(value, 2)}</TableCell>
                        <TableCell>{typeLabel}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{updatedLabel}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                {searchQuery
                  ? t("market.noResults", { query: searchQuery })
                  : t(
                      "market.emptyMarkets",
                      "No market prices available. Click Sync Prices to fetch the latest market data."
                    )}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => syncPrices.mutate()}
                  disabled={syncPrices.isPending}
                  className="gap-2"
                >
                  {syncPrices.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("market.syncing")}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      {t("market.syncMarketPrices")}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </section>

        <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <Tabs value={pricePeriod} onValueChange={(v) => setPricePeriod(v as "daily" | "weekly" | "monthly")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{t("market.priceTrends")}</h3>
                <TabsList className="h-8">
                  <TabsTrigger value="daily" className="text-xs h-6 px-2">
                    {t("market.period.daily")}
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs h-6 px-2">
                    {t("market.period.weekly")}
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs h-6 px-2">
                    {t("market.period.monthly")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={pricePeriod} className="mt-0">
                {historyLoading ? (
                  <div className="h-52 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : priceHistory && priceHistory.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maize"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="wheat"
                          stroke="hsl(var(--warning))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sorghum"
                          stroke="hsl(var(--info))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-muted-foreground">
                    {t("market.noData")}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {priceHistory && priceHistory.length > 0 && (
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">{t("commodities.maize")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-xs text-muted-foreground">{t("commodities.wheat")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-info" />
                  <span className="text-xs text-muted-foreground">{t("commodities.sorghum")}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">
              {t("market.recommendations.title", "Recommended Markets")}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t("market.recommendations.subtitle", "Best prices for your selection")}
            </span>
          </div>
          {marketsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : recommendedMarkets && recommendedMarkets.length > 0 ? (
            <div className="space-y-3">
              {recommendedMarkets.map((market) => {
                const updatedAt = market.updatedAt;
                const freshnessMinutes = updatedAt
                  ? differenceInMinutes(new Date(), updatedAt)
                  : null;
                const freshnessLabel =
                  freshnessMinutes !== null && freshnessMinutes <= 120
                    ? t("market.recommendations.badges.fresh", "Fresh")
                    : t("market.recommendations.badges.stable", "Stable");
                const updatedLabel = updatedAt
                  ? formatDistanceToNow(updatedAt, { addSuffix: true })
                  : t("market.recommendations.updatedUnknown", "Updated time unknown");

                return (
                  <div
                    key={market.market}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between gap-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{market.market}</p>
                          {market.isBest && (
                            <Badge variant="default">
                              {t("market.recommendations.badges.best", "Best price")}
                            </Badge>
                          )}
                          <Badge variant="outline">{freshnessLabel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            market.reasonKey,
                            market.reasonKey === "market.recommendations.reasons.bestPrice"
                              ? "Highest price today"
                              : "Good demand signal"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("market.recommendations.updated", "Updated {{time}}", {
                            time: updatedLabel,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {formatKshDecimal(market.price, 2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("market.recommendations.priceLabel", "Best price")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPredictionForm((prev) => ({
                            ...prev,
                            market: market.market,
                          }))
                        }
                      >
                        {t("market.recommendations.useMarket", "Use this market")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("market.recommendations.empty", "No recommended markets yet. Sync prices first.")}
            </div>
          )}
        </section>
      </div>

      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("market.alert.title")}</DialogTitle>
            <DialogDescription>{t("market.alert.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t("market.alert.cropLabel")}</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                {cropPrices?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                {t("market.alert.conditionLabel")}
              </label>
              <div className="flex gap-2 mt-1">
                <select className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  <option>{t("market.alert.above")}</option>
                  <option>{t("market.alert.below")}</option>
                </select>
                <Input placeholder={t("market.alert.pricePlaceholder")} type="number" className="flex-1" />
              </div>
            </div>
            <Button className="w-full">{t("market.alert.create")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("market.cropDetails.title", { crop: selectedCrop || "" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedCrop && cropPrices && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{t("market.cropDetails.currentPrice")}</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatKsh(cropPrices.find((c) => c.name === selectedCrop)?.price || 0)}
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{t("market.cropDetails.change")}</p>
                    <p
                      className={`text-xl font-bold ${
                        (cropPrices.find((c) => c.name === selectedCrop)?.change || 0) > 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {(cropPrices.find((c) => c.name === selectedCrop)?.change || 0) > 0 ? "+" : ""}
                      {cropPrices.find((c) => c.name === selectedCrop)?.change || 0}%
                    </p>
                  </div>
                </div>
                <div className="h-40 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  {t("market.cropDetails.chartPlaceholder")}
                </div>
                <Button className="w-full" onClick={() => setShowAlertModal(true)}>
                  {t("market.alert.title")}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
