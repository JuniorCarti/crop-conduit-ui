import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgMarketDashboard() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Group price dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Aggregated Market Oracle insights for your organization will appear here.
      </CardContent>
    </Card>
  );
}
