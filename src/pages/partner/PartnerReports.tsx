import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerReports() {
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Donor/partner exports are enabled per cooperative via Phase 3 flags. No farmer PII is exposed here.
      </CardContent>
    </Card>
  );
}

