/**
 * Market Price Table Component
 * Displays market prices with search, sort, and filtering
 */

import { useState, useMemo } from "react";
import { Search, Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
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
import type { MarketPrice } from "@/services/marketPriceService";

interface MarketPriceTableProps {
  initialFilters?: {
    commodity?: string;
    market?: string;
    county?: string;
  };
}

const COMMODITIES = ["Tomato", "Onion", "Avocado", "Mango", "Irish Potato"];

export function MarketPriceTable({ initialFilters }: MarketPriceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string>(initialFilters?.commodity || "");
  const [selectedMarket, setSelectedMarket] = useState<string>(initialFilters?.market || "");
  const [selectedCounty, setSelectedCounty] = useState<string>(initialFilters?.county || "");
  const [sortBy, setSortBy] = useState<"date" | "wholesale" | "retail" | "volume">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { prices, isLoading } = useMarketPrices({
    commodity: selectedCommodity || undefined,
    market: selectedMarket || undefined,
    county: selectedCounty || undefined,
  });

  const syncPrices = useSyncMarketPrices();

  // Get unique markets and counties from prices
  const markets = useMemo(() => {
    const unique = new Set(prices.map((p) => p.market));
    return Array.from(unique).sort();
  }, [prices]);

  const counties = useMemo(() => {
    const unique = new Set(prices.map((p) => p.county).filter(Boolean));
    return Array.from(unique).sort();
  }, [prices]);

  // Filter and sort prices
  const filteredPrices = useMemo(() => {
    let filtered = [...prices];

    // Search filter
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

    // Sort
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
      } else {
        return aVal < bVal ? 1 : -1;
      }
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Prices</CardTitle>
            <CardDescription>Real-time market price data from Excel</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncPrices.mutate()}
              disabled={syncPrices.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncPrices.isPending ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
            <SelectTrigger>
              <SelectValue placeholder="All Commodities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Commodities</SelectItem>
              {COMMODITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger>
              <SelectValue placeholder="All Markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Markets</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger>
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Counties</SelectItem>
              {counties.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("wholesale")}
                  >
                    Wholesale {sortBy === "wholesale" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("retail")}
                  >
                    Retail {sortBy === "retail" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Grade</TableHead>
                  {filteredPrices.some((p) => p.volume) && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("volume")}
                    >
                      Volume {sortBy === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price) => {
                  const margin = price.retail - price.wholesale;
                  const marginPercent = price.wholesale > 0 ? (margin / price.wholesale) * 100 : 0;

                  return (
                    <TableRow key={price.id || `${price.commodity}-${price.market}-${price.date}`}>
                      <TableCell className="font-medium">
                        {format(price.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{price.commodity}</Badge>
                      </TableCell>
                      <TableCell>{price.market}</TableCell>
                      <TableCell>{price.county || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatKsh(price.wholesale)}
                      </TableCell>
                      <TableCell className="font-semibold">{formatKsh(price.retail)}</TableCell>
                      <TableCell>{price.grade || "N/A"}</TableCell>
                      {filteredPrices.some((p) => p.volume) && (
                        <TableCell>{price.volume ? `${price.volume}` : "N/A"}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No market prices found. Try adjusting your filters or sync the data.
          </div>
        )}

        {filteredPrices.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredPrices.length} of {prices.length} prices
          </div>
        )}
      </CardContent>
    </Card>
  );
}
