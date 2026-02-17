import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuyerAlertItem } from "@/types/buyerDashboard";

type Props = {
  alerts: BuyerAlertItem[];
  onManageAlerts: () => void;
  onOpenAlertRoute: (route?: string) => void;
};

const badgeVariant = (severity: BuyerAlertItem["severity"]) => {
  if (severity === "high") return "destructive" as const;
  if (severity === "medium") return "secondary" as const;
  return "outline" as const;
};

export function BuyerAlertsPanel({ alerts, onManageAlerts, onOpenAlertRoute }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Smart Alerts</CardTitle>
        <Button size="sm" variant="outline" onClick={onManageAlerts}>Manage alerts</Button>
      </CardHeader>
      <CardContent>
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{alert.title}</p>
                  <Badge variant={badgeVariant(alert.severity)} className="capitalize">{alert.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.detail}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{alert.dateLabel}</p>
                  <Button size="sm" variant="ghost" onClick={() => onOpenAlertRoute(alert.ctaRoute)}>
                    {alert.ctaLabel || "Open"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No alerts yet. Alerts from pricing, contracts, and delivery reminders will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
