import { useState } from "react";
import { Package, Droplets, AlertCircle, Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { inventoryItems, recommendations, irrigationSchedule } from "@/data/dummyData";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Resources() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<typeof recommendations[0] | null>(null);

  const lowStockItems = inventoryItems.filter(i => i.status === "Low");

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Resource Management" 
        subtitle="Quartermaster Agent • Optimize inputs"
        icon={Package}
      >
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="animate-fade-up">
            <AlertCard
              type="warning"
              title="Low Stock Alert"
              message={`${lowStockItems.length} items are running low and need restocking`}
              action="View Items"
            />
          </div>
        )}

        <Tabs defaultValue="inventory" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="irrigation">Irrigation</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-4 space-y-3">
            {inventoryItems.map((item) => (
              <div 
                key={item.id}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      item.status === "Low" 
                        ? "bg-warning/10 text-warning" 
                        : "bg-success/10 text-success"
                    }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === "Low"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Stock Level</span>
                    <span className="text-xs text-muted-foreground">
                      Reorder at: {item.reorderAt} {item.unit}
                    </span>
                  </div>
                  <Progress 
                    value={(item.quantity / (item.reorderAt * 3)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered recommendations based on your field conditions
            </p>
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className="w-full bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {rec.type === "Irrigation" ? (
                      <Droplets className="h-5 w-5" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{rec.type}</p>
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {rec.field}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      {rec.product || rec.action}: {rec.amount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          {/* Irrigation Tab */}
          <TabsContent value="irrigation" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Weekly Schedule</p>
              <Button variant="ghost" size="sm" className="text-primary h-8">
                Edit Schedule
              </Button>
            </div>
            {irrigationSchedule.map((schedule, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{schedule.day}</p>
                    <p className="text-sm text-muted-foreground">{schedule.field}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{schedule.time}</p>
                  <p className="text-xs text-muted-foreground">{schedule.duration}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Track your farm inputs and supplies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Item Name</label>
              <Input placeholder="e.g., NPK Fertilizer" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Unit</label>
                <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  <option>kg</option>
                  <option>liters</option>
                  <option>bags</option>
                  <option>units</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reorder Level</label>
              <Input type="number" placeholder="Min quantity before alert" className="mt-1" />
            </div>
            <Button className="w-full">Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recommendation Detail Modal */}
      <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRecommendation?.type} Recommendation</DialogTitle>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4 mt-4">
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedRecommendation.reason}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Field</p>
                  <p className="font-medium text-foreground">{selectedRecommendation.field}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground">{selectedRecommendation.amount}</p>
                </div>
              </div>

              {selectedRecommendation.product && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-primary">Recommended Product</p>
                  <p className="text-lg font-bold text-foreground">{selectedRecommendation.product}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1">Apply Recommendation</Button>
                <Button variant="outline" className="flex-1">Schedule</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
