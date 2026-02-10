import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listValueChains } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovValueChains() {
  const query = useQuery({
    queryKey: ["govValueChains"],
    queryFn: listValueChains,
  });

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading value chain data...</CardContent></Card>;
  }
  if (!query.data || query.data.length === 0) return <GovEmptyState />;

  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle>Commodity pipeline view</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {query.data.map((row: any) => (
          <div key={row.id} className="rounded border border-border/60 p-3 text-sm">
            <p className="font-medium capitalize">{row.commodity ?? row.id}</p>
            <p className="text-muted-foreground">Production proxy: {row.productionProxy ?? "--"} • Price trend: {row.priceTrend ?? "--"} • Transport risk: {row.transportRisk ?? "--"}</p>
            <p className="text-muted-foreground">Top destinations: {Array.isArray(row.topDestinations) ? row.topDestinations.join(", ") : "--"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

