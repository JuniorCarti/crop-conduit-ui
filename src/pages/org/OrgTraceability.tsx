import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgTraceability() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Traceability</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Track batches, suppliers, and delivery steps (placeholder).
      </CardContent>
    </Card>
  );
}
