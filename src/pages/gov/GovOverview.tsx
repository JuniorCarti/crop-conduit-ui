import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNationalSummary, safeArray } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovOverview() {
  const query = useQuery({
    queryKey: ["govNationalSummary"],
    queryFn: getNationalSummary,
  });

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading overview...</CardContent></Card>;
  }

  if (!query.data) return <GovEmptyState />;

  const topCounties = safeArray<{ county: string; verifiedFarmers: number }>(query.data.topCounties);
  const risks = safeArray<{ title: string; severity: string }>(query.data.todayRisks);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Cooperatives onboarded</p><p className="text-2xl font-semibold">{Number(query.data.totalCooperatives ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Verified farmers</p><p className="text-2xl font-semibold">{Number(query.data.totalVerifiedFarmers ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active seats</p><p className="text-2xl font-semibold">{Number(query.data.totalActiveSeats ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Key risks today</p><p className="text-2xl font-semibold">{risks.length}</p></CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle>Top counties by verified farmers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {topCounties.length === 0 ? <p className="text-sm text-muted-foreground">No county ranking yet.</p> : topCounties.slice(0, 5).map((item) => (
            <div key={item.county} className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-sm">
              <span>{item.county}</span>
              <span className="font-medium">{Number(item.verifiedFarmers ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

