import { useState, useEffect } from "react";
import { Calendar, Droplets, AlertTriangle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrop, useUpdateCrop, useAddCropActivity } from "@/hooks/useCrops";
import { useSaveFieldHealth } from "@/hooks/useFieldHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

interface ManageCropModalProps {
  cropId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageCropModal({ cropId, open, onOpenChange }: ManageCropModalProps) {
  const { data: crop, isLoading } = useCrop(cropId);
  const updateCropMutation = useUpdateCrop();
  const addActivityMutation = useAddCropActivity();
  const saveFieldHealthMutation = useSaveFieldHealth();

  const [updateForm, setUpdateForm] = useState({
    estimatedYield: "",
    status: "",
    soilMoisture: "",
    ndvi: "",
    growthStage: "",
    alerts: [] as string[],
  });

  const [activityForm, setActivityForm] = useState({
    type: "irrigation" as "irrigation" | "fertilization" | "pesticide" | "other",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: "",
    unit: "",
  });

  const [newAlert, setNewAlert] = useState("");

  useEffect(() => {
    if (crop) {
      setUpdateForm({
        estimatedYield: crop.estimatedYield?.toString() || "",
        status: crop.status || "",
        soilMoisture: crop.soilMoisture?.toString() || "",
        ndvi: crop.ndvi?.toString() || "",
        growthStage: crop.growthStage || "",
        alerts: crop.alerts || [],
      });
    }
  }, [crop]);

  const handleUpdateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropId) return;

    try {
      const updates: any = {};
      
      if (updateForm.estimatedYield) {
        updates.estimatedYield = parseFloat(updateForm.estimatedYield);
      }
      if (updateForm.status) {
        updates.status = updateForm.status;
      }
      if (updateForm.soilMoisture) {
        updates.soilMoisture = parseFloat(updateForm.soilMoisture);
      }
      if (updateForm.ndvi) {
        updates.ndvi = parseFloat(updateForm.ndvi);
      }
      if (updateForm.growthStage) {
        updates.growthStage = updateForm.growthStage;
      }
      if (updateForm.alerts.length > 0) {
        updates.alerts = updateForm.alerts;
      }

      await updateCropMutation.mutateAsync({ cropId, updates });
      
      // Also save field health if status, NDVI, or moisture changed
      if (crop && (updateForm.status || updateForm.ndvi || updateForm.soilMoisture)) {
        try {
          await saveFieldHealthMutation.mutateAsync({
            fieldId: crop.fieldId || cropId,
            fieldName: crop.fieldName || crop.name,
            cropId: cropId,
            cropName: crop.name,
            health: updateForm.status === "Healthy" ? "Excellent" :
                   updateForm.status === "Needs Attention" ? "Moderate" :
                   updateForm.status === "Pest Alert" ? "Needs Attention" :
                   "Good",
            ndvi: updateForm.ndvi ? parseFloat(updateForm.ndvi) : undefined,
            moisture: updateForm.soilMoisture ? parseFloat(updateForm.soilMoisture) : undefined,
            lastChecked: new Date(),
          });
        } catch (healthError) {
          console.warn("Failed to save field health:", healthError);
          // Don't fail the whole update if health save fails
        }
      }
      
      toast.success("Crop updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update crop");
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropId) return;

    try {
      await addActivityMutation.mutateAsync({
        cropId,
        type: activityForm.type,
        date: new Date(activityForm.date),
        description: activityForm.description,
        amount: activityForm.amount ? parseFloat(activityForm.amount) : undefined,
        unit: activityForm.unit || undefined,
      });

      // Reset form
      setActivityForm({
        type: "irrigation",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        amount: "",
        unit: "",
      });

      toast.success("Activity recorded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to record activity");
    }
  };

  const handleAddAlert = () => {
    if (newAlert.trim()) {
      setUpdateForm(prev => ({
        ...prev,
        alerts: [...prev.alerts, newAlert.trim()],
      }));
      setNewAlert("");
    }
  };

  const handleRemoveAlert = (index: number) => {
    setUpdateForm(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index),
    }));
  };

  if (!cropId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Crop</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !crop ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Crop not found</p>
          </div>
        ) : (
          <Tabs defaultValue="update" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="update">Update Details</TabsTrigger>
              <TabsTrigger value="activity">Record Activity</TabsTrigger>
            </TabsList>

            {/* Update Crop Tab */}
            <TabsContent value="update" className="space-y-4">
              <form onSubmit={handleUpdateCrop} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedYield">Estimated Yield (tons/ha)</Label>
                    <Input
                      id="estimatedYield"
                      type="number"
                      step="0.1"
                      value={updateForm.estimatedYield}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, estimatedYield: e.target.value }))}
                      placeholder="e.g., 4.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={updateForm.status}
                      onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Healthy">Healthy</SelectItem>
                        <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                        <SelectItem value="Pest Alert">Pest Alert</SelectItem>
                        <SelectItem value="Harvest Ready">Harvest Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="soilMoisture">Soil Moisture (%)</Label>
                    <Input
                      id="soilMoisture"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={updateForm.soilMoisture}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, soilMoisture: e.target.value }))}
                      placeholder="e.g., 65"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ndvi">NDVI</Label>
                    <Input
                      id="ndvi"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={updateForm.ndvi}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, ndvi: e.target.value }))}
                      placeholder="e.g., 0.75"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="growthStage">Growth Stage</Label>
                  <Input
                    id="growthStage"
                    value={updateForm.growthStage}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, growthStage: e.target.value }))}
                    placeholder="e.g., Flowering, Maturity"
                  />
                </div>

                {/* Alerts Management */}
                <div>
                  <Label>Alerts</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newAlert}
                      onChange={(e) => setNewAlert(e.target.value)}
                      placeholder="Add an alert..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAlert();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddAlert} size="sm">
                      Add
                    </Button>
                  </div>
                  {updateForm.alerts.length > 0 && (
                    <div className="space-y-2">
                      {updateForm.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-warning/10 border border-warning/30 rounded-lg"
                        >
                          <span className="text-sm text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            {alert}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAlert(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateCropMutation.isPending}
                >
                  {updateCropMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Crop"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Record Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Select
                      value={activityForm.type}
                      onValueChange={(value: any) => setActivityForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="irrigation">Irrigation</SelectItem>
                        <SelectItem value="fertilization">Fertilization</SelectItem>
                        <SelectItem value="pesticide">Pesticide Application</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activityDate">Date</Label>
                    <Input
                      id="activityDate"
                      type="date"
                      value={activityForm.date}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="activityDescription">Description</Label>
                  <Textarea
                    id="activityDescription"
                    value={activityForm.description}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the activity..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityAmount">Amount (optional)</Label>
                    <Input
                      id="activityAmount"
                      type="number"
                      step="0.1"
                      value={activityForm.amount}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activityUnit">Unit (optional)</Label>
                    <Input
                      id="activityUnit"
                      value={activityForm.unit}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., L, kg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={addActivityMutation.isPending || !activityForm.description}
                >
                  {addActivityMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Activity"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

