import { useMemo, useState, type FormEvent } from "react";
import { Truck, Users, Calendar, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useHarvestSchedules, useWorkers, useDeliveries } from "@/hooks/useHarvest";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleTab from "@/components/harvest/ScheduleTab";
import WorkersTab from "@/components/harvest/WorkersTab";
import DeliveryTab from "@/components/harvest/DeliveryTab";
import { Delivery, HarvestSchedule, Worker } from "@/types/harvest";

type ScheduleFormState = {
  cropId: string;
  farmId: string;
  cropName: string;
  field: string;
  plantedDate: string;
  estimatedReadyDate: string;
  optimalDate: string;
  expectedYield: string;
  yieldUnit: "kg" | "tons" | "bags" | "bundles";
  notes: string;
};

type WorkerFormState = {
  name: string;
  role: "Harvester" | "Supervisor" | "Transporter" | "Quality Inspector";
  phone: string;
  email: string;
  experience: string;
};

type DeliveryFormState = {
  scheduleId: string;
  assignedWorkerId: string;
  destination: "Market" | "Warehouse" | "Buyer" | "Processor" | "Other";
  destinationAddress: string;
  quantity: string;
  quantityUnit: "kg" | "tons" | "bags" | "bundles";
  scheduledDate: string;
  vehicleType: "Truck" | "Van" | "Motorbike" | "Bicycle" | "Other";
  transportCost: string;
  notes: string;
};

const defaultScheduleForm: ScheduleFormState = {
  cropId: "",
  farmId: "",
  cropName: "",
  field: "",
  plantedDate: "",
  estimatedReadyDate: "",
  optimalDate: "",
  expectedYield: "",
  yieldUnit: "kg",
  notes: "",
};

const defaultWorkerForm: WorkerFormState = {
  name: "",
  role: "Harvester",
  phone: "",
  email: "",
  experience: "",
};

const defaultDeliveryForm: DeliveryFormState = {
  scheduleId: "",
  assignedWorkerId: "",
  destination: "Market",
  destinationAddress: "",
  quantity: "",
  quantityUnit: "kg",
  scheduledDate: "",
  vehicleType: "Truck",
  transportCost: "",
  notes: "",
};

const toDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && value && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
};

const toInputDate = (value: unknown) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

export default function Harvest() {
  const { currentUser, loading: authLoading } = useAuth();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const [editingSchedule, setEditingSchedule] = useState<HarvestSchedule | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm);
  const [workerForm, setWorkerForm] = useState<WorkerFormState>(defaultWorkerForm);
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(defaultDeliveryForm);

  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavingWorker, setIsSavingWorker] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  const {
    schedules,
    loading: schedulesLoading,
    error: schedulesError,
    add: addSchedule,
    update: updateSchedule,
    remove: removeSchedule,
  } = useHarvestSchedules();
  const {
    workers,
    loading: workersLoading,
    error: workersError,
    add: addWorker,
    update: updateWorker,
    remove: removeWorker,
  } = useWorkers();
  const {
    deliveries,
    loading: deliveriesLoading,
    error: deliveriesError,
    add: addDelivery,
    update: updateDelivery,
    remove: removeDelivery,
  } = useDeliveries();

  const readyHarvests = useMemo(
    () => schedules.filter((schedule) => schedule.status === "Ready"),
    [schedules],
  );

  const openScheduleModal = (schedule?: HarvestSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        cropId: schedule.cropId || "",
        farmId: schedule.farmId || "",
        cropName: schedule.cropName || "",
        field: schedule.field || "",
        plantedDate: toInputDate(schedule.plantedDate),
        estimatedReadyDate: toInputDate(schedule.estimatedReadyDate),
        optimalDate: schedule.optimalDate || "",
        expectedYield: String(schedule.expectedYield ?? ""),
        yieldUnit: schedule.yieldUnit || "kg",
        notes: schedule.notes || "",
      });
    } else {
      setEditingSchedule(null);
      setScheduleForm(defaultScheduleForm);
    }
    setScheduleError(null);
    setShowScheduleModal(true);
  };

  const openWorkerModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerForm({
        name: worker.name || "",
        role: worker.role || "Harvester",
        phone: worker.phone || "",
        email: worker.email || "",
        experience: worker.experience || "",
      });
    } else {
      setEditingWorker(null);
      setWorkerForm(defaultWorkerForm);
    }
    setWorkerError(null);
    setShowWorkerModal(true);
  };

  const openDeliveryModal = (delivery?: Delivery) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setDeliveryForm({
        scheduleId: delivery.scheduleId || "",
        assignedWorkerId: delivery.assignedWorkerId || "",
        destination: delivery.destination || "Market",
        destinationAddress: delivery.destinationAddress || "",
        quantity: String(delivery.quantity ?? ""),
        quantityUnit: delivery.quantityUnit || "kg",
        scheduledDate: toInputDate(delivery.scheduledDate),
        vehicleType: delivery.vehicleType || "Truck",
        transportCost: delivery.transportCost ? String(delivery.transportCost) : "",
        notes: delivery.notes || "",
      });
    } else {
      setEditingDelivery(null);
      setDeliveryForm(defaultDeliveryForm);
    }
    setDeliveryError(null);
    setShowDeliveryModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setScheduleForm(defaultScheduleForm);
    setScheduleError(null);
  };

  const closeWorkerModal = () => {
    setShowWorkerModal(false);
    setEditingWorker(null);
    setWorkerForm(defaultWorkerForm);
    setWorkerError(null);
  };

  const closeDeliveryModal = () => {
    setShowDeliveryModal(false);
    setEditingDelivery(null);
    setDeliveryForm(defaultDeliveryForm);
    setDeliveryError(null);
  };

  const handleScheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleForm.cropName || !scheduleForm.field || !scheduleForm.plantedDate || !scheduleForm.estimatedReadyDate) {
      setScheduleError("Crop name, field, planted date, and estimated ready date are required.");
      return;
    }

    if (Number(scheduleForm.expectedYield || 0) <= 0) {
      setScheduleError("Expected yield must be greater than 0.");
      return;
    }

    setIsSavingSchedule(true);
    setScheduleError(null);

    try {
      const payload = {
        cropId: scheduleForm.cropId.trim(),
        farmId: scheduleForm.farmId.trim(),
        cropName: scheduleForm.cropName.trim(),
        field: scheduleForm.field.trim(),
        plantedDate: new Date(scheduleForm.plantedDate),
        estimatedReadyDate: new Date(scheduleForm.estimatedReadyDate),
        optimalDate: scheduleForm.optimalDate.trim(),
        expectedYield: Number(scheduleForm.expectedYield || 0),
        yieldUnit: scheduleForm.yieldUnit,
        notes: scheduleForm.notes.trim() || undefined,
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
      } else {
        await addSchedule(payload);
      }
      closeScheduleModal();
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Failed to save schedule.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleWorkerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workerForm.name || !workerForm.phone) {
      setWorkerError("Name and phone are required.");
      return;
    }

    setIsSavingWorker(true);
    setWorkerError(null);

    try {
      const payload = {
        name: workerForm.name.trim(),
        role: workerForm.role,
        phone: workerForm.phone.trim(),
        email: workerForm.email.trim() || undefined,
        experience: workerForm.experience.trim() || undefined,
      };

      if (editingWorker) {
        await updateWorker(editingWorker.id, payload);
      } else {
        await addWorker(payload);
      }
      closeWorkerModal();
    } catch (error) {
      setWorkerError(error instanceof Error ? error.message : "Failed to save worker.");
    } finally {
      setIsSavingWorker(false);
    }
  };

  const handleDeliverySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryForm.scheduleId || !deliveryForm.assignedWorkerId || !deliveryForm.destinationAddress || !deliveryForm.scheduledDate) {
      setDeliveryError("Schedule, worker, destination, and date are required.");
      return;
    }

    if (Number(deliveryForm.quantity || 0) <= 0) {
      setDeliveryError("Quantity must be greater than 0.");
      return;
    }

    setIsSavingDelivery(true);
    setDeliveryError(null);

    try {
      const payload = {
        scheduleId: deliveryForm.scheduleId,
        assignedWorkerId: deliveryForm.assignedWorkerId,
        destination: deliveryForm.destination,
        destinationAddress: deliveryForm.destinationAddress.trim(),
        quantity: Number(deliveryForm.quantity || 0),
        quantityUnit: deliveryForm.quantityUnit,
        scheduledDate: new Date(deliveryForm.scheduledDate),
        vehicleType: deliveryForm.vehicleType,
        transportCost: deliveryForm.transportCost ? Number(deliveryForm.transportCost) : undefined,
        notes: deliveryForm.notes.trim() || undefined,
      };

      if (editingDelivery) {
        await updateDelivery(editingDelivery.id, payload);
      } else {
        await addDelivery(payload);
      }
      closeDeliveryModal();
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : "Failed to save delivery.");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Harvest & Logistics" subtitle="Foreman Agent" icon={Truck} />
        <div className="container mx-auto p-4 md:p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser?.uid) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Harvest & Logistics" subtitle="Foreman Agent" icon={Truck} />
        <div className="container mx-auto p-4 md:p-6">
          <AlertCard
            type="danger"
            title="Authentication Required"
            message="Please log in to access Harvest & Logistics."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Harvest & Logistics" subtitle="Foreman Agent" icon={Truck} />

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {(schedulesError || workersError || deliveriesError) && (
          <AlertCard
            type="danger"
            title="Error Loading Data"
            message="Failed to sync data from Firestore. Please refresh or try again."
          />
        )}

        {readyHarvests.length > 0 && (
          <AlertCard
            type="success"
            title="Harvest Ready"
            message={`${readyHarvests[0].field} is ready. Optimal date: ${readyHarvests[0].optimalDate}`}
            action="View Details"
          />
        )}

        <Tabs defaultValue="schedule">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="schedule">
              Schedule
              {schedulesLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="workers">
              Workers
              {workersLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="delivery">
              Delivery
              {deliveriesLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Harvest Schedules</h3>
              <Button size="sm" onClick={() => openScheduleModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                New Schedule
              </Button>
            </div>
            {schedulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No harvest schedules yet</p>
                <p className="text-sm text-muted-foreground">Create your first schedule to get started</p>
              </div>
            ) : (
              <ScheduleTab
                schedules={schedules}
                onDelete={removeSchedule}
                onEdit={(schedule) => openScheduleModal(schedule)}
              />
            )}
          </TabsContent>

          <TabsContent value="workers" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Farm Workers</h3>
              <Button size="sm" onClick={() => openWorkerModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Worker
              </Button>
            </div>
            {workersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No workers added yet</p>
                <p className="text-sm text-muted-foreground">Add your first farm worker</p>
              </div>
            ) : (
              <WorkersTab
                workers={workers}
                onDelete={removeWorker}
                onEdit={(worker) => openWorkerModal(worker)}
              />
            )}
          </TabsContent>

          <TabsContent value="delivery" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Deliveries</h3>
              <Button size="sm" onClick={() => openDeliveryModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                New Delivery
              </Button>
            </div>
            {deliveriesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No deliveries scheduled</p>
                <p className="text-sm text-muted-foreground">Create your first delivery</p>
              </div>
            ) : (
              <DeliveryTab
                deliveries={deliveries}
                schedules={schedules}
                workers={workers}
                onDelete={removeDelivery}
                onEdit={(delivery) => openDeliveryModal(delivery)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showScheduleModal} onOpenChange={(open) => !open && closeScheduleModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Schedule" : "New Harvest Schedule"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleScheduleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="schedule-crop-name">Crop name</Label>
                <Input
                  id="schedule-crop-name"
                  value={scheduleForm.cropName}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, cropName: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-field">Field</Label>
                <Input
                  id="schedule-field"
                  value={scheduleForm.field}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, field: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-crop-id">Crop ID</Label>
                <Input
                  id="schedule-crop-id"
                  value={scheduleForm.cropId}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, cropId: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-farm-id">Farm ID</Label>
                <Input
                  id="schedule-farm-id"
                  value={scheduleForm.farmId}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, farmId: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-planted">Planted date</Label>
                <Input
                  id="schedule-planted"
                  type="date"
                  value={scheduleForm.plantedDate}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, plantedDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-estimated">Estimated ready date</Label>
                <Input
                  id="schedule-estimated"
                  type="date"
                  value={scheduleForm.estimatedReadyDate}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, estimatedReadyDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-optimal">Optimal date</Label>
                <Input
                  id="schedule-optimal"
                  type="date"
                  value={scheduleForm.optimalDate}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, optimalDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule-yield">Expected yield</Label>
                <Input
                  id="schedule-yield"
                  type="number"
                  min="0"
                  value={scheduleForm.expectedYield}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, expectedYield: event.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Yield unit</Label>
                <Select
                  value={scheduleForm.yieldUnit}
                  onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, yieldUnit: value as ScheduleFormState["yieldUnit"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="tons">tons</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="bundles">bundles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="schedule-notes">Notes</Label>
                <Textarea
                  id="schedule-notes"
                  value={scheduleForm.notes}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeScheduleModal} disabled={isSavingSchedule}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingSchedule}>
                {isSavingSchedule ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showWorkerModal} onOpenChange={(open) => !open && closeWorkerModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorker ? "Edit Worker" : "Add Worker"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleWorkerSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="worker-name">Name</Label>
                <Input
                  id="worker-name"
                  value={workerForm.name}
                  onChange={(event) => setWorkerForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={workerForm.role}
                  onValueChange={(value) => setWorkerForm((prev) => ({ ...prev, role: value as WorkerFormState["role"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Harvester">Harvester</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Transporter">Transporter</SelectItem>
                    <SelectItem value="Quality Inspector">Quality Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="worker-phone">Phone</Label>
                <Input
                  id="worker-phone"
                  value={workerForm.phone}
                  onChange={(event) => setWorkerForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="worker-email">Email</Label>
                <Input
                  id="worker-email"
                  type="email"
                  value={workerForm.email}
                  onChange={(event) => setWorkerForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="worker-experience">Experience</Label>
                <Input
                  id="worker-experience"
                  value={workerForm.experience}
                  onChange={(event) => setWorkerForm((prev) => ({ ...prev, experience: event.target.value }))}
                />
              </div>
            </div>
            {workerError && <p className="text-sm text-destructive">{workerError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeWorkerModal} disabled={isSavingWorker}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingWorker}>
                {isSavingWorker ? "Saving..." : "Save Worker"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryModal} onOpenChange={(open) => !open && closeDeliveryModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDelivery ? "Edit Delivery" : "New Delivery"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleDeliverySubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Schedule</Label>
                <Select
                  value={deliveryForm.scheduleId}
                  onValueChange={(value) => setDeliveryForm((prev) => ({ ...prev, scheduleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.field} - {schedule.cropName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assigned worker</Label>
                <Select
                  value={deliveryForm.assignedWorkerId}
                  onValueChange={(value) => setDeliveryForm((prev) => ({ ...prev, assignedWorkerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Destination type</Label>
                <Select
                  value={deliveryForm.destination}
                  onValueChange={(value) => setDeliveryForm((prev) => ({ ...prev, destination: value as DeliveryFormState["destination"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
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
              <div className="space-y-1">
                <Label htmlFor="delivery-destination">Destination address</Label>
                <Input
                  id="delivery-destination"
                  value={deliveryForm.destinationAddress}
                  onChange={(event) => setDeliveryForm((prev) => ({ ...prev, destinationAddress: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="delivery-quantity">Quantity</Label>
                <Input
                  id="delivery-quantity"
                  type="number"
                  min="0"
                  value={deliveryForm.quantity}
                  onChange={(event) => setDeliveryForm((prev) => ({ ...prev, quantity: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Quantity unit</Label>
                <Select
                  value={deliveryForm.quantityUnit}
                  onValueChange={(value) => setDeliveryForm((prev) => ({ ...prev, quantityUnit: value as DeliveryFormState["quantityUnit"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="tons">tons</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="bundles">bundles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="delivery-date">Scheduled date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryForm.scheduledDate}
                  onChange={(event) => setDeliveryForm((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Vehicle type</Label>
                <Select
                  value={deliveryForm.vehicleType}
                  onValueChange={(value) => setDeliveryForm((prev) => ({ ...prev, vehicleType: value as DeliveryFormState["vehicleType"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
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
              <div className="space-y-1">
                <Label htmlFor="delivery-cost">Transport cost</Label>
                <Input
                  id="delivery-cost"
                  type="number"
                  min="0"
                  value={deliveryForm.transportCost}
                  onChange={(event) => setDeliveryForm((prev) => ({ ...prev, transportCost: event.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="delivery-notes">Notes</Label>
                <Textarea
                  id="delivery-notes"
                  value={deliveryForm.notes}
                  onChange={(event) => setDeliveryForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            {deliveryError && <p className="text-sm text-destructive">{deliveryError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDeliveryModal} disabled={isSavingDelivery}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingDelivery}>
                {isSavingDelivery ? "Saving..." : "Save Delivery"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
