import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMarketSnapshot, safeArray } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

const commodities = ["tomato", "onion", "potato", "cabbage"];
const counties = ["national", "nairobi", "nakuru", "kisumu", "uasin_gishu"];

export default function GovMarkets() {
  const [commodity, setCommodity] = useState("tomato");
  const [county, setCounty] = useState("national");

  const query = useQuery({
    queryKey: ["govMarkets", commodity, county],
    queryFn: () => getMarketSnapshot({ commodity, countyId: county === "national" ? null : county }),
  });

  const trend = useMemo(() => safeArray<{ day: string; retail: number; wholesale: number }>(query.data?.trend7d), [query.data?.trend7d]);
  const anomalies = useMemo(() => safeArray<{ title: string; direction: string }>(query.data?.anomalies), [query.data?.anomalies]);

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardContent className="pt-6 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Commodity</p>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{commodities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Region/county</p>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{counties.map((item) => <SelectItem key={item} value={item}>{item.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!query.data ? (
        <GovEmptyState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Avg retail price today</p><p className="text-xl font-semibold">KES {Number(query.data.avgRetailPrice ?? 0).toLocaleString()}</p></CardContent></Card>
            <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Avg wholesale price today</p><p className="text-xl font-semibold">KES {Number(query.data.avgWholesalePrice ?? 0).toLocaleString()}</p></CardContent></Card>
          </div>
          <Card className="border-border/60">
            <CardHeader><CardTitle>7-day trend</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {trend.length === 0 ? <p className="text-sm text-muted-foreground">No 7-day trend available.</p> : trend.map((row) => (
                <div key={row.day} className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-sm">
                  <span>{row.day}</span>
                  <span>Retail KES {Number(row.retail ?? 0).toLocaleString()} • Wholesale KES {Number(row.wholesale ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle>Market anomalies</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {anomalies.length === 0 ? <p className="text-sm text-muted-foreground">No anomalies detected.</p> : anomalies.map((row, index) => (
                <div key={`${row.title}-${index}`} className="rounded border border-border/60 p-3 text-sm">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-muted-foreground capitalize">{row.direction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

