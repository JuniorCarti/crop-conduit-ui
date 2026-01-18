/**
 * FORM COMPONENT TEMPLATES
 * 
 * These are starter templates for the form components referenced in the modals.
 * Copy and adapt these to your specific UI component library and validation needs.
 * 
 * Location: src/components/harvest/
 */

// =============================================================================
// 1. SCHEDULE FORM COMPONENT
// =============================================================================
// File: src/components/harvest/ScheduleForm.tsx

/*
import { useState } from "react";
import { useHarvestSchedules } from "@/hooks/useHarvest";
import { CreateHarvestScheduleInput } from "@/types/harvest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ScheduleFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function ScheduleForm({ onSuccess, onError }: ScheduleFormProps) {
  const { add } = useHarvestSchedules();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateHarvestScheduleInput>({
    cropId: "",
    farmId: "",
    cropName: "",
    field: "",
    plantedDate: new Date(),
    estimatedReadyDate: new Date(),
    optimalDate: "",
    expectedYield: 0,
    yieldUnit: "kg",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await add(formData);
      toast.success("Schedule created successfully");
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast.error(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cropId">Crop ID</Label>
          <Input
            id="cropId"
            required
            value={formData.cropId}
            onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
            placeholder="e.g., crop-corn-001"
          />
        </div>
        
        <div>
          <Label htmlFor="cropName">Crop Name</Label>
          <Input
            id="cropName"
            required
            value={formData.cropName}
            onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
            placeholder="e.g., Corn"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="farmId">Farm ID</Label>
          <Input
            id="farmId"
            required
            value={formData.farmId}
            onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
            placeholder="e.g., farm-001"
          />
        </div>
        
        <div>
          <Label htmlFor="field">Field Name</Label>
          <Input
            id="field"
            required
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
            placeholder="e.g., Field A"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plantedDate">Planted Date</Label>
          <Input
            id="plantedDate"
            type="date"
            required
            value={formData.plantedDate instanceof Date ? formData.plantedDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, plantedDate: new Date(e.target.value) })}
          />
        </div>
        
        <div>
          <Label htmlFor="estimatedReadyDate">Estimated Ready Date</Label>
          <Input
            id="estimatedReadyDate"
            type="date"
            required
            value={formData.estimatedReadyDate instanceof Date ? formData.estimatedReadyDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, estimatedReadyDate: new Date(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="optimalDate">Optimal Harvest Date</Label>
          <Input
            id="optimalDate"
            type="date"
            required
            value={formData.optimalDate}
            onChange={(e) => setFormData({ ...formData, optimalDate: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="expectedYield">Expected Yield</Label>
          <Input
            id="expectedYield"
            type="number"
            required
            min="0"
            step="0.1"
            value={formData.expectedYield}
            onChange={(e) => setFormData({ ...formData, expectedYield: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="yieldUnit">Yield Unit</Label>
        <Select value={formData.yieldUnit} onValueChange={(value) => 
          setFormData({ ...formData, yieldUnit: value as any })
        }>
          <SelectTrigger id="yieldUnit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">Kilograms (kg)</SelectItem>
            <SelectItem value="tons">Metric Tons</SelectItem>
            <SelectItem value="bags">Bags</SelectItem>
            <SelectItem value="bundles">Bundles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any special notes about this harvest..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Schedule"}
      </Button>
    </form>
  );
}
*/

// =============================================================================
// 2. WORKER FORM COMPONENT
// =============================================================================
// File: src/components/harvest/WorkerForm.tsx

/*
import { useState } from "react";
import { useWorkers } from "@/hooks/useHarvest";
import { CreateWorkerInput, Worker } from "@/types/harvest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface WorkerFormProps {
  initialData?: Worker;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function WorkerForm({ initialData, onSuccess, onError }: WorkerFormProps) {
  const { add, update } = useWorkers();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateWorkerInput>({
    name: initialData?.name || "",
    role: initialData?.role || "Harvester",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    experience: initialData?.experience || "",
    emergencyContact: initialData?.emergencyContact || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (initialData) {
        await update(initialData.id, formData);
        toast.success("Worker updated successfully");
      } else {
        await add(formData);
        toast.success("Worker added successfully");
      }
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast.error(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., John Omondi"
        />
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => 
          setFormData({ ...formData, role: value as any })
        }>
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Harvester">Harvester</SelectItem>
            <SelectItem value="Supervisor">Supervisor</SelectItem>
            <SelectItem value="Transporter">Transporter</SelectItem>
            <SelectItem value="Quality Inspector">Quality Inspector</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          required
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="e.g., +254712345678"
        />
      </div>

      <div>
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="e.g., john@farm.local"
        />
      </div>

      <div>
        <Label htmlFor="experience">Experience (Optional)</Label>
        <Input
          id="experience"
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          placeholder="e.g., 5 years in field operations"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : initialData ? "Update Worker" : "Add Worker"}
      </Button>
    </form>
  );
}
*/

// =============================================================================
// 3. DELIVERY FORM COMPONENT
// =============================================================================
// File: src/components/harvest/DeliveryForm.tsx

/*
import { useState } from "react";
import { useDeliveries, useHarvestSchedules, useWorkers } from "@/hooks/useHarvest";
import { CreateDeliveryInput, Delivery } from "@/types/harvest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DeliveryFormProps {
  initialData?: Delivery;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function DeliveryForm({ initialData, onSuccess, onError }: DeliveryFormProps) {
  const { add, update } = useDeliveries();
  const { schedules } = useHarvestSchedules();
  const { workers } = useWorkers();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateDeliveryInput>({
    scheduleId: initialData?.scheduleId || "",
    assignedWorkerId: initialData?.assignedWorkerId || "",
    destination: initialData?.destination || "Market",
    destinationAddress: initialData?.destinationAddress || "",
    quantity: initialData?.quantity || 0,
    quantityUnit: initialData?.quantityUnit || "kg",
    scheduledDate: initialData?.scheduledDate || new Date(),
    vehicleType: initialData?.vehicleType || "Truck",
    transportCost: initialData?.transportCost || 0,
    notes: initialData?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (initialData) {
        await update(initialData.id, formData);
        toast.success("Delivery updated successfully");
      } else {
        await add(formData);
        toast.success("Delivery created successfully");
      }
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast.error(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduleId">Harvest Schedule *</Label>
          <Select value={formData.scheduleId} onValueChange={(value) => 
            setFormData({ ...formData, scheduleId: value })
          }>
            <SelectTrigger id="scheduleId">
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.field} ({s.cropName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assignedWorkerId">Assigned Worker *</Label>
          <Select value={formData.assignedWorkerId} onValueChange={(value) => 
            setFormData({ ...formData, assignedWorkerId: value })
          }>
            <SelectTrigger id="assignedWorkerId">
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name} ({w.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="destination">Destination *</Label>
          <Select value={formData.destination} onValueChange={(value) => 
            setFormData({ ...formData, destination: value as any })
          }>
            <SelectTrigger id="destination">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Market">Market</SelectItem>
              <SelectItem value="Warehouse">Warehouse</SelectItem>
              <SelectItem value="Buyer">Buyer</SelectItem>
              <SelectItem value="Processor">Processor</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="destinationAddress">Address *</Label>
          <Input
            id="destinationAddress"
            required
            value={formData.destinationAddress}
            onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
            placeholder="Full delivery address"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            required
            min="0"
            step="0.1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="quantityUnit">Unit *</Label>
          <Select value={formData.quantityUnit} onValueChange={(value) => 
            setFormData({ ...formData, quantityUnit: value as any })
          }>
            <SelectTrigger id="quantityUnit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="tons">Metric Tons</SelectItem>
              <SelectItem value="bags">Bags</SelectItem>
              <SelectItem value="bundles">Bundles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledDate">Scheduled Date *</Label>
          <Input
            id="scheduledDate"
            type="date"
            required
            value={formData.scheduledDate instanceof Date ? formData.scheduledDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, scheduledDate: new Date(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="vehicleType">Vehicle Type *</Label>
          <Select value={formData.vehicleType} onValueChange={(value) => 
            setFormData({ ...formData, vehicleType: value as any })
          }>
            <SelectTrigger id="vehicleType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Motorbike">Motorbike</SelectItem>
              <SelectItem value="Bicycle">Bicycle</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="transportCost">Transport Cost (Optional)</Label>
        <Input
          id="transportCost"
          type="number"
          min="0"
          step="0.1"
          value={formData.transportCost}
          onChange={(e) => setFormData({ ...formData, transportCost: parseFloat(e.target.value) || 0 })}
          placeholder="Cost in local currency"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Special instructions or notes..."
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : initialData ? "Update Delivery" : "Create Delivery"}
      </Button>
    </form>
  );
}
*/

// =============================================================================
// USAGE IN HARVEST.TSX
// =============================================================================

/*
// Import form components
import ScheduleForm from "@/components/harvest/ScheduleForm";
import WorkerForm from "@/components/harvest/WorkerForm";
import DeliveryForm from "@/components/harvest/DeliveryForm";

// In Harvest component:
export default function Harvest() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  return (
    <>
      {/* ... existing code ... */}

{/* Schedule Modal */ }
<Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Create Harvest Schedule</DialogTitle>
        </DialogHeader>
        <ScheduleForm onSuccess={() => setShowScheduleModal(false)} />
    </DialogContent>
</Dialog>

{/* Worker Modal */ }
<Dialog open={showWorkerModal} onOpenChange={setShowWorkerModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Add Worker</DialogTitle>
        </DialogHeader>
        <WorkerForm onSuccess={() => setShowWorkerModal(false)} />
    </DialogContent>
</Dialog>

{/* Delivery Modal */ }
<Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Create Delivery</DialogTitle>
        </DialogHeader>
        <DeliveryForm onSuccess={() => setShowDeliveryModal(false)} />
    </DialogContent>
</Dialog>
    </>
  );
}
*/

// =============================================================================
// VALIDATION HELPER (OPTIONAL)
// =============================================================================

export const validateScheduleForm = (data: any) => {
    const errors: string[] = [];

    if (!data.cropId?.trim()) errors.push("Crop ID is required");
    if (!data.cropName?.trim()) errors.push("Crop name is required");
    if (!data.farmId?.trim()) errors.push("Farm ID is required");
    if (!data.field?.trim()) errors.push("Field name is required");
    if (!data.plantedDate) errors.push("Planted date is required");
    if (!data.estimatedReadyDate) errors.push("Estimated ready date is required");
    if (!data.optimalDate) errors.push("Optimal date is required");
    if (data.expectedYield <= 0) errors.push("Expected yield must be greater than 0");
    if (!data.yieldUnit) errors.push("Yield unit is required");

    return errors;
};

export const validateWorkerForm = (data: any) => {
    const errors: string[] = [];

    if (!data.name?.trim()) errors.push("Name is required");
    if (!data.role) errors.push("Role is required");
    if (!data.phone?.trim()) errors.push("Phone is required");

    return errors;
};

export const validateDeliveryForm = (data: any) => {
    const errors: string[] = [];

    if (!data.scheduleId) errors.push("Schedule is required");
    if (!data.assignedWorkerId) errors.push("Worker is required");
    if (!data.destination) errors.push("Destination is required");
    if (!data.destinationAddress?.trim()) errors.push("Destination address is required");
    if (data.quantity <= 0) errors.push("Quantity must be greater than 0");
    if (!data.quantityUnit) errors.push("Unit is required");
    if (!data.scheduledDate) errors.push("Scheduled date is required");
    if (!data.vehicleType) errors.push("Vehicle type is required");

    return errors;
};
