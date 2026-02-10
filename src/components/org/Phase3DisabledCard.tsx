import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Phase3DisabledCard({ title }: { title: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Phase 3 feature is disabled for this organization.
      </CardContent>
    </Card>
  );
}

