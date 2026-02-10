import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoopSummary } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovCooperativeDetail() {
  const { orgId = "" } = useParams();
  const query = useQuery({
    queryKey: ["govCoopSummary", orgId],
    enabled: Boolean(orgId),
    queryFn: () => getCoopSummary(orgId),
  });

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading cooperative summary...</CardContent></Card>;
  }
  if (!query.data) return <GovEmptyState title="No cooperative summary available." />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle>{query.data.orgName ?? "Cooperative summary"}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <p>County: <span className="font-medium">{query.data.county ?? "--"}</span></p>
          <p>Verified farmers: <span className="font-medium">{query.data.verifiedFarmers ?? 0}</span></p>
          <p>Trainings held: <span className="font-medium">{query.data.trainingsHeld ?? 0}</span></p>
          <p>Group sales volume: <span className="font-medium">{Number(query.data.groupSalesVolumeKg ?? 0).toLocaleString()} kg</span></p>
          <p>Group sales value: <span className="font-medium">KES {Number(query.data.groupSalesValueKES ?? 0).toLocaleString()}</span></p>
          <p>Seat usage: <span className="font-medium">{query.data.paidUsed ?? 0}/{query.data.paidTotal ?? 0} paid • {query.data.sponsoredUsed ?? 0}/{query.data.sponsoredTotal ?? 0} sponsored</span></p>
        </CardContent>
      </Card>
    </div>
  );
}

