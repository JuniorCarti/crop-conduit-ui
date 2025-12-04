import { useState, useMemo } from "react";
import { Leaf, Droplets, Sun, AlertTriangle, Eye, Loader2, Plus, Filter, Search, Calendar, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCrops, useDeleteCrop } from "@/hooks/useCrops";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CropDetailsModal } from "@/components/crops/CropDetailsModal";
import { ManageCropModal } from "@/components/crops/ManageCropModal";
import { AddCropModal } from "@/components/crops/AddCropModal";
import { CropAnalysisCard } from "@/components/crops/CropAnalysisCard";
import { useAuth } from "@/contexts/AuthContext";

const cropTypes = ["Maize", "Wheat", "Sorghum", "Beans", "Tomatoes", "Potatoes", "Onions", "Other"];
const cropStatuses = ["Healthy", "Needs Attention", "Pest Alert", "Harvest Ready"];

export default function Crops() {
  const { currentUser } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [manageCropId, setManageCropId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
    search?: string;
    sortBy?: "plantingDate" | "harvestDate" | "estimatedYield" | "name";
    sortOrder?: "asc" | "desc";
  }>({
    sortBy: "plantingDate",
    sortOrder: "desc",
  });

  const { crops, isLoading, error } = useCrops(filters);
  const deleteCropMutation = useDeleteCrop();

  // Filter crops with alerts
  const cropsWithAlerts = useMemo(() => {
    return crops.filter(crop => crop.alerts && crop.alerts.length > 0);
  }, [crops]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
      case "Harvest Ready":
        return "bg-success/10 text-success border-success/30";
      case "Needs Attention":
        return "bg-warning/10 text-warning border-warning/30";
      case "Pest Alert":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const handleDelete = async (cropId: string) => {
    if (confirm("Are you sure you want to delete this crop?")) {
      await deleteCropMutation.mutateAsync(cropId);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertCard
          type="danger"
          title="Authentication Required"
          message="Please log in to view your crops"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Crops Dashboard" 
        subtitle="Sentinel Agent • Field monitoring"
        icon={Leaf}
      >
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Crop</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Debug Info (Development only) */}
        {import.meta.env.DEV && !isLoading && (
          <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Debug Info:</strong></p>
            <p>Total crops loaded: <strong>{crops.length}</strong></p>
            <p>User ID: {currentUser?.uid || "Not logged in"}</p>
            {crops.length > 0 && (
              <>
                <p>Crop IDs: {crops.map(c => c.id || "no-id").join(", ")}</p>
                <p>Crop Names: {crops.map(c => c.name).join(", ")}</p>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <AlertCard
            type="danger"
            title="Database Access Issue"
            message={
              error.message?.includes("permission") || error.message?.includes("security")
                ? "I couldn't fetch your crops due to a database access issue. Please check Firestore security rules and try again."
                : error.message || "Failed to load crops. Please try again later."
            }
          />
        )}

        {/* Alerts Summary */}
        {cropsWithAlerts.length > 0 && (
          <div className="animate-fade-up">
            <AlertCard
              type="warning"
              title={`${cropsWithAlerts.length} Crop${cropsWithAlerts.length > 1 ? "s" : ""} Need Attention`}
              message="Some crops have active alerts. Review them to take action."
              action="View Alerts"
            />
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Total Crops</p>
            <p className="text-2xl font-bold text-foreground">{crops.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Healthy</p>
            <p className="text-2xl font-bold text-success">
              {crops.filter(c => c.status === "Healthy").length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Needs Attention</p>
            <p className="text-2xl font-bold text-warning">
              {crops.filter(c => c.status === "Needs Attention" || c.status === "Pest Alert").length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Ready to Harvest</p>
            <p className="text-2xl font-bold text-info">
              {crops.filter(c => c.status === "Harvest Ready").length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-3 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crops by name, field, or type..."
              className="pl-10 bg-card"
              value={filters.search || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
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
              {cropTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {cropStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${filters.sortBy || "plantingDate"}-${filters.sortOrder || "desc"}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as "asc" | "desc" }));
            }}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plantingDate-desc">Newest First</SelectItem>
              <SelectItem value="plantingDate-asc">Oldest First</SelectItem>
              <SelectItem value="harvestDate-asc">Harvest Soon</SelectItem>
              <SelectItem value="harvestDate-desc">Harvest Later</SelectItem>
              <SelectItem value="estimatedYield-desc">Highest Yield</SelectItem>
              <SelectItem value="estimatedYield-asc">Lowest Yield</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Crops Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : crops.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No crops found yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.type || filters.status
                ? "Try adjusting your filters"
                : "Please add a crop to begin monitoring."}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Crop
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            {crops.map((crop, index) => (
              <div
                key={crop.id || `crop-${index}`}
                className={`bg-card rounded-xl p-5 border transition-all duration-200 hover:shadow-lg ${
                  crop.alerts && crop.alerts.length > 0
                    ? "border-warning/50 shadow-warning/10"
                    : "border-border/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{crop.name}</h3>
                    <p className="text-sm text-muted-foreground">{crop.type} • Location: {crop.field}</p>
                    {crop.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Date Added: {format(new Date(crop.createdAt), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(crop.status)}>
                    {crop.status}
                  </Badge>
                </div>

                {/* Alerts Badge */}
                {crop.alerts && crop.alerts.length > 0 && (
                  <div className="mb-3 flex items-center gap-2 text-warning text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{crop.alerts.length} alert{crop.alerts.length > 1 ? "s" : ""}</span>
                  </div>
                )}

                {/* Crop Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Planted
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(crop.plantingDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Harvest
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(crop.harvestDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Est. Yield
                    </span>
                    <span className="font-medium text-foreground">
                      {crop.estimatedYield} tons/ha
                    </span>
                  </div>
                  {crop.ndvi !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        NDVI
                      </span>
                      <span className={`font-medium ${
                        crop.ndvi >= 0.7 ? "text-success" :
                        crop.ndvi >= 0.5 ? "text-warning" : "text-destructive"
                      }`}>
                        {crop.ndvi.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {crop.soilMoisture !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Droplets className="h-3 w-3" />
                        Moisture
                      </span>
                      <span className="font-medium text-foreground">
                        {crop.soilMoisture}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCrop(crop.id || null)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => setManageCropId(crop.id || null)}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Crop Analysis Section */}
        {!isLoading && crops.length > 0 && !error && (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Crop Analysis & Monitoring
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Intelligent analysis of your crops including pest/disease risks, growth stages, and weather alerts.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {crops.map((crop, index) => (
                <div key={crop.id || `crop-analysis-${index}`} className="bg-card border border-border rounded-xl p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{crop.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {crop.type} • {crop.field}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Date Added: {format(new Date(crop.createdAt || crop.plantingDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <CropAnalysisCard crop={crop} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crop Details Modal */}
      {selectedCrop && (
        <CropDetailsModal
          cropId={selectedCrop}
          open={!!selectedCrop}
          onOpenChange={(open) => !open && setSelectedCrop(null)}
          onManage={() => {
            setSelectedCrop(null);
            setManageCropId(selectedCrop);
          }}
        />
      )}

      {/* Manage Crop Modal */}
      {manageCropId && (
        <ManageCropModal
          cropId={manageCropId}
          open={!!manageCropId}
          onOpenChange={(open) => !open && setManageCropId(null)}
        />
      )}

      {/* Add Crop Modal */}
      <AddCropModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
