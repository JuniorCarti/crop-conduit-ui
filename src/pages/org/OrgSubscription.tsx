import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgSubscription() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Seat count: 0</p>
        <p className="text-sm text-muted-foreground">Billing: Placeholder</p>
        <p className="text-sm text-muted-foreground">Sponsored premium: Placeholder</p>
      </CardContent>
    </Card>
  );
}
