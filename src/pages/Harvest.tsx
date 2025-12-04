import { useState } from "react";
import { Truck, Users, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { harvestSchedule, workers, deliverySchedule } from "@/data/dummyData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Harvest() {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<typeof harvestSchedule[0] | null>(null);

  const readyHarvests = harvestSchedule.filter(h => h.status === "Ready");

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Harvest & Logistics" 
        subtitle="Foreman Agent • Plan & execute"
        icon={Truck}
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Ready Alert */}
        {readyHarvests.length > 0 && (
          <div className="animate-fade-up">
            <AlertCard
              type="success"
              title="Harvest Ready!"
              message={`${readyHarvests[0].field} is ready for harvest. Optimal date: ${readyHarvests[0].optimalDate}`}
              action="Start Harvest"
              onAction={() => setSelectedHarvest(readyHarvests[0])}
            />
          </div>
        )}

        <Tabs defaultValue="schedule" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4 space-y-3">
            {harvestSchedule.map((harvest) => (
              <button
                key={harvest.id}
                onClick={() => setSelectedHarvest(harvest)}
                className="w-full bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      harvest.status === "Ready"
                        ? "bg-success/10 text-success"
                        : harvest.status === "Pending"
                        ? "bg-warning/10 text-warning"
                        : "bg-info/10 text-info"
                    }`}>
                      {harvest.status === "Ready" ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Clock className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{harvest.field}</p>
                      <p className="text-sm text-muted-foreground">{harvest.crop}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{harvest.workers} workers assigned</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      harvest.status === "Ready"
                        ? "bg-success/10 text-success"
                        : harvest.status === "Pending"
                        ? "bg-warning/10 text-warning"
                        : "bg-info/10 text-info"
                    }`}>
                      {harvest.status}
                    </span>
                    <p className="text-sm font-medium text-foreground mt-2">{harvest.optimalDate}</p>
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          {/* Workers Tab */}
          <TabsContent value="workers" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Available Workers</p>
              <Button variant="ghost" size="sm" className="text-primary h-8" onClick={() => setShowAssignModal(true)}>
                Assign Tasks
              </Button>
            </div>
            {workers.map((worker) => (
              <div 
                key={worker.id}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {worker.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    worker.status === "Available"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {worker.status}
                  </span>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-xs text-warning">★</span>
                    <span className="text-xs font-medium text-foreground">{worker.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Scheduled Deliveries</p>
              <Button variant="ghost" size="sm" className="text-primary h-8">
                New Delivery
              </Button>
            </div>
            {deliverySchedule.map((delivery) => (
              <div 
                key={delivery.id}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{delivery.cargo}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{delivery.destination}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      delivery.status === "Scheduled"
                        ? "bg-info/10 text-info"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {delivery.status}
                    </span>
                    <p className="text-sm font-medium text-foreground mt-1">{delivery.date}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Storage Recommendations */}
            <div className="bg-secondary rounded-xl p-4 mt-4">
              <h4 className="font-medium text-foreground mb-2">Storage Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Store maize at 13% moisture content or below</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Use hermetic bags for pest prevention</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Check storage temperature weekly</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Harvest Detail Modal */}
      <Dialog open={!!selectedHarvest} onOpenChange={() => setSelectedHarvest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Harvest Details</DialogTitle>
          </DialogHeader>
          {selectedHarvest && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Field</p>
                  <p className="font-medium text-foreground">{selectedHarvest.field}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Crop</p>
                  <p className="font-medium text-foreground">{selectedHarvest.crop}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Optimal Date</p>
                  <p className="font-medium text-foreground">{selectedHarvest.optimalDate}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Workers</p>
                  <p className="font-medium text-foreground">{selectedHarvest.workers} assigned</p>
                </div>
              </div>

              <div className={`rounded-lg p-3 ${
                selectedHarvest.status === "Ready"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}>
                <p className="font-medium">Status: {selectedHarvest.status}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Start Harvest</Button>
                <Button variant="outline" className="flex-1" onClick={() => {
                  setSelectedHarvest(null);
                  setShowAssignModal(true);
                }}>
                  Assign Workers
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Workers Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Workers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Select Task</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                {harvestSchedule.map(h => (
                  <option key={h.id}>{h.field} - {h.crop}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Available Workers</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workers.filter(w => w.status === "Available").map((worker) => (
                  <label 
                    key={worker.id}
                    className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80"
                  >
                    <input type="checkbox" className="rounded border-input" />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {worker.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.role}</p>
                    </div>
                    <span className="text-xs text-warning">★ {worker.rating}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full">Assign Selected Workers</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
