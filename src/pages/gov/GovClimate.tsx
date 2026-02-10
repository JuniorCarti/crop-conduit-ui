import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNationalClimateSummary, safeArray } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovClimate() {
  const query = useQuery({
    queryKey: ["govClimateSummary"],
    queryFn: getNationalClimateSummary,
  });

  const countyRisks = useMemo(() => safeArray<any>(query.data?.countyRisks), [query.data?.countyRisks]);
  const advisories = useMemo(() => safeArray<any>(query.data?.advisoryHighlights), [query.data?.advisoryHighlights]);

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading climate risk summary...</CardContent></Card>;
  }
  if (!query.data) return <GovEmptyState />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle>7-day national climate risk summary</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p>Dry extremes: <span className="font-medium">{query.data.dryExtremes ?? "--"}</span></p>
          <p>Wet extremes: <span className="font-medium">{query.data.wetExtremes ?? "--"}</span></p>
          <p>Harvest disruption risk: <span className="font-medium">{query.data.harvestDisruptionRisk ?? "--"}</span></p>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader><CardTitle>County risk table</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {countyRisks.length === 0 ? <p className="text-sm text-muted-foreground">No county climate summaries yet.</p> : countyRisks.map((row) => (
            <div key={row.county} className="flex flex-wrap items-center justify-between rounded border border-border/60 px-3 py-2 text-sm gap-2">
              <span className="font-medium">{row.county}</span>
              <span>Flood: {row.floodRisk ?? "--"}</span>
              <span>Drought: {row.droughtRisk ?? "--"}</span>
              <span>Harvest: {row.harvestRisk ?? "--"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader><CardTitle>Advisory highlights</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {advisories.length === 0 ? <p className="text-sm text-muted-foreground">No advisories yet.</p> : advisories.map((row, index) => (
            <div key={`${index}-${row.title ?? "advisory"}`} className="rounded border border-border/60 p-3 text-sm">
              <p className="font-medium">{row.title ?? "Advisory"}</p>
              <p className="text-muted-foreground">{row.message ?? "--"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

