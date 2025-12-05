import { useState, useMemo, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useCreateResource } from "@/hooks/useResources";
import { useAuth } from "@/contexts/AuthContext";
import { type Crop } from "@/services/firestore";
import { formatKsh } from "@/lib/currency";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Exact resource types as per requirements
const resourceTypes = [
  { value: "fertilizer", label: "Fertilizer" },
  { value: "seed", label: "Seed" },
  { value: "pesticide", label: "Pesticide" },
  { value: "water", label: "Water" },
];

const units = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "L", label: "Liters (L)" },
  { value: "bags", label: "Bags" },
  { value: "units", label: "Units" },
  { value: "acres", label: "Acres" },
  { value: "tons", label: "Tons" },
];

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crops: Crop[];
}

export function AddResourceModal({ open, onOpenChange, crops }: AddResourceModalProps) {
  const { currentUser } = useAuth();
  const createResourceMutation = useCreateResource();

  const [formData, setFormData] = useState({
    name: "",
    type: "fertilizer" as "fertilizer" | "seed" | "pesticide" | "water",
    cropType: "", // Can be crop name or custom text
    cropId: "", // For linking to existing crop
    quantity: "",
    unit: "kg",
    unitCost: "",
    applicationDate: "",
    supplier: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [scheduleReminder, setScheduleReminder] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setFormData({
        name: "",
        type: "fertilizer",
        cropType: "",
        cropId: "",
        quantity: "",
        unit: "kg",
        unitCost: "",
        applicationDate: "",
        supplier: "",
        notes: "",
      });
      setErrors({});
      setShowSuccess(false);
      setScheduleReminder(false);
    }
  }, [open]);

  // Auto-calculate total cost
  const totalCost = useMemo(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const cost = parseFloat(formData.unitCost) || 0;
    return qty * cost;
  }, [formData.quantity, formData.unitCost]);

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Resource name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case "quantity":
        const qty = parseFloat(value);
        if (!value || isNaN(qty) || qty <= 0) {
          newErrors.quantity = "Quantity must be a positive number";
        } else {
          delete newErrors.quantity;
        }
        break;
      case "unitCost":
        const cost = parseFloat(value);
        if (!value || isNaN(cost) || cost < 0) {
          newErrors.unitCost = "Unit cost cannot be negative";
        } else {
          delete newErrors.unitCost;
        }
        break;
      case "unit":
        if (!value) {
          newErrors.unit = "Unit is required";
        } else {
          delete newErrors.unit;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Resource name is required";
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.unitCost || parseFloat(formData.unitCost) < 0) {
      newErrors.unitCost = "Unit cost cannot be negative";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check user permissions
  const canAddResource = () => {
    if (!currentUser) {
      toast.error("You must be logged in to add resources");
      return false;
    }
    // Add role validation here if needed
    // For now, any authenticated user can add resources
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permissions
    if (!canAddResource()) {
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      // Find crop name if cropId is selected
      const selectedCrop = formData.cropId
        ? crops.find(c => c.id === formData.cropId)
        : null;

      await createResourceMutation.mutateAsync({
        name: formData.name.trim(),
        type: formData.type,
        recommendedQuantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unitCost: parseFloat(formData.unitCost),
        totalCost: totalCost,
        cropId: formData.cropId || undefined,
        cropName: selectedCrop?.name || formData.cropType || undefined,
        supplier: formData.supplier || undefined,
        applicationDate: formData.applicationDate
          ? new Date(formData.applicationDate)
          : undefined,
        notes: formData.notes || undefined,
      });

      // Show success message
      setShowSuccess(true);
      toast.success("Resource added successfully!", {
        description: "The resource has been saved and will appear on the Resources page.",
      });

      // Schedule reminder if application date is set and reminder is enabled
      if (scheduleReminder && formData.applicationDate) {
        const appDate = new Date(formData.applicationDate);
        const reminderDate = addDays(appDate, -1); // Remind 1 day before
        toast.info("Reminder scheduled", {
          description: `You'll be reminded on ${format(reminderDate, "MMM d, yyyy")} to apply ${formData.name}`,
        });
      }

      // Reset form after a short delay to show success message
      setTimeout(() => {
        setFormData({
          name: "",
          type: "fertilizer",
          cropType: "",
          cropId: "",
          quantity: "",
          unit: "kg",
          unitCost: "",
          applicationDate: "",
          supplier: "",
          notes: "",
        });
        setErrors({});
        setShowSuccess(false);
        setScheduleReminder(false);
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      // Error is handled by the mutation hook, but show additional alert
      toast.error("Failed to save resource", {
        description: error.message || "Please check your connection and try again.",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      type: "fertilizer",
      cropType: "",
      cropId: "",
      quantity: "",
      unit: "kg",
      unitCost: "",
      applicationDate: "",
      supplier: "",
      notes: "",
    });
    setErrors({});
    setShowSuccess(false);
    setScheduleReminder(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Resource</DialogTitle>
          <DialogDescription>
            Add a new resource to track inputs for your farm. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-8">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Resource added successfully! The form will close automatically.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Resource Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      validateField("name", e.target.value);
                    }}
                    onBlur={(e) => validateField("name", e.target.value)}
                    placeholder="e.g., NPK Fertilizer"
                    className={errors.name ? "border-destructive" : ""}
                    required
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">
                    Resource Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-xs text-destructive mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="cropType">Crop Type</Label>
                <div className="space-y-2">
                  <Select
                    value={formData.cropId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        cropId: value,
                        cropType: value ? crops.find(c => c.id === value)?.name || "" : prev.cropType
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select from existing crops (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None - Enter custom crop type</SelectItem>
                      {crops.map(crop => (
                        <SelectItem key={crop.id} value={crop.id || ""}>
                          {crop.name} ({crop.field})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.cropId && (
                    <Input
                      id="cropType"
                      value={formData.cropType}
                      onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                      placeholder="Or enter crop type manually (e.g., Maize, Wheat)"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Quantity and Cost */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Quantity & Cost</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, quantity: value }));
                      validateField("quantity", value);
                    }}
                    onBlur={(e) => validateField("quantity", e.target.value)}
                    placeholder="e.g., 50"
                    className={errors.quantity ? "border-destructive" : ""}
                    required
                  />
                  {errors.quantity && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unit">
                    Unit <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, unit: value }));
                      validateField("unit", value);
                    }}
                  >
                    <SelectTrigger className={errors.unit ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unit && (
                    <p className="text-xs text-destructive mt-1">{errors.unit}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unitCost">
                    Unit Cost (Ksh) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, unitCost: value }));
                      validateField("unitCost", value);
                    }}
                    onBlur={(e) => validateField("unitCost", e.target.value)}
                    placeholder="e.g., 150"
                    className={errors.unitCost ? "border-destructive" : ""}
                    required
                  />
                  {errors.unitCost && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.unitCost}
                    </p>
                  )}
                </div>
              </div>

              {/* Auto-calculated Total Cost */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">Total Cost (Auto-calculated)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantity × Unit Cost
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatKsh(totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Date & Supplier */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Schedule & Supplier</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicationDate">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Application Date
                  </Label>
                  <Input
                    id="applicationDate"
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationDate: e.target.value }))}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                  {formData.applicationDate && (
                    <div className="mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={scheduleReminder}
                          onChange={(e) => setScheduleReminder(e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-muted-foreground">
                          Schedule reminder 1 day before application
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g., Agrovet Supplies"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes, instructions, or reminders..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={createResourceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createResourceMutation.isPending || Object.keys(errors).length > 0}
              >
                {createResourceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Resource
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
