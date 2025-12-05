import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResource, useUpdateResource } from "@/hooks/useResources";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { type Crop } from "@/services/firestore";

const resourceTypes = ["fertilizer", "seed", "pesticide", "water", "other"];

interface EditResourceModalProps {
  resourceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crops: Crop[];
}

export function EditResourceModal({ resourceId, open, onOpenChange, crops }: EditResourceModalProps) {
  const { resource, isLoading } = useResource(resourceId);
  const updateResourceMutation = useUpdateResource();

  const [formData, setFormData] = useState({
    name: "",
    type: "fertilizer" as "fertilizer" | "seed" | "pesticide" | "water" | "other",
    recommendedQuantity: "",
    unit: "kg",
    unitCost: "",
    cropId: "",
    supplier: "",
    supplierContact: "",
    applicationDate: "",
    stockLevel: "",
    reorderLevel: "",
    notes: "",
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || "",
        type: resource.type || "fertilizer",
        recommendedQuantity: resource.recommendedQuantity?.toString() || "",
        unit: resource.unit || "kg",
        unitCost: resource.unitCost?.toString() || "",
        cropId: resource.cropId || "",
        supplier: resource.supplier || "",
        supplierContact: resource.supplierContact || "",
        applicationDate: resource.applicationDate
          ? format(new Date(resource.applicationDate), "yyyy-MM-dd")
          : "",
        stockLevel: resource.stockLevel?.toString() || "",
        reorderLevel: resource.reorderLevel?.toString() || "",
        notes: resource.notes || "",
      });
    }
  }, [resource]);

  const totalCost = useMemo(() => {
    const qty = parseFloat(formData.recommendedQuantity) || 0;
    const cost = parseFloat(formData.unitCost) || 0;
    return qty * cost;
  }, [formData.recommendedQuantity, formData.unitCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;

    try {
      await updateResourceMutation.mutateAsync({
        resourceId,
        updates: {
          name: formData.name.trim(),
          type: formData.type,
          recommendedQuantity: parseFloat(formData.recommendedQuantity),
          unit: formData.unit,
          unitCost: parseFloat(formData.unitCost),
          totalCost: totalCost,
          cropId: formData.cropId || undefined,
          cropName: formData.cropId
            ? crops.find(c => c.id === formData.cropId)?.name
            : undefined,
          supplier: formData.supplier || undefined,
          supplierContact: formData.supplierContact || undefined,
          applicationDate: formData.applicationDate
            ? new Date(formData.applicationDate)
            : undefined,
          stockLevel: formData.stockLevel ? parseFloat(formData.stockLevel) : undefined,
          reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : undefined,
          notes: formData.notes || undefined,
        },
      });
      onOpenChange(false);
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  if (!resourceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Resource</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !resource ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Resource not found</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form structure as AddResourceModal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Resource Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cropId">Associated Crop</Label>
                <Select
                  value={formData.cropId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cropId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {crops.map(crop => (
                      <SelectItem key={crop.id} value={crop.id || ""}>
                        {crop.name} ({crop.field})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Quantity & Cost</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="recommendedQuantity">Quantity</Label>
                  <Input
                    id="recommendedQuantity"
                    type="number"
                    step="0.1"
                    value={formData.recommendedQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendedQuantity: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">Liters</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="acres">Acres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unitCost">Unit Cost (Ksh)</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cost:</span>
                  <span className="text-lg font-bold text-foreground">
                    {totalCost.toLocaleString("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm text-muted-foreground">Stock Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockLevel">Current Stock Level</Label>
                  <Input
                    id="stockLevel"
                    type="number"
                    step="0.1"
                    value={formData.stockLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockLevel: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    step="0.1"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm text-muted-foreground">Supplier Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Supplier Name</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="supplierContact">Supplier Contact</Label>
                  <Input
                    id="supplierContact"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="applicationDate">Application Date</Label>
              <Input
                id="applicationDate"
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

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
                disabled={updateResourceMutation.isPending}
              >
                {updateResourceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Resource"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


