import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Truck,
  Users,
  Calendar,
  Plus,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useHarvestSchedules, useWorkers, useDeliveries } from "@/hooks/useHarvest";
import { useLogisticsRoute } from "@/hooks/useLogisticsRoute";
import { useAuth } from "@/contexts/AuthContext";
import { formatKsh } from "@/lib/currency";
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
  assignedScheduleIds: string[];
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
  assignedScheduleIds: [],
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

const formatDateDisplay = (value: unknown) => {
  const date = toDate(value);
  if (!date) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const scheduleStatusStyles: Record<HarvestSchedule["status"], string> = {
  Pending: "bg-warning/10 text-warning border-warning/30",
  Ready: "bg-success/10 text-success border-success/30",
  InProgress: "bg-info/10 text-info border-info/30",
  Harvested: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const deliveryStatusStyles: Record<Delivery["status"], string> = {
  Pending: "bg-warning/10 text-warning border-warning/30",
  InTransit: "bg-info/10 text-info border-info/30",
  Delivered: "bg-success/10 text-success border-success/30",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  Delayed: "bg-warning/10 text-warning border-warning/30",
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
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

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


  useEffect(() => {
    if (!schedules.length) {
      setSelectedScheduleId(null);
      return;
    }
    setSelectedScheduleId((prev) =>
      prev && schedules.some((schedule) => schedule.id === prev) ? prev : schedules[0].id,
    );
  }, [schedules]);

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) || null,
    [schedules, selectedScheduleId],
  );

  const scheduleWorkers = useMemo(
    () =>
      selectedScheduleId
        ? workers.filter((worker) => worker.assignedScheduleIds?.includes(selectedScheduleId))
        : [],
    [workers, selectedScheduleId],
  );

  const scheduleDeliveries = useMemo(
    () =>
      selectedScheduleId
        ? deliveries.filter((delivery) => delivery.scheduleId === selectedScheduleId)
        : [],
    [deliveries, selectedScheduleId],
  );

  const sortedDeliveries = useMemo(() => {
    return [...scheduleDeliveries].sort((a, b) => {
      const aDate = toDate(a.scheduledDate)?.getTime() ?? 0;
      const bDate = toDate(b.scheduledDate)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [scheduleDeliveries]);

  useEffect(() => {
    if (!sortedDeliveries.length) {
      setSelectedDeliveryId(null);
      return;
    }
    setSelectedDeliveryId((prev) =>
      prev && sortedDeliveries.some((delivery) => delivery.id === prev)
        ? prev
        : sortedDeliveries[0].id,
    );
  }, [sortedDeliveries]);

  const activeDelivery = useMemo(
    () => sortedDeliveries.find((delivery) => delivery.id === selectedDeliveryId) || sortedDeliveries[0] || null,
    [sortedDeliveries, selectedDeliveryId],
  );

  const workerGroups = useMemo(() => {
    const roles: Worker["role"][] = ["Harvester", "Supervisor", "Transporter", "Quality Inspector"];
    return roles.map((role) => ({
      role,
      workers: scheduleWorkers.filter((worker) => worker.role === role),
    }));
  }, [scheduleWorkers]);

  const availableWorkersForDelivery = useMemo(() => {
    if (!deliveryForm.scheduleId) return workers;
    return workers.filter((worker) => worker.assignedScheduleIds?.includes(deliveryForm.scheduleId));
  }, [workers, deliveryForm.scheduleId]);

  const logisticsParams = {
    crop: selectedSchedule?.cropName || "",
    origin: selectedSchedule?.farmId || selectedSchedule?.field || "",
    destination: activeDelivery?.destinationAddress || "",
  };

  const { data: logisticsData, loading: logisticsLoading, error: logisticsError } = useLogisticsRoute(logisticsParams);

  const riskLabel = logisticsData?.riskLevel || "Unknown";
  const riskBadgeClass =
    riskLabel === "Low"
      ? "bg-success/10 text-success border-success/30"
      : riskLabel === "Medium"
        ? "bg-warning/10 text-warning border-warning/30"
        : riskLabel === "High"
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-muted/40 text-muted-foreground border-border";

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
        assignedScheduleIds: worker.assignedScheduleIds || [],
      });
    } else {
      setEditingWorker(null);
      setWorkerForm({
        ...defaultWorkerForm,
        assignedScheduleIds: selectedScheduleId ? [selectedScheduleId] : [],
      });
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
      setDeliveryForm({
        ...defaultDeliveryForm,
        scheduleId: selectedScheduleId || "",
      });
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
    if (!workerForm.assignedScheduleIds.length) {
      setWorkerError("Assign this worker to at least one schedule.");
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
        assignedScheduleIds: workerForm.assignedScheduleIds,
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

      <div className="container mx-auto p-4 md:p-6 space-y-8">
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

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Harvest</Badge>
          <span>{'>'}</span>
          <Badge variant="outline">Workers</Badge>
          <span>{'>'}</span>
          <Badge variant="outline">Delivery</Badge>
          <span>{'>'}</span>
          <Badge variant="outline">Market</Badge>
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Harvest Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Select a schedule to sync workers, deliveries, and transport intelligence.
              </p>
            </div>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  onClick={() => setSelectedScheduleId(schedule.id)}
                  className={`border border-border/50 cursor-pointer transition-colors ${
                    schedule.id === selectedScheduleId
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {schedule.cropName || "Untitled Crop"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.field || "Field"} - {schedule.farmId || "Farm"}
                        </p>
                      </div>
                      <Badge className={scheduleStatusStyles[schedule.status]} variant="outline">
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Harvest date: {formatDateDisplay(schedule.optimalDate || schedule.estimatedReadyDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Quantity: {schedule.expectedYield} {schedule.yieldUnit}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openScheduleModal(schedule);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeSchedule(schedule.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Assigned Workers</h3>
              <p className="text-sm text-muted-foreground">
                {selectedSchedule
                  ? `Linked to ${selectedSchedule.cropName} - ${selectedSchedule.field}`
                  : "Select a harvest schedule to view assigned workers."}
              </p>
            </div>
            <Button size="sm" onClick={() => openWorkerModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
          </div>

          {!selectedScheduleId ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              Select a schedule to see assigned workers.
            </div>
          ) : workersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : scheduleWorkers.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border/50">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No workers assigned</p>
              <p className="text-sm text-muted-foreground">Assign workers to keep harvest operations in sync.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workerGroups.map((group) => (
                <Card key={group.role} className="border border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground">{group.role}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.workers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No {group.role.toLowerCase()} assigned.</p>
                    ) : (
                      group.workers.map((worker) => (
                        <div key={worker.id} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{worker.name}</p>
                            <p className="text-xs text-muted-foreground">{worker.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                worker.status === "Active"
                                  ? "bg-success/10 text-success border-success/30"
                                  : "bg-muted/40 text-muted-foreground border-border"
                              }
                            >
                              {worker.status}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => openWorkerModal(worker)}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Delivery Plan</h3>
              <p className="text-sm text-muted-foreground">
                {selectedSchedule
                  ? `Scheduled deliveries for ${selectedSchedule.cropName}`
                  : "Select a harvest schedule to view deliveries."}
              </p>
            </div>
            <Button size="sm" onClick={() => openDeliveryModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              New Delivery
            </Button>
          </div>

          {!selectedScheduleId ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              Select a schedule to see delivery plans.
            </div>
          ) : deliveriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : sortedDeliveries.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border/50">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">Delivery not scheduled</p>
              <p className="text-sm text-muted-foreground">Create a delivery to continue the flow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{delivery.destination}</p>
                        <p className="text-xs text-muted-foreground">{delivery.destinationAddress}</p>
                      </div>
                      <Badge className={deliveryStatusStyles[delivery.status]} variant="outline">
                        {delivery.status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateDisplay(delivery.scheduledDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {delivery.quantity} {delivery.quantityUnit}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDeliveryModal(delivery)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeDelivery(delivery.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Transport &amp; Logistics</h3>
              <p className="text-sm text-muted-foreground">
                Data-driven transport intelligence powered by Cloudflare D1.
              </p>
            </div>
            {sortedDeliveries.length > 1 && (
              <div className="w-full sm:w-72 space-y-1">
                <Label className="text-xs text-muted-foreground">Delivery</Label>
                <Select value={selectedDeliveryId || ""} onValueChange={(value) => setSelectedDeliveryId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedDeliveries.map((delivery) => (
                      <SelectItem key={delivery.id} value={delivery.id}>
                        {delivery.destination} - {formatDateDisplay(delivery.scheduledDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!selectedScheduleId ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              Select a schedule to see transport recommendations.
            </div>
          ) : !activeDelivery ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              Delivery not scheduled.
            </div>
          ) : logisticsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : logisticsData ? (
            <Card className="border border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {logisticsData.origin} - {logisticsData.destination}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs text-muted-foreground">Recommended vehicle</p>
                    <p className="font-semibold text-foreground">
                      {logisticsData.recommendedVehicle || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold text-foreground">
                      {logisticsData.distanceKm ? `${logisticsData.distanceKm} km` : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs text-muted-foreground">Estimated cost</p>
                    <p className="font-semibold text-foreground">
                      {logisticsData.estimatedCostKes != null ? formatKsh(logisticsData.estimatedCostKes) : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs text-muted-foreground">Risk level</p>
                    <Badge className={riskBadgeClass} variant="outline">
                      {riskLabel}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs text-muted-foreground">Departure window</p>
                    <p className="font-semibold text-foreground">
                      {logisticsData.departureWindow || "-"}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                  {logisticsData.notes || "No transport notes provided for this route."}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                {logisticsError || "No transport data available for this route."}
              </div>
            </div>
          )}
        </section>
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
              <div className="space-y-2 md:col-span-2">
                <Label>Assigned schedules</Label>
                {schedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Create a schedule before assigning workers.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {schedules.map((schedule) => (
                      <label
                        key={schedule.id}
                        className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-2 text-sm"
                      >
                        <Checkbox
                          checked={workerForm.assignedScheduleIds.includes(schedule.id)}
                          onCheckedChange={(checked) => {
                            setWorkerForm((prev) => {
                              const next = new Set(prev.assignedScheduleIds);
                              if (checked) {
                                next.add(schedule.id);
                              } else {
                                next.delete(schedule.id);
                              }
                              return { ...prev, assignedScheduleIds: Array.from(next) };
                            });
                          }}
                        />
                        <span className="truncate">{schedule.field} - {schedule.cropName}</span>
                      </label>
                    ))}
                  </div>
                )}
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
                    {availableWorkersForDelivery.map((worker) => (
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
