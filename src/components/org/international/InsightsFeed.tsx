import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InternationalInsightItem } from "@/services/internationalSimulationService";

export function InsightsFeed({ items }: { items: InternationalInsightItem[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">International insights feed (simulation)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No simulated insights yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded border border-border/60 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">{item.title}</p>
                <Badge variant="outline">{item.severity}</Badge>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
