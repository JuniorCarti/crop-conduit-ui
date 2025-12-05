import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCrop } from "@/hooks/useCrops";
import { format } from "date-fns";

const cropTypes = ["Maize", "Wheat", "Sorghum", "Beans", "Tomatoes", "Potatoes", "Onions", "Other"];
const cropStatuses = ["Healthy", "Needs Attention", "Pest Alert", "Harvest Ready"];

interface AddCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCropModal({ open, onOpenChange }: AddCropModalProps) {
  const createCropMutation = useCreateCrop();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    plantingDate: format(new Date(), "yyyy-MM-dd"),
    harvestDate: "",
    field: "",
    estimatedYield: "",
    status: "Healthy",
    soilMoisture: "",
    ndvi: "",
    growthStage: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Crop name is required";
    }
    if (!formData.type) {
      newErrors.type = "Crop type is required";
    }
    if (!formData.plantingDate) {
      newErrors.plantingDate = "Planting date is required";
    }
    if (!formData.harvestDate) {
      newErrors.harvestDate = "Harvest date is required";
    }
    if (!formData.field.trim()) {
      newErrors.field = "Field name is required";
    }
    if (!formData.estimatedYield) {
      newErrors.estimatedYield = "Estimated yield is required";
    }
    if (formData.estimatedYield && parseFloat(formData.estimatedYield) <= 0) {
      newErrors.estimatedYield = "Estimated yield must be greater than 0";
    }
    if (formData.harvestDate && formData.plantingDate && new Date(formData.harvestDate) <= new Date(formData.plantingDate)) {
      newErrors.harvestDate = "Harvest date must be after planting date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare crop data with proper defaults (no undefined values)
      const cropData: any = {
        name: formData.name.trim(),
        type: formData.type,
        plantingDate: new Date(formData.plantingDate),
        harvestDate: new Date(formData.harvestDate),
        field: formData.field.trim(),
        estimatedYield: parseFloat(formData.estimatedYield),
        status: formData.status as any,
      };

      // Only include optional fields if they have valid values
      if (formData.soilMoisture && formData.soilMoisture.trim() !== "") {
        const moisture = parseFloat(formData.soilMoisture);
        if (!isNaN(moisture) && moisture >= 0 && moisture <= 100) {
          cropData.soilMoisture = moisture;
        }
      }

      if (formData.ndvi && formData.ndvi.trim() !== "") {
        const ndvi = parseFloat(formData.ndvi);
        if (!isNaN(ndvi) && ndvi >= 0 && ndvi <= 1) {
          cropData.ndvi = ndvi;
        }
      }

      if (formData.growthStage && formData.growthStage.trim() !== "") {
        cropData.growthStage = formData.growthStage.trim();
      }

      // Debug log to show what data is being submitted
      console.log("[AddCropModal] Submitting crop data:", cropData);
      console.log("[AddCropModal] Form data:", formData);

      await createCropMutation.mutateAsync(cropData);

      // Reset form
      setFormData({
        name: "",
        type: "",
        plantingDate: format(new Date(), "yyyy-MM-dd"),
        harvestDate: "",
        field: "",
        estimatedYield: "",
        status: "Healthy",
        soilMoisture: "",
        ndvi: "",
        growthStage: "",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error: any) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Crop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Crop Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g., Maize Field A"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">
                  Crop Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, type: value }));
                    if (errors.type) setErrors(prev => ({ ...prev, type: "" }));
                  }}
                >
                  <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive mt-1">{errors.type}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="field">
                Field/Plot Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="field"
                value={formData.field}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, field: e.target.value }));
                  if (errors.field) setErrors(prev => ({ ...prev, field: "" }));
                }}
                placeholder="e.g., North Field, Plot 1"
                className={errors.field ? "border-destructive" : ""}
              />
              {errors.field && (
                <p className="text-xs text-destructive mt-1">{errors.field}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Dates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plantingDate">
                  Planting Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plantingDate"
                  type="date"
                  value={formData.plantingDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, plantingDate: e.target.value }));
                    if (errors.plantingDate) setErrors(prev => ({ ...prev, plantingDate: "" }));
                  }}
                  className={errors.plantingDate ? "border-destructive" : ""}
                />
                {errors.plantingDate && (
                  <p className="text-xs text-destructive mt-1">{errors.plantingDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="harvestDate">
                  Expected Harvest Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, harvestDate: e.target.value }));
                    if (errors.harvestDate) setErrors(prev => ({ ...prev, harvestDate: "" }));
                  }}
                  min={formData.plantingDate}
                  className={errors.harvestDate ? "border-destructive" : ""}
                />
                {errors.harvestDate && (
                  <p className="text-xs text-destructive mt-1">{errors.harvestDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Yield and Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Yield & Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedYield">
                  Estimated Yield (tons/ha) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="estimatedYield"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.estimatedYield}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, estimatedYield: e.target.value }));
                    if (errors.estimatedYield) setErrors(prev => ({ ...prev, estimatedYield: "" }));
                  }}
                  placeholder="e.g., 4.5"
                  className={errors.estimatedYield ? "border-destructive" : ""}
                />
                {errors.estimatedYield && (
                  <p className="text-xs text-destructive mt-1">{errors.estimatedYield}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cropStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Optional Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm text-muted-foreground">Optional Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="soilMoisture">Soil Moisture (%)</Label>
                <Input
                  id="soilMoisture"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.soilMoisture}
                  onChange={(e) => setFormData(prev => ({ ...prev, soilMoisture: e.target.value }))}
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
                  value={formData.ndvi}
                  onChange={(e) => setFormData(prev => ({ ...prev, ndvi: e.target.value }))}
                  placeholder="e.g., 0.75"
                />
              </div>

              <div>
                <Label htmlFor="growthStage">Growth Stage</Label>
                <Input
                  id="growthStage"
                  value={formData.growthStage}
                  onChange={(e) => setFormData(prev => ({ ...prev, growthStage: e.target.value }))}
                  placeholder="e.g., Flowering, Maturity"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createCropMutation.isPending}
            >
              {createCropMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Crop"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

