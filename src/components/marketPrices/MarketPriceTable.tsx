/**
 * Market Price Table Component
 * Displays market prices with search, sort, and filtering
 */

import { useState, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketPrices, useSyncMarketPrices } from "@/hooks/useMarketPrices";
import { formatKsh } from "@/lib/currency";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface MarketPriceTableProps {
  initialFilters?: {
    commodity?: string;
    market?: string;
    county?: string;
  };
}

const COMMODITIES = [
  { value: "Tomato", labelKey: "commodities.tomato" },
  { value: "Onion", labelKey: "commodities.onion" },
  { value: "Avocado", labelKey: "commodities.avocado" },
  { value: "Mango", labelKey: "commodities.mango" },
  { value: "Irish Potato", labelKey: "commodities.irishPotato" },
];

export function MarketPriceTable({ initialFilters }: MarketPriceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string>(initialFilters?.commodity || "");
  const [selectedMarket, setSelectedMarket] = useState<string>(initialFilters?.market || "");
  const [selectedCounty, setSelectedCounty] = useState<string>(initialFilters?.county || "");
  const [sortBy, setSortBy] = useState<"date" | "wholesale" | "retail" | "volume">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { t } = useTranslation();

  const { prices, isLoading } = useMarketPrices({
    commodity: selectedCommodity || undefined,
    market: selectedMarket || undefined,
    county: selectedCounty || undefined,
  });

  const syncPrices = useSyncMarketPrices();

  const markets = useMemo(() => {
    const unique = new Set(prices.map((p) => p.market));
    return Array.from(unique).sort();
  }, [prices]);

  const counties = useMemo(() => {
    const unique = new Set(prices.map((p) => p.county).filter(Boolean));
    return Array.from(unique).sort();
  }, [prices]);

  const filteredPrices = useMemo(() => {
    let filtered = [...prices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.commodity.toLowerCase().includes(query) ||
          p.market.toLowerCase().includes(query) ||
          p.county.toLowerCase().includes(query) ||
          p.grade?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "date":
          aVal = a.date.getTime();
          bVal = b.date.getTime();
          break;
        case "wholesale":
          aVal = a.wholesale;
          bVal = b.wholesale;
          break;
        case "retail":
          aVal = a.retail;
          bVal = b.retail;
          break;
        case "volume":
          aVal = a.volume || 0;
          bVal = b.volume || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [prices, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const renderSortLabel = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return (
      <span className="ml-1 text-xs text-muted-foreground">
        {sortOrder === "asc" ? t("marketPrices.table.sort.asc") : t("marketPrices.table.sort.desc")}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("marketPrices.table.title")}</CardTitle>
            <CardDescription>{t("marketPrices.table.subtitle")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncPrices.mutate()}
              disabled={syncPrices.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncPrices.isPending ? "animate-spin" : ""}`} />
              {t("marketPrices.table.sync")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("marketPrices.table.search")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
            <SelectTrigger>
              <SelectValue placeholder={t("marketPrices.table.allCommodities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("marketPrices.table.allCommodities")}</SelectItem>
              {COMMODITIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger>
              <SelectValue placeholder={t("marketPrices.table.allMarkets")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("marketPrices.table.allMarkets")}</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger>
              <SelectValue placeholder={t("marketPrices.table.allCounties")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("marketPrices.table.allCounties")}</SelectItem>
              {counties.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredPrices.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("date")}
                  >
                    {t("marketPrices.table.columns.date")}
                    {renderSortLabel("date")}
                  </TableHead>
                  <TableHead>{t("marketPrices.table.columns.commodity")}</TableHead>
                  <TableHead>{t("marketPrices.table.columns.market")}</TableHead>
                  <TableHead>{t("marketPrices.table.columns.county")}</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("wholesale")}
                  >
                    {t("marketPrices.table.columns.wholesale")}
                    {renderSortLabel("wholesale")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("retail")}
                  >
                    {t("marketPrices.table.columns.retail")}
                    {renderSortLabel("retail")}
                  </TableHead>
                  <TableHead>{t("marketPrices.table.columns.grade")}</TableHead>
                  {filteredPrices.some((p) => p.volume) && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("volume")}
                    >
                      {t("marketPrices.table.columns.volume")}
                      {renderSortLabel("volume")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price) => (
                  <TableRow key={price.id || `${price.commodity}-${price.market}-${price.date}`}>
                    <TableCell className="font-medium">
                      {format(price.date, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{price.commodity}</Badge>
                    </TableCell>
                    <TableCell>{price.market}</TableCell>
                    <TableCell>{price.county || t("common.na")}</TableCell>
                    <TableCell className="font-semibold">
                      {formatKsh(price.wholesale)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatKsh(price.retail)}</TableCell>
                    <TableCell>{price.grade || t("common.na")}</TableCell>
                    {filteredPrices.some((p) => p.volume) && (
                      <TableCell>{price.volume ? `${price.volume}` : t("common.na")}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("marketPrices.table.empty")}
          </div>
        )}

        {filteredPrices.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            {t("marketPrices.table.summary", {
              shown: filteredPrices.length,
              total: prices.length,
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
