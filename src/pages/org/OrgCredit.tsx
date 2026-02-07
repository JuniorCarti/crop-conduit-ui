import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgCredit() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Credit scoring</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Basic credit score placeholders based on profile and sales volume.
      </CardContent>
    </Card>
  );
}
