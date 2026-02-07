import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrgLoans() {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Loan offers</CardTitle>
        <Button size="sm" variant="outline">Create offer</Button>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Track loan offers and acceptance (placeholder).
      </CardContent>
    </Card>
  );
}
