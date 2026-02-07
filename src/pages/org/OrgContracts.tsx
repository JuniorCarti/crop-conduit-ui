import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrgContracts() {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Contracts</CardTitle>
        <Button size="sm" variant="outline">Create contract</Button>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Create and track supply contracts for enterprise partners.
      </CardContent>
    </Card>
  );
}
