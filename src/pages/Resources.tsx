import { useState, useMemo } from "react";
import { Package, Plus, Search, Loader2, Edit, Trash2, X, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResources, useDeleteResource, useCreateResource } from "@/hooks/useResources";
import { formatKsh } from "@/lib/currency";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Resource types as per requirements
const resourceTypes = [
  { value: "Fertilizer", label: "Fertilizer" },
  { value: "Chemicals", label: "Chemicals" },
  { value: "Seeds", label: "Seeds" },
  { value: "Tools", label: "Tools" },
  { value: "Other", label: "Other" },
];

// Crop types
const cropTypes = [
  "Maize",
  "Wheat",
  "Beans",
  "Tomatoes",
  "Potatoes",
  "Onions",
  "Sorghum",
  "Rice",
  "Coffee",
  "Tea",
  "Other",
];

// Units as per requirements
const units = [
  { value: "KG", label: "KG" },
  { value: "Litre", label: "Litre" },
  { value: "Bags", label: "Bags" },
  { value: "Units", label: "Units" },
];

export default function Resources() {
  const { currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<{
    type?: string;
    crop?: string;
    sortBy?: "purchaseDate";
    sortOrder?: "asc" | "desc";
  }>({
    sortBy: "purchaseDate",
    sortOrder: "desc",
  });

  const { resources, isLoading, error } = useResources();
  const deleteResourceMutation = useDeleteResource();
  const createResourceMutation = useCreateResource();

  // Form state
  const [formData, setFormData] = useState({
    resourceName: "",
    type: "Fertilizer",
    crop: "",
    quantity: "",
    unit: "KG",
    supplierName: "",
    costPerUnit: "",
    purchaseDate: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate total cost
  const totalCost = useMemo(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const cost = parseFloat(formData.costPerUnit) || 0;
    return qty * cost;
  }, [formData.quantity, formData.costPerUnit]);

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = [...resources];

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(r => r.type.toLowerCase() === filters.type!.toLowerCase());
    }
    if (filters.crop) {
      filtered = filtered.filter(r => r.cropName === filters.crop);
    }

    // Apply sorting by purchase date
    if (filters.sortBy === "purchaseDate") {
      filtered.sort((a, b) => {
        const aDate = a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
        const bDate = b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
        return filters.sortOrder === "desc" ? bDate - aDate : aDate - bDate;
      });
    }

    return filtered;
  }, [resources, filters]);

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.resourceName.trim()) {
      errors.resourceName = "Resource name is required";
    }
    if (!formData.type) {
      errors.type = "Type is required";
    }
    if (!formData.crop) {
      errors.crop = "Crop is required";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.unit) {
      errors.unit = "Unit is required";
    }
    if (!formData.costPerUnit || parseFloat(formData.costPerUnit) < 0) {
      errors.costPerUnit = "Cost per unit cannot be negative";
    }
    if (!formData.purchaseDate) {
      errors.purchaseDate = "Purchase date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to add resources");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data with no undefined values
      const resourceData: any = {
        name: formData.resourceName.trim(),
        type: formData.type.toLowerCase() as any,
        recommendedQuantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unitCost: parseFloat(formData.costPerUnit),
        totalCost: totalCost,
        cropName: formData.crop,
        applicationDate: new Date(formData.purchaseDate),
      };

      // Only add optional fields if they have values (use empty string instead of undefined)
      if (formData.supplierName && formData.supplierName.trim()) {
        resourceData.supplier = formData.supplierName.trim();
      } else {
        resourceData.supplier = "";
      }

      // Notes must always be a string, never undefined
      resourceData.notes = formData.notes ? formData.notes.trim() : "";

      await createResourceMutation.mutateAsync(resourceData);

      // Reset form
      setFormData({
        resourceName: "",
        type: "Fertilizer",
        crop: "",
        quantity: "",
        unit: "KG",
        supplierName: "",
        costPerUnit: "",
        purchaseDate: "",
        notes: "",
      });
      setFormErrors({});
      setShowAddModal(false);
      toast.success("Resource added successfully!");
    } catch (error: any) {
      toast.error("Failed to save resource", {
        description: error.message || "Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      await deleteResourceMutation.mutateAsync(resourceId);
      toast.success("Resource deleted successfully!");
    } catch (error: any) {
      toast.error("Failed to delete resource");
    }
  };

  // Reset form when modal closes
  const handleCloseModal = () => {
    setFormData({
      resourceName: "",
      type: "Fertilizer",
      crop: "",
      quantity: "",
      unit: "KG",
      supplierName: "",
      costPerUnit: "",
      purchaseDate: "",
      notes: "",
    });
    setFormErrors({});
    setShowAddModal(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertCard
          type="danger"
          title="Authentication Required"
          message="Please log in to view your resources"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Quartermaster Resources" 
        subtitle="Quartermaster Agent • Optimize inputs"
        icon={Package}
      >
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Resource</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Error State */}
        {error && (
          <AlertCard
            type="danger"
            title="Error Loading Resources"
            message={error.message || "Failed to load resources. Please try again later."}
          />
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-10 bg-card"
            />
          </div>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-card">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {resourceTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.crop || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, crop: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-card">
              <SelectValue placeholder="Filter by crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {cropTypes.map(crop => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${filters.sortBy || "purchaseDate"}-${filters.sortOrder || "desc"}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as "asc" | "desc" }));
            }}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchaseDate-desc">Latest First</SelectItem>
              <SelectItem value="purchaseDate-asc">Earliest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resources List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredAndSortedResources.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No resources found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.type || filters.crop
                ? "Try adjusting your filters"
                : "Get started by adding your first resource"}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Resource
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-card rounded-xl p-5 border border-border/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{resource.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1).toLowerCase()}
                      </Badge>
                      {resource.cropName && (
                        <Badge variant="outline">
                          {resource.cropName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(resource.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium text-foreground">
                      {resource.recommendedQuantity} {resource.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost per Unit</span>
                    <span className="font-medium text-foreground">
                      {formatKsh(resource.unitCost || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-bold text-primary text-lg">
                      {formatKsh(resource.totalCost || 0)}
                    </span>
                  </div>
                  {resource.supplier && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Supplier</span>
                      <span className="font-medium text-foreground">{resource.supplier}</span>
                    </div>
                  )}
                  {resource.applicationDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Purchase Date
                      </span>
                      <span className="font-medium text-foreground">
                        {format(new Date(resource.applicationDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                {resource.notes && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground line-clamp-2">{resource.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredAndSortedResources.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total Resources</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredAndSortedResources.length}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-foreground">
                {formatKsh(
                  filteredAndSortedResources.reduce(
                    (sum, r) => sum + (r.totalCost || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to track inputs for your farm. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resourceName">
                  Resource Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="resourceName"
                  value={formData.resourceName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, resourceName: e.target.value }));
                    if (formErrors.resourceName) setFormErrors(prev => ({ ...prev, resourceName: "" }));
                  }}
                  className={formErrors.resourceName ? "border-destructive" : ""}
                  placeholder="e.g., NPK Fertilizer"
                  required
                />
                {formErrors.resourceName && (
                  <p className="text-xs text-destructive mt-1">{formErrors.resourceName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, type: value }));
                    if (formErrors.type) setFormErrors(prev => ({ ...prev, type: "" }));
                  }}
                >
                  <SelectTrigger className={formErrors.type ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-xs text-destructive mt-1">{formErrors.type}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="crop">
                Crop <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.crop}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, crop: value }));
                  if (formErrors.crop) setFormErrors(prev => ({ ...prev, crop: "" }));
                }}
              >
                <SelectTrigger className={formErrors.crop ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {cropTypes.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.crop && (
                <p className="text-xs text-destructive mt-1">{formErrors.crop}</p>
              )}
            </div>

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
                    setFormData(prev => ({ ...prev, quantity: e.target.value }));
                    if (formErrors.quantity) setFormErrors(prev => ({ ...prev, quantity: "" }));
                  }}
                  className={formErrors.quantity ? "border-destructive" : ""}
                  placeholder="e.g., 50"
                  required
                />
                {formErrors.quantity && (
                  <p className="text-xs text-destructive mt-1">{formErrors.quantity}</p>
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
                    if (formErrors.unit) setFormErrors(prev => ({ ...prev, unit: "" }));
                  }}
                >
                  <SelectTrigger className={formErrors.unit ? "border-destructive" : ""}>
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
                {formErrors.unit && (
                  <p className="text-xs text-destructive mt-1">{formErrors.unit}</p>
                )}
              </div>

              <div>
                <Label htmlFor="costPerUnit">
                  Cost per Unit (KSh) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerUnit}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, costPerUnit: e.target.value }));
                    if (formErrors.costPerUnit) setFormErrors(prev => ({ ...prev, costPerUnit: "" }));
                  }}
                  className={formErrors.costPerUnit ? "border-destructive" : ""}
                  placeholder="e.g., 150"
                  required
                />
                {formErrors.costPerUnit && (
                  <p className="text-xs text-destructive mt-1">{formErrors.costPerUnit}</p>
                )}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total Cost (Auto-calculated)</span>
                <span className="text-xl font-bold text-primary">
                  {formatKsh(totalCost)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierName">Supplier Name (Optional)</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="e.g., Agrovet Supplies"
                />
              </div>

              <div>
                <Label htmlFor="purchaseDate">
                  Purchase Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, purchaseDate: e.target.value }));
                    if (formErrors.purchaseDate) setFormErrors(prev => ({ ...prev, purchaseDate: "" }));
                  }}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className={formErrors.purchaseDate ? "border-destructive" : ""}
                  required
                />
                {formErrors.purchaseDate && (
                  <p className="text-xs text-destructive mt-1">{formErrors.purchaseDate}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Resource"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
