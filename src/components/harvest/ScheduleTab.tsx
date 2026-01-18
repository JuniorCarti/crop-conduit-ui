/**
 * Schedule Tab Component
 * Displays list of harvest schedules with status indicators
 */

import { HarvestSchedule } from "@/types/harvest";
import { Calendar, CheckCircle, Clock, AlertCircle, Trash2, Pencil } from "lucide-react";
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

interface ScheduleTabProps {
    schedules: HarvestSchedule[];
    onDelete: (scheduleId: string) => Promise<void>;
    onEdit?: (schedule: HarvestSchedule) => void;
}

export default function ScheduleTab({ schedules, onDelete, onEdit }: ScheduleTabProps) {
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

    const getStatusIcon = (status: HarvestSchedule["status"]) => {
        switch (status) {
            case "Ready":
                return <CheckCircle className="h-5 w-5 text-success" />;
            case "Pending":
                return <Clock className="h-5 w-5 text-warning" />;
            case "InProgress":
                return <Clock className="h-5 w-5 text-info" />;
            case "Harvested":
                return <CheckCircle className="h-5 w-5 text-success" />;
            default:
                return <AlertCircle className="h-5 w-5 text-destructive" />;
        }
    };

    const getStatusBg = (status: HarvestSchedule["status"]) => {
        switch (status) {
            case "Ready":
                return "bg-success/10 text-success";
            case "Pending":
                return "bg-warning/10 text-warning";
            case "InProgress":
                return "bg-info/10 text-info";
            case "Harvested":
                return "bg-success/10 text-success";
            default:
                return "bg-destructive/10 text-destructive";
        }
    };

    const toDate = (value: HarvestSchedule["plantedDate"]) => {
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
                {schedules.map((schedule) => (
                    <div
                        key={schedule.id}
                        className="bg-card rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusBg(schedule.status)}`}>
                                    {getStatusIcon(schedule.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm">{schedule.field}</h4>
                                    <p className="text-xs text-muted-foreground">{schedule.cropName}</p>

                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Planted: {(() => {
                                                const plantedDate = toDate(schedule.plantedDate);
                                                return plantedDate ? format(plantedDate, "MMM d, yyyy") : "N/A";
                                            })()}
                                        </span>
                                    </div>

                                    <div className="mt-2 text-xs space-y-1">
                                        <p><span className="font-medium">Ready Date:</span> {schedule.optimalDate}</p>
                                        <p><span className="font-medium">Expected Yield:</span> {schedule.expectedYield} {schedule.yieldUnit}</p>
                                        <p><span className="font-medium">Status:</span> <span className="capitalize">{schedule.status}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {typeof onEdit === "function" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(schedule)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <span className="sr-only">Edit schedule</span>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(schedule.id)}
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
                        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The schedule and all associated data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
