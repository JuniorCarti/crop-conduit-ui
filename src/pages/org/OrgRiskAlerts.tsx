import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgRiskAlerts() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Risk alerts</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Weather and price drop alerts for members (read-only placeholder).
      </CardContent>
    </Card>
  );
}
