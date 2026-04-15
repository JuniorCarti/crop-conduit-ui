import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarvestSchedule, Worker, Delivery } from "@/types/harvest";

interface Props {
  schedules: HarvestSchedule[];
  workers: Worker[];
  deliveries: Delivery[];
}

export function HarvestDashboard({ schedules, workers, deliveries }: Props) {
  const activeSchedules = schedules.filter((s) => ["Pending", "Ready", "InProgress"].includes(s.status));
  const readyToHarvest = schedules.filter((s) => s.status === "Ready");
  const assignedWorkers = workers.filter((w) => w.status === "Active");
  const pendingDeliveries = deliveries.filter((d) => ["Pending", "InTransit"].includes(d.status));

  const stats = [
    {
      label: "Active Schedules",
      value: activeSchedules.length,
      sub: `${schedules.filter((s) => s.status === "Harvested").length} harvested`,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
      tone: activeSchedules.length > 0 ? "good" : "neutral",
    },
    {
      label: "Ready to Harvest",
      value: readyToHarvest.length,
      sub: readyToHarvest.length > 0 ? `${readyToHarvest[0].cropName} is ready` : "No crops ready yet",
      icon: CheckCircle2,
      color: readyToHarvest.length > 0 ? "text-success" : "text-muted-foreground",
      bg: readyToHarvest.length > 0 ? "bg-success/10" : "bg-muted/40",
      tone: readyToHarvest.length > 0 ? "good" : "neutral",
    },
    {
      label: "Workers Assigned",
      value: assignedWorkers.length,
      sub: `${workers.length} total registered`,
      icon: Users,
      color: "text-info",
      bg: "bg-info/10",
      tone: "neutral",
    },
    {
      label: "Pending Deliveries",
      value: pendingDeliveries.length,
      sub: pendingDeliveries.filter((d) => d.status === "InTransit").length + " in transit",
      icon: Truck,
      color: pendingDeliveries.length > 0 ? "text-warning" : "text-muted-foreground",
      bg: pendingDeliveries.length > 0 ? "bg-warning/10" : "bg-muted/40",
      tone: pendingDeliveries.length > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
