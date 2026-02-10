import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerImpact() {
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Impact (Aggregate)</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Aggregate impact for partner-linked cooperatives will appear here when Phase 3 impact sync is enabled.
      </CardContent>
    </Card>
  );
}

