import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuyerActivityItem } from "@/types/buyerDashboard";

type ActivityKey = "recentOrders" | "recentBids" | "recentMessages" | "recentContractUpdates";

type Props = {
  data: Record<ActivityKey, BuyerActivityItem[]>;
  onOpenRoute: (route?: string) => void;
};

const labels: Record<ActivityKey, string> = {
  recentOrders: "Recent Orders",
  recentBids: "Recent Bids",
  recentMessages: "Recent Messages",
  recentContractUpdates: "Recent Contract Updates",
};

export function BuyerActivityTabs({ data, onOpenRoute }: Props) {
  const [active, setActive] = useState<ActivityKey>("recentOrders");
  const rows = useMemo(() => data[active] || [], [data, active]);

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3">
        <CardTitle>My Activity</CardTitle>
        <Tabs value={active} onValueChange={(value) => setActive(value as ActivityKey)}>
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {(Object.keys(labels) as ActivityKey[]).map((key) => (
              <TabsTrigger key={key} value={key} className="rounded-full border border-border px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {labels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.dateLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{row.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => onOpenRoute(row.ctaRoute)}>
                    {row.ctaLabel || "View"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No activity yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
