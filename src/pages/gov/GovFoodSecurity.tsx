import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNationalFoodSecurity, safeArray } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovFoodSecurity() {
  const query = useQuery({
    queryKey: ["govFoodSecurity"],
    queryFn: getNationalFoodSecurity,
  });

  const atRisk = useMemo(() => safeArray<string>(query.data?.atRiskCounties), [query.data?.atRiskCounties]);
  const supply = useMemo(() => safeArray<{ crop: string; volumeKg: number }>(query.data?.supplyVolumes), [query.data?.supplyVolumes]);

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading food security dashboard...</CardContent></Card>;
  }
  if (!query.data) return <GovEmptyState />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">National food security index</p><p className="text-2xl font-semibold">{query.data.nationalIndex ?? "--"}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">At-risk counties</p><p className="text-2xl font-semibold">{atRisk.length}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Post-harvest loss reduction</p><p className="text-2xl font-semibold">{query.data.lossReductionPct ?? "--"}%</p></CardContent></Card>
      </div>
      <Card className="border-border/60">
        <CardHeader><CardTitle>At-risk counties</CardTitle></CardHeader>
        <CardContent>
          {atRisk.length === 0 ? <p className="text-sm text-muted-foreground">No at-risk counties currently flagged.</p> : <div className="flex flex-wrap gap-2">{atRisk.map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1 text-xs">{item}</span>)}</div>}
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader><CardTitle>Supply volumes by crop</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {supply.length === 0 ? <p className="text-sm text-muted-foreground">No supply data available.</p> : supply.map((item) => (
            <div key={item.crop} className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-sm">
              <span>{item.crop}</span>
              <span className="font-medium">{Number(item.volumeKg ?? 0).toLocaleString()} kg</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

