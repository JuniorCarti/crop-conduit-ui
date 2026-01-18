/**
 * Delivery Tab Component
 * Displays list of harvest deliveries with status and worker assignment
 */

import { Delivery, HarvestSchedule, Worker } from "@/types/harvest";
import { Truck, Trash2, MapPin, Calendar, User, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeliveryTabProps {
    deliveries: Delivery[];
    schedules: HarvestSchedule[];
    workers: Worker[];
    onDelete: (deliveryId: string) => Promise<void>;
    onEdit?: (delivery: Delivery) => void;
}

export default function DeliveryTab({
    deliveries,
    schedules,
    workers,
    onDelete,
    onEdit
}: DeliveryTabProps) {
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const getScheduleName = (scheduleId: string) => {
        return schedules.find((s) => s.id === scheduleId)?.field || "Unknown";
    };

    const getWorkerName = (workerId: string) => {
        return workers.find((w) => w.id === workerId)?.name || "Unassigned";
    };

    const getStatusBg = (status: Delivery["status"]) => {
        switch (status) {
            case "Delivered":
                return "bg-success/10 text-success";
            case "InTransit":
                return "bg-info/10 text-info";
            case "Pending":
                return "bg-warning/10 text-warning";
            case "Cancelled":
                return "bg-destructive/10 text-destructive";
            case "Delayed":
                return "bg-orange/10 text-orange";
            default:
                return "bg-muted/10 text-muted-foreground";
        }
    };

    const toDate = (value: Delivery["scheduledDate"]) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === "string") {
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        if (typeof value === "object" && "toDate" in value) {
            return value.toDate();
        }
        return null;
    };

    return (
        <>
            <div className="grid gap-3">
                {deliveries.map((delivery) => (
                    <div
                        key={delivery.id}
                        className="bg-card rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusBg(delivery.status)}`}>
                                    <Truck className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-sm">
                                            {delivery.quantity} {delivery.quantityUnit} → {delivery.destination}
                                        </h4>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBg(delivery.status)}`}>
                                            {delivery.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-2">
                                        From: <span className="font-medium">{getScheduleName(delivery.scheduleId)}</span>
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <p className="inline-flex items-center gap-2">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{delivery.destinationAddress}</span>
                                        </p>
                                        <p className="inline-flex items-center gap-2">
                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                            {(() => {
                                                const scheduledDate = toDate(delivery.scheduledDate);
                                                return scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "N/A";
                                            })()}
                                        </p>
                                        <p className="inline-flex items-center gap-2">
                                            <User className="h-3 w-3 flex-shrink-0" />
                                            {getWorkerName(delivery.assignedWorkerId)}
                                        </p>
                                        <p className="inline-flex items-center gap-2">
                                            <Package className="h-3 w-3 flex-shrink-0" />
                                            Vehicle: {delivery.vehicleType}
                                        </p>
                                    </div>

                                    {delivery.transportCost && (
                                        <p className="text-xs mt-2 text-muted-foreground">
                                            <span className="font-medium">Transport Cost:</span> {delivery.transportCost}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {typeof onEdit === "function" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(delivery)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <span className="sr-only">Edit delivery</span>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(delivery.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Delivery</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will remove the delivery from your schedule.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
