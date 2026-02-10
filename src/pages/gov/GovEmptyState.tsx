import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GovEmptyState({ title = "No data available yet." }: { title?: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        No data available yet. Aggregates will appear once cooperatives submit data.
      </CardContent>
    </Card>
  );
}

